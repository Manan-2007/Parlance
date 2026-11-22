import 'package:flutter_test/flutter_test.dart';
import 'package:parlance_mobile/features/signer/live_signer_controller.dart';

void main() {
  test('words reach the signer page once it is attached, and stop after', () {
    final controller = LiveSignerController();
    final heard = <(String, bool)>[];
    var resets = 0;

    controller.hear('lost before the page loads', false); // no page yet: ignored
    controller.attach((text, isFinal) => heard.add((text, isFinal)), () => resets++);
    controller.hear('hello', false);
    controller.hear('hello everyone', true);
    controller.reset();
    expect(heard, [('hello', false), ('hello everyone', true)]);
    expect(resets, 1);

    controller.detach();
    controller.hear('after leaving', true);
    expect(heard.length, 2);
  });
}
