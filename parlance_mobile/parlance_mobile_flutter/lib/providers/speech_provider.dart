import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

enum MicStatus { off, starting, listening, unavailable, denied }

class SpeechState {
  const SpeechState({
    this.status = MicStatus.off,
    this.partial = '',
    this.error,
  });
  final MicStatus status;

  /// Words heard so far in the current sentence.
  final String partial;
  final String? error;

  bool get on => status == MicStatus.starting || status == MicStatus.listening;
}

/// Continuous speech captions. The phone's own recogniser stops after a pause,
/// so this restarts it until the person turns the microphone off, and hands
/// each finished sentence to [onSentence].
class SpeechController extends Notifier<SpeechState> {
  final _speech = SpeechToText();
  bool _ready = false;
  bool _wanted = false;
  String _locale = 'en_IN';
  void Function(String sentence)? _onSentence;
  void Function(String partial)? _onPartial;

  @override
  SpeechState build() {
    ref.onDispose(() {
      _wanted = false;
      unawaited(_speech.stop());
    });
    return const SpeechState();
  }

  Future<void> start({
    required String locale,
    required void Function(String sentence) onSentence,
    void Function(String partial)? onPartial,
  }) async {
    _locale = locale;
    _onSentence = onSentence;
    _onPartial = onPartial;
    _wanted = true;
    state = const SpeechState(status: MicStatus.starting);
    if (!_ready) {
      _ready = await _speech.initialize(onStatus: _status, onError: _error);
      if (!_ready) {
        _wanted = false;
        state = const SpeechState(
          status: MicStatus.unavailable,
          error:
              'Speech recognition is not available here. Type instead, or allow the microphone in settings.',
        );
        return;
      }
    }
    if (!await _speech.hasPermission) {
      _wanted = false;
      state = const SpeechState(
        status: MicStatus.denied,
        error: 'Allow the microphone so Parlance can hear speech.',
      );
      return;
    }
    await _listen();
  }

  Future<void> stop() async {
    _wanted = false;
    final pending = state.partial.trim();
    await _speech.stop();
    if (pending.isNotEmpty) _onSentence?.call(pending);
    state = const SpeechState();
  }

  Future<void> _listen() async {
    if (!_wanted) return;
    try {
      await _speech.listen(
        onResult: _result,
        listenOptions: SpeechListenOptions(
          localeId: _locale,
          listenFor: const Duration(minutes: 5),
          pauseFor: const Duration(seconds: 3),
          partialResults: true,
          listenMode: ListenMode.dictation,
          cancelOnError: false,
        ),
      );
      state = SpeechState(status: MicStatus.listening, partial: state.partial);
    } catch (error) {
      debugPrint('Speech listen failed: $error');
      _restartSoon();
    }
  }

  void _result(SpeechRecognitionResult result) {
    final words = result.recognizedWords.trim();
    if (result.finalResult) {
      state = SpeechState(status: state.status);
      if (words.isNotEmpty) _onSentence?.call(words);
    } else {
      state = SpeechState(status: state.status, partial: words);
      _onPartial?.call(words);
    }
  }

  void _status(String status) {
    if ((status == SpeechToText.doneStatus ||
            status == SpeechToText.notListeningStatus) &&
        _wanted) {
      _restartSoon();
    }
  }

  void _error(SpeechRecognitionError error) {
    // "No speech" and timeouts are normal in continuous captions.
    const quiet = {
      'error_no_match',
      'error_speech_timeout',
      'no-speech',
      'aborted',
    };
    if (quiet.contains(error.errorMsg)) return;
    if (error.errorMsg.contains('permission') ||
        error.errorMsg == 'not-allowed') {
      _wanted = false;
      state = const SpeechState(
        status: MicStatus.denied,
        error: 'Allow the microphone so Parlance can hear speech.',
      );
      return;
    }
    debugPrint('Speech error: ${error.errorMsg}');
  }

  Timer? _restart;
  void _restartSoon() {
    _restart?.cancel();
    _restart = Timer(const Duration(milliseconds: 300), () {
      if (_wanted && !_speech.isListening) unawaited(_listen());
    });
  }
}

final speechProvider = NotifierProvider<SpeechController, SpeechState>(
  SpeechController.new,
);

/// Reads text aloud, in Indian English or Hindi.
class Voice {
  Voice() {
    unawaited(_tts.awaitSpeakCompletion(false));
  }

  final _tts = FlutterTts();

  Future<void> say(String text, {bool hindi = false}) async {
    if (text.trim().isEmpty) return;
    await _tts.setLanguage(hindi ? 'hi-IN' : 'en-IN');
    await _tts.setSpeechRate(kIsWeb ? 0.95 : 0.48);
    await _tts.speak(text);
  }

  Future<void> stop() => _tts.stop();
}

final voiceProvider = Provider<Voice>((ref) => Voice());
