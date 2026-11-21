// Rig-independent playback rules for the procedural sign tables. AvatarPlayer
// applies these to three.js bones; the tests run the same code against every
// exported animation without a browser.
import { defaultPose } from './animations/defaultPose.js';
/** Mixamo exports may use plain, colon-separated or numbered rig prefixes. */
export const canonicalBone = (bone) => bone.replace(/^mixamorig\d*:?/, '');
const axisKey = (bone, axis) => `${canonicalBone(bone)}|${axis}`;
/** Every sign starts from and returns to defaultPose's values (zero elsewhere). */
export const REST_POSE = (() => {
    const runtime = { animations: [], characters: [], pending: true };
    defaultPose(runtime);
    const rest = new Map();
    for (const frame of runtime.animations)
        for (const [bone, , axis, target] of frame)
            rest.set(axisKey(bone, axis), target);
    return rest;
})();
export function restValue(bone, axis) {
    return REST_POSE.get(axisKey(bone, axis)) ?? 0;
}
/**
 * One instruction per bone axis in a frame; a later instruction replaces an
 * earlier one. Two different targets for the same axis in one frame can never
 * both be reached (CONFUSED used to freeze the queue this way).
 */
export function normalizeFrame(frame) {
    const byAxis = new Map();
    for (const instruction of frame) {
        const key = axisKey(instruction[0], instruction[2]);
        byAxis.delete(key);
        byAxis.set(key, instruction);
    }
    return [...byAxis.values()];
}
/**
 * Plays one sign's table into `runtime`, normalizes its frames and, when the
 * sign ends with any joint away from rest, adds a closing frame that returns
 * those joints so the next sign starts from the authored neutral pose.
 * Returns the number of frames queued.
 */
export function appendSignFrames(runtime, play) {
    const before = runtime.animations.length;
    play(runtime);
    const frames = runtime.animations.splice(before).map(normalizeFrame).filter((frame) => frame.length > 0);
    if (!frames.length)
        return 0;
    const finalTargets = new Map();
    for (const frame of frames)
        for (const instruction of frame)
            finalTargets.set(axisKey(instruction[0], instruction[2]), instruction);
    const closing = [];
    for (const [bone, , axis, target] of finalTargets.values()) {
        const rest = restValue(bone, axis);
        if (Math.abs(target - rest) > 1e-9)
            closing.push([bone, 'rotation', axis, rest, rest > target ? '+' : '-']);
    }
    if (closing.length)
        frames.push(closing);
    runtime.animations.push(...frames);
    return frames.length;
}
