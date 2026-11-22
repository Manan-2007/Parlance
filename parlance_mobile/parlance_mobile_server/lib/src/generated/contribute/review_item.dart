/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters
// ignore_for_file: invalid_use_of_internal_member

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:parlance_mobile_server/src/generated/protocol.dart'
    as _ireuocbz;
import 'package:serverpod/serverpod.dart' as _is;

/// Someone else's sign to check. Never says who recorded it.
abstract class ReviewItem
    implements _is.SerializableModel, _is.ProtocolSerialization {
  ReviewItem._({
    required this.id,
    required this.gloss,
    required this.frames,
    required this.frameCount,
  });

  factory ReviewItem({
    required int id,
    required String gloss,
    required List<double> frames,
    required int frameCount,
  }) = _ReviewItemImpl;

  factory ReviewItem.fromJson(Map<String, dynamic> jsonSerialization) {
    return ReviewItem(
      id: jsonSerialization['id'] as int,
      gloss: jsonSerialization['gloss'] as String,
      frames: _ireuocbz.Protocol().deserialize<List<double>>(
        jsonSerialization['frames'],
      ),
      frameCount: jsonSerialization['frameCount'] as int,
    );
  }

  int id;

  String gloss;

  /// frameCount x 141 hand-position numbers, to draw as moving hands.
  List<double> frames;

  int frameCount;

  /// Returns a shallow copy of this [ReviewItem]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  ReviewItem copyWith({
    int? id,
    String? gloss,
    List<double>? frames,
    int? frameCount,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'ReviewItem',
      'id': id,
      'gloss': gloss,
      'frames': frames.toJson(),
      'frameCount': frameCount,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'ReviewItem',
      'id': id,
      'gloss': gloss,
      'frames': frames.toJson(),
      'frameCount': frameCount,
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _ReviewItemImpl extends ReviewItem {
  _ReviewItemImpl({
    required int id,
    required String gloss,
    required List<double> frames,
    required int frameCount,
  }) : super._(
         id: id,
         gloss: gloss,
         frames: frames,
         frameCount: frameCount,
       );

  /// Returns a shallow copy of this [ReviewItem]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  ReviewItem copyWith({
    int? id,
    String? gloss,
    List<double>? frames,
    int? frameCount,
  }) {
    return ReviewItem(
      id: id ?? this.id,
      gloss: gloss ?? this.gloss,
      frames: frames ?? this.frames.map((e0) => e0).toList(),
      frameCount: frameCount ?? this.frameCount,
    );
  }
}
