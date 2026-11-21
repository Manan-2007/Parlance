import { canonicalBone, normalizeFrame, restValue } from './signQueue.js'

const EPSILON = 1e-8
const FINGER_BONE = /Hand(?:Thumb|Index|Middle|Ring|Pinky)\d+$/

// A bounded slope through a pose, in radians per millisecond. Keep the
// velocity continuous when an axis keeps moving, and ease to zero at reversals.
function joiningVelocity(left, right) {
  return left * right > 0 ? (2 * left * right) / (left + right) : 0
}

export function compileMotion(frames, { initialPose = new Map() } = {}) {
  const positions = new Map(initialPose)
  const awayFromRest = new Set()
  const inputFrames = frames.slice()
  const recovery = [...initialPose.keys()].map((key) => {
    const [bone, axis] = key.split('|')
    return [bone, 'rotation', axis, restValue(bone, axis)]
  })
  // A replacement phrase starts at the visible pose. Its first frame also
  // releases any joints used by the old phrase but omitted by the new one.
  if (recovery.length) inputFrames[0] = normalizeFrame([...recovery, ...(inputFrames[0] ?? [])])

  const poses = inputFrames.map((frame) => {
    const tracks = new Map()
    let handTravel = 0
    let bodyTravel = 0

    for (const [name, , axis, target] of frame) {
      const bone = canonicalBone(name)
      const key = `${bone}|${axis}`
      const rest = restValue(bone, axis)
      const from = positions.get(key) ?? rest
      const travel = Math.abs(target - from)
      if (travel > EPSILON) {
        tracks.set(key, { bone, axis, from, target })
        if (FINGER_BONE.test(bone)) handTravel = Math.max(handTravel, travel)
        else bodyTravel = Math.max(bodyTravel, travel)
      }
      positions.set(key, target)
      if (Math.abs(target - rest) < EPSILON) awayFromRest.delete(key)
      else awayFromRest.add(key)
    }

    return {
      tracks,
      moveMs: tracks.size ? Math.max(125, bodyTravel * 340, handTravel * 270) : 0,
      neutral: awayFromRest.size === 0,
      handTravel,
      holdMs: 0,
    }
  })

  for (const [index, pose] of poses.entries()) {
    const next = poses[index + 1]
    // Give distinct hand shapes and the last expressive pose a beat. An
    // authored repeat of the same pose is a hold, including at neutral.
    if (!pose.tracks.size) pose.holdMs = 150
    else if (!pose.neutral && (pose.handTravel >= 0.55 || !next || next.neutral)) pose.holdMs = 105
  }

  let startMs = 0
  return poses.map((pose, index) => {
    const previous = poses[index - 1]
    const next = poses[index + 1]
    const tracks = [...pose.tracks].map(([key, track]) => {
      const rate = (track.target - track.from) / pose.moveMs
      const incoming = previous && !previous.holdMs && previous.tracks.get(key)
      const outgoing = next && !pose.holdMs && next.tracks.get(key)
      const startTangent = incoming ? joiningVelocity((incoming.target - incoming.from) / previous.moveMs, rate) * pose.moveMs : 0
      const endTangent = outgoing ? joiningVelocity(rate, (outgoing.target - outgoing.from) / next.moveMs) * pose.moveMs : 0
      return { ...track, startTangent, endTangent }
    })
    const endMs = startMs + pose.moveMs + pose.holdMs
    const timed = { tracks, startMs, endMs, moveMs: pose.moveMs }
    startMs = endMs
    return timed
  })
}

export function sampleMotionPose(pose, timeMs, deltaFor, moved) {
  if (!pose.moveMs) return
  const t = Math.min(Math.max(0, timeMs - pose.startMs) / pose.moveMs, 1)
  // Quintic Hermite interpolation reaches the authored angles and joining
  // velocities with zero acceleration at both ends, including beside holds.
  const eased = t ** 3 * (10 - 15 * t + 6 * t * t)
  const startWeight = t * (1 - t) ** 3 * (1 + 3 * t)
  const endWeight = -(t ** 3) * (1 - t) * (4 - 3 * t)

  for (const { bone, axis, from, target, startTangent, endTangent } of pose.tracks) {
    const delta = deltaFor(bone)
    if (!delta) continue
    const blended = from + (target - from) * eased + startTangent * startWeight + endTangent * endWeight
    const value = t === 1 ? target : Math.min(Math.max(blended, Math.min(from, target)), Math.max(from, target))
    if (delta[axis] === value) continue
    delta[axis] = value
    moved?.add(bone)
  }
}
