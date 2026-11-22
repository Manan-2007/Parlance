/// Sends what a speaker is saying to the live signer page (/embed/live).
///
/// The page signs it continuously; see `src/features/embed/EmbedLivePage.tsx`.
class LiveSignerController {
  void Function(String text, bool isFinal)? _send;
  void Function()? _reset;

  /// Called by the frame once its page can take words.
  void attach(
    void Function(String text, bool isFinal) send,
    void Function() reset,
  ) {
    _send = send;
    _reset = reset;
  }

  void detach() {
    _send = null;
    _reset = null;
  }

  /// What has been heard so far in the current utterance (growing while
  /// [isFinal] is false, once more when the utterance is final).
  void hear(String text, bool isFinal) => _send?.call(text, isFinal);

  /// Forget what was heard and signed.
  void reset() => _reset?.call();
}
