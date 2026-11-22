// The ISL landmark conv-transformer ensemble in plain Dart, so recognition runs
// inside the Serverpod server. Port of SignTransformer in
// parlance-isl/training/isl_transformer.py, with the weights exported by
// tool/export_recognizer.py from the checkpoints behind the shipped
// backend/models/isl-transformer.onnx (checked equal there, and checked here by
// test/recognition_model_test.dart).
//
// Input is one window of up to 48 feature frames with no padding, so the mask
// is all ones and drops out of the arithmetic.
import 'dart:math' as math;
import 'dart:typed_data';

import 'features.dart';

int _pad4(int n) => (n + 3) & ~3;

/// A linear layer, rows padded to a multiple of four for SIMD dot products.
class _Linear {
  _Linear(Float32List weight, this.bias, this.outputs, this.inputs)
    : stride = _pad4(inputs),
      rows = Float32List(0) {
    rows = Float32List(outputs * stride);
    for (var o = 0; o < outputs; o++) {
      rows.setRange(o * stride, o * stride + inputs, weight, o * inputs);
    }
    rows4 = Float32x4List.view(rows.buffer);
  }

  final Float32List bias;
  final int outputs;
  final int inputs;
  final int stride;
  Float32List rows;
  late final Float32x4List rows4;

  /// x: t rows of [stride] values (padding zero). Returns t rows of _pad4(outputs).
  Float32List apply(Float32List x, int t) {
    final outStride = _pad4(outputs);
    final out = Float32List(t * outStride);
    final x4 = Float32x4List.view(x.buffer);
    final lanes = stride >> 2;
    for (var r = 0; r < t; r++) {
      final xBase = r * lanes;
      for (var o = 0; o < outputs; o++) {
        final wBase = o * lanes;
        var acc = Float32x4.zero();
        for (var k = 0; k < lanes; k++) {
          acc += rows4[wBase + k] * x4[xBase + k];
        }
        out[r * outStride + o] = acc.x + acc.y + acc.z + acc.w + bias[o];
      }
    }
    return out;
  }
}

class _Norm {
  _Norm(this.weight, this.bias, this.eps);
  final Float32List weight;
  final Float32List bias;
  final double eps;

  Float32List apply(Float32List x, int t, int dim) {
    final stride = _pad4(dim);
    final out = Float32List(t * stride);
    for (var r = 0; r < t; r++) {
      final base = r * stride;
      var mean = 0.0;
      for (var i = 0; i < dim; i++) {
        mean += x[base + i];
      }
      mean /= dim;
      var variance = 0.0;
      for (var i = 0; i < dim; i++) {
        final d = x[base + i] - mean;
        variance += d * d;
      }
      final inv = 1 / math.sqrt(variance / dim + eps);
      for (var i = 0; i < dim; i++) {
        out[base + i] = (x[base + i] - mean) * inv * weight[i] + bias[i];
      }
    }
    return out;
  }
}

double _sigmoid(double v) => 1 / (1 + math.exp(-v));
double _silu(double v) => v * _sigmoid(v);

abstract class _Block {
  Float32List apply(Float32List x, int t);
}

class _ConvBlock implements _Block {
  _ConvBlock(
    this.dim,
    this.norm,
    this.expand,
    this.depthwise,
    this.depthBias,
    this.kernel,
    this.norm2,
    this.project,
  );
  final int dim;
  final _Norm norm;
  final _Linear expand;
  final Float32List depthwise; // (dim, kernel)
  final Float32List depthBias;
  final int kernel;
  final _Norm norm2;
  final _Linear project;

  @override
  Float32List apply(Float32List x, int t) {
    final stride = _pad4(dim);
    final expanded = expand.apply(norm.apply(x, t, dim), t); // (t, 2*dim)
    final wide = _pad4(dim * 2);
    final gated = Float32List(t * stride);
    for (var r = 0; r < t; r++) {
      for (var c = 0; c < dim; c++) {
        gated[r * stride + c] =
            expanded[r * wide + c] * _sigmoid(expanded[r * wide + dim + c]);
      }
    }
    final half = kernel ~/ 2;
    final conv = Float32List(t * stride);
    for (var r = 0; r < t; r++) {
      for (var c = 0; c < dim; c++) {
        var sum = depthBias[c];
        for (var k = 0; k < kernel; k++) {
          final source = r + k - half;
          if (source < 0 || source >= t) continue;
          sum += depthwise[c * kernel + k] * gated[source * stride + c];
        }
        conv[r * stride + c] = sum;
      }
    }
    final normed = norm2.apply(conv, t, dim);
    for (var i = 0; i < normed.length; i++) {
      normed[i] = _silu(normed[i]);
    }
    final y = project.apply(normed, t);
    final out = Float32List(t * stride);
    for (var i = 0; i < out.length; i++) {
      out[i] = x[i] + y[i];
    }
    return out;
  }
}

class _AttentionBlock implements _Block {
  _AttentionBlock(
    this.dim,
    this.heads,
    this.norm,
    this.qkv,
    this.out,
    this.norm2,
    this.ffnIn,
    this.ffnOut,
  );
  final int dim;
  final int heads;
  final _Norm norm;
  final _Linear qkv;
  final _Linear out;
  final _Norm norm2;
  final _Linear ffnIn;
  final _Linear ffnOut;

  @override
  Float32List apply(Float32List x, int t) {
    final stride = _pad4(dim);
    final hd = dim ~/ heads;
    final projected = qkv.apply(
      norm.apply(x, t, dim),
      t,
    ); // (t, 3 * heads * hd)
    final qs = _pad4(dim * 3);
    final scale = 1 / math.sqrt(hd);
    final mixed = Float32List(t * stride);
    final scores = Float64List(t);
    for (var h = 0; h < heads; h++) {
      final q0 = h * hd, k0 = dim + h * hd, v0 = 2 * dim + h * hd;
      for (var i = 0; i < t; i++) {
        var peak = -double.infinity;
        for (var j = 0; j < t; j++) {
          var dot = 0.0;
          for (var d = 0; d < hd; d++) {
            dot += projected[i * qs + q0 + d] * projected[j * qs + k0 + d];
          }
          scores[j] = dot * scale;
          if (scores[j] > peak) peak = scores[j];
        }
        var total = 0.0;
        for (var j = 0; j < t; j++) {
          scores[j] = math.exp(scores[j] - peak);
          total += scores[j];
        }
        for (var d = 0; d < hd; d++) {
          var sum = 0.0;
          for (var j = 0; j < t; j++) {
            sum += scores[j] * projected[j * qs + v0 + d];
          }
          mixed[i * stride + h * hd + d] = sum / total;
        }
      }
    }
    final attended = out.apply(mixed, t);
    final after = Float32List(t * stride);
    for (var i = 0; i < after.length; i++) {
      after[i] = x[i] + attended[i];
    }
    final hidden = ffnIn.apply(norm2.apply(after, t, dim), t);
    for (var i = 0; i < hidden.length; i++) {
      hidden[i] = _silu(hidden[i]);
    }
    final ff = ffnOut.apply(hidden, t);
    for (var i = 0; i < after.length; i++) {
      after[i] += ff[i];
    }
    return after;
  }
}

class _Member {
  _Member(
    this.dim,
    this.stem,
    this.stemNorm,
    this.blocks,
    this.norm,
    this.head,
    this.classes,
  );
  final int dim;
  final _Linear stem;
  final _Norm stemNorm;
  final List<_Block> blocks;
  final _Norm norm;
  final _Linear head;
  final int classes;

  /// Class probabilities for one unpadded window.
  Float64List probabilities(List<Float64List> frames) {
    final t = frames.length;
    final inStride = _pad4(frameSize * 2);
    final input = Float32List(t * inStride);
    for (var r = 0; r < t; r++) {
      final previous = frames[r == 0 ? 0 : r - 1];
      for (var c = 0; c < frameSize; c++) {
        input[r * inStride + c] = frames[r][c];
        input[r * inStride + frameSize + c] = r == 0
            ? 0
            : frames[r][c] - previous[c];
      }
    }
    var x = stemNorm.apply(stem.apply(input, t), t, dim);
    for (final block in blocks) {
      x = block.apply(x, t);
    }
    x = norm.apply(x, t, dim);
    final stride = _pad4(dim);
    final pooled = Float32List(_pad4(dim * 2));
    for (var c = 0; c < dim; c++) {
      var sum = 0.0, peak = -double.infinity;
      for (var r = 0; r < t; r++) {
        final v = x[r * stride + c];
        sum += v;
        if (v > peak) peak = v;
      }
      pooled[c] = sum / t;
      pooled[dim + c] = peak;
    }
    final logits = head.apply(pooled, 1);
    var top = -double.infinity;
    for (var i = 0; i < classes; i++) {
      top = math.max(top, logits[i]);
    }
    final probs = Float64List(classes);
    var total = 0.0;
    for (var i = 0; i < classes; i++) {
      probs[i] = math.exp(logits[i] - top);
      total += probs[i];
    }
    for (var i = 0; i < classes; i++) {
      probs[i] /= total;
    }
    return probs;
  }
}

/// The ensemble: averages member probabilities and returns log-probabilities,
/// like the exported ONNX graph.
class SignTransformerEnsemble {
  SignTransformerEnsemble._(this._members, this.classes);

  final List<_Member> _members;
  final int classes;

  /// Builds the ensemble from transformer.json metadata and transformer.bin.
  factory SignTransformerEnsemble.load(
    Map<String, dynamic> meta,
    ByteData weights,
  ) {
    final floats = weights.buffer.asFloat32List(
      weights.offsetInBytes,
      weights.lengthInBytes ~/ 4,
    );
    final eps = (meta['layerNormEps'] as num).toDouble();
    final kernel = meta['convKernel'] as int;
    final classes = (meta['labels'] as List).length;
    final tensors = <int, Map<String, Float32List>>{};
    for (final t in (meta['tensors'] as List).cast<Map<String, dynamic>>()) {
      final shape = (t['shape'] as List).cast<int>();
      final size = shape.fold<int>(1, (a, b) => a * b);
      final offset = t['offset'] as int;
      (tensors[t['member'] as int] ??= {})[t['name'] as String] =
          Float32List.fromList(floats.sublist(offset, offset + size));
    }
    final members = <_Member>[];
    final specs = (meta['members'] as List).cast<Map<String, dynamic>>();
    for (var m = 0; m < specs.length; m++) {
      final dim = specs[m]['dim'] as int;
      final depth = specs[m]['depth'] as int;
      final heads = specs[m]['heads'] as int;
      final w = tensors[m]!;
      _Linear linear(String name, int outputs, int inputs) =>
          _Linear(w['$name.weight']!, w['$name.bias']!, outputs, inputs);
      _Norm norm(String name) =>
          _Norm(w['$name.weight']!, w['$name.bias']!, eps);
      final blocks = <_Block>[];
      for (var i = 0; i < depth * 3; i++) {
        final p = 'layers.$i';
        if (i % 3 == 2) {
          blocks.add(
            _AttentionBlock(
              dim,
              heads,
              norm('$p.norm'),
              linear('$p.qkv', dim * 3, dim),
              linear('$p.out', dim, dim),
              norm('$p.norm2'),
              linear('$p.ffn.0', dim * 2, dim),
              linear('$p.ffn.3', dim, dim * 2),
            ),
          );
        } else {
          blocks.add(
            _ConvBlock(
              dim,
              norm('$p.norm'),
              linear('$p.expand', dim * 2, dim),
              w['$p.depthwise.weight']!,
              w['$p.depthwise.bias']!,
              kernel,
              norm('$p.norm2'),
              linear('$p.project', dim, dim),
            ),
          );
        }
      }
      members.add(
        _Member(
          dim,
          linear('stem.0', dim, frameSize * 2),
          norm('stem.1'),
          blocks,
          norm('norm'),
          linear('head.1', classes, dim * 2),
          classes,
        ),
      );
    }
    return SignTransformerEnsemble._(members, classes);
  }

  /// Log of the averaged member probabilities (the ONNX model's "logits").
  Float64List logits(List<Float64List> frames) {
    final mean = Float64List(classes);
    for (final member in _members) {
      final p = member.probabilities(frames);
      for (var i = 0; i < classes; i++) {
        mean[i] += p[i] / _members.length;
      }
    }
    for (var i = 0; i < classes; i++) {
      mean[i] = math.log(math.max(mean[i], 1e-8));
    }
    return mean;
  }
}
