import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { canonicalBone, restValue } from './signQueue.js'
import { compileMotion, sampleMotionPose } from './poseMotion.js'
import { scheduleSigns } from './schedule.js'
import { AVATAR_MODEL_URL } from './model.js'

let modelPromise
function loadModel() {
  // ch22.glb is meshopt-compressed with WebP textures (about 2 MB instead of 4.8).
  modelPromise ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(AVATAR_MODEL_URL).catch((error) => {
    modelPromise = undefined
    throw error
  })
  return modelPromise
}

/**
 * The exported materials are glossy, which makes cloth and skin look like
 * plastic. Soften the highlights so the signer reads as a real person.
 */
function matte(mesh) {
  for (const material of [mesh.material].flat()) {
    if (!material || material.userData.matte) continue
    const name = `${mesh.name} ${material.name}`.toLowerCase()
    const skin = /body/.test(name)
    const eyes = /eye/.test(name)
    if (eyes) continue
    // The exported "glossiness" texture is read as roughness, so it makes
    // everything shine. Use one even value per material instead.
    if ('roughnessMap' in material) material.roughnessMap = null
    if ('metalnessMap' in material) material.metalnessMap = null
    if ('roughness' in material) material.roughness = skin ? 0.58 : /hair/.test(name) ? 0.7 : 0.92
    if ('metalness' in material) material.metalness = 0
    if ('specularIntensityMap' in material) material.specularIntensityMap = null
    if ('specularColorMap' in material) material.specularColorMap = null
    if ('specularIntensity' in material) material.specularIntensity = skin ? 0.35 : 0.15
    material.userData.matte = true
    material.needsUpdate = true
  }
}

export function createAvatar(mount, { interactive = true, onState = () => {}, onStatus = () => {} } = {}) {
  const runtime = { animations: [], segments: [], characters: [], pending: true }
  const bones = new Map()
  const euler = new THREE.Euler()
  const rotation = new THREE.Quaternion()
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 100)
  const key = new THREE.DirectionalLight('#f8fbff', 2.5)
  const rim = new THREE.DirectionalLight('#9aafff', 1.75)
  key.position.set(3, 5, 4)
  rim.position.set(-3, 2, -2)
  scene.add(new THREE.HemisphereLight('#f7fbff', '#7b89aa', 2.0), key, rim)

  let renderer
  let observer
  let avatar
  let disposed = false
  let queue = []
  let index = 0
  let firstIndex = 0
  let poses = []
  let signEndTimes = []
  let poseIndex = 0
  let motionTime = 0
  let lastReported
  let playing = false
  let finished = false
  let frameRequest = 0
  let lastStepAt = 0
  let speed = 1
  let loop = false
  let suspended = false
  let drag
  let presentation = 'figure'

  function render() {
    if (!suspended) renderer?.render(scene, camera)
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = mount
    if (!renderer || !width || !height) return
    camera.aspect = width / height
    frameCamera()
    renderer.setSize(width, height, false)
    render()
  }

  function frameCamera() {
    const hands = presentation === 'hands'
    const vertical = THREE.MathUtils.degToRad(hands ? 19 : 21)
    const horizontal = THREE.MathUtils.degToRad(28)
    // A closer upper-body view on wide screens, with enough horizontal room
    // for both hands when the stage becomes narrow on a phone.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.max(
      Math.tan(vertical / 2), Math.tan(horizontal / 2) / Math.max(camera.aspect, 0.1),
    )))
    camera.position.set(0, hands ? 0.38 : 0.52, hands ? 2.8 : 2.9)
    camera.updateProjectionMatrix()
  }

  function applyBone({ bone, rest, bindAxes, toBoneAxes, delta }) {
    euler.set(delta.x, delta.y, delta.z)
    // The sign tables use YBot's world-aligned bind axes. Express the same
    // rotation in the active rig's bind axes before applying its local rest pose.
    rotation.setFromEuler(euler)
    bone.quaternion.copy(rest).multiply(toBoneAxes).multiply(rotation).multiply(bindAxes)
  }

  function resetPose() {
    for (const [name, record] of bones) {
      record.delta.x = restValue(name, 'x')
      record.delta.y = restValue(name, 'y')
      record.delta.z = restValue(name, 'z')
      applyBone(record)
    }
    render()
  }

  function report() {
    const current = index - firstIndex
    const signStart = signEndTimes[current - 1] ?? 0
    const signEnd = signEndTimes[current] ?? signStart
    const progress = signEnd > signStart ? Math.min((motionTime - signStart) / (signEnd - signStart), 1) : 0
    const progressStep = Math.floor(progress * 40)
    const previous = lastReported
    if (previous?.index === index && previous.progressStep === progressStep && previous.playing === playing && previous.finished === finished) return
    lastReported = { index, progressStep, playing, finished }
    onState({ index, progress, playing, finished, transitioning: false })
  }

  function delayFrame() {
    if (!frameRequest && !suspended && playing && avatar) frameRequest = requestAnimationFrame(animate)
  }

  function resetClock() {
    cancelAnimationFrame(frameRequest)
    frameRequest = 0
    lastStepAt = 0
  }

  function animate(now) {
    frameRequest = 0
    if (!playing || suspended || !avatar) return
    const elapsed = lastStepAt ? Math.min(now - lastStepAt, 100) : 0
    lastStepAt = now
    const endTime = poses.at(-1).endMs
    motionTime = Math.min(motionTime + elapsed * speed, endTime)

    const changed = new Set()
    const deltaFor = (name) => bones.get(name)?.delta
    while (poseIndex < poses.length) {
      const pose = poses[poseIndex]
      sampleMotionPose(pose, motionTime, deltaFor, changed)
      if (motionTime < pose.endMs) break
      poseIndex += 1
    }
    for (const name of changed) applyBone(bones.get(name))
    if (changed.size) render()

    while (index - firstIndex < signEndTimes.length - 1 && motionTime >= signEndTimes[index - firstIndex]) {
      index += 1
    }
    if (motionTime >= endTime) {
      if (loop) return restart()
      playing = false
      finished = true
    }
    report()
    delayFrame()
  }

  function step(startIndex) {
    index = Math.min(Math.max(startIndex, 0), Math.max(queue.length - 1, 0))
    resetClock()
    const initialPose = new Map()
    for (const [name, { delta }] of bones) {
      for (const axis of ['x', 'y', 'z']) {
        if (Math.abs(delta[axis] - restValue(name, axis)) > 1e-8) initialPose.set(`${name}|${axis}`, delta[axis])
      }
    }
    finished = false
    playing = false
    scheduleSigns(queue.slice(index).map((item) => item.gloss), runtime)
    poses = compileMotion(runtime.animations, { initialPose })
    let frames = 0
    signEndTimes = runtime.segments.map((segment) => {
      frames += segment.frames
      return poses[frames - 1].endMs
    })
    firstIndex = index
    poseIndex = 0
    motionTime = 0
    report()
  }

  function play() {
    if (finished) return restart()
    if (!poses.length) return
    playing = true
    report()
    delayFrame()
  }

  function restart() {
    step(0)
    play()
  }

  function toggle() {
    if (!playing) return play()
    playing = false
    resetClock()
    report()
  }

  function setQueue(items) {
    queue = items
    restart()
  }

  function setOptions(options) {
    speed = options.speed
    loop = options.loop
    if (options.suspended !== suspended) {
      suspended = options.suspended
      resetClock()
      delayFrame()
    }
    mount.style.transform = options.mirror ? 'scaleX(-1)' : ''
    presentation = options.presentation
    frameCamera()
    render()
  }

  function pointerDown(event) {
    if (!interactive || !avatar || event.button !== 0) return
    drag = { pointer: event.pointerId, start: event.clientX, rotation: avatar.rotation.y }
    mount.setPointerCapture(event.pointerId)
  }

  function pointerMove(event) {
    if (!drag || drag.pointer !== event.pointerId) return
    avatar.rotation.y = THREE.MathUtils.clamp(drag.rotation + (event.clientX - drag.start) * 0.008, -0.65, 0.65)
    render()
  }

  function pointerEnd() {
    drag = undefined
  }

  function dispose() {
    disposed = true
    resetClock()
    observer?.disconnect()
    mount.removeEventListener('pointerdown', pointerDown)
    mount.removeEventListener('pointermove', pointerMove)
    mount.removeEventListener('lostpointercapture', pointerEnd)
    renderer?.dispose()
    renderer?.forceContextLoss()
    mount.replaceChildren()
    mount.style.transform = ''
  }

  async function initialize() {
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.domElement.className = 'block h-full w-full'
      renderer.domElement.setAttribute('aria-hidden', 'true')
      mount.replaceChildren(renderer.domElement)
      observer = new ResizeObserver(resize)
      observer.observe(mount)
      const { scene: original } = await loadModel()
      if (disposed) return
      avatar = clone(original)
      avatar.position.y = -0.85
      scene.add(avatar)
      avatar.updateMatrixWorld(true)
      avatar.traverse((object) => {
        if (object.isMesh) matte(object)
        if (object.isSkinnedMesh) object.frustumCulled = false
        if (!object.isBone) return
        const name = canonicalBone(object.userData.name ?? object.name)
        const bindAxes = object.getWorldQuaternion(new THREE.Quaternion())
        bones.set(name, {
          bone: object,
          rest: object.quaternion.clone(),
          bindAxes,
          toBoneAxes: bindAxes.clone().invert(),
          delta: { x: 0, y: 0, z: 0 },
        })
      })
      resetPose()
      resize()
      onStatus('ready')
      delayFrame()
    } catch (error) {
      if (disposed) return
      console.warn('Could not load the signing avatar.', error)
      dispose()
      onStatus('error')
    }
  }

  setOptions({ mirror: false, presentation: 'figure', speed: 1, loop: false, suspended: false })
  mount.addEventListener('pointerdown', pointerDown)
  mount.addEventListener('pointermove', pointerMove)
  mount.addEventListener('lostpointercapture', pointerEnd)
  void initialize()
  return { setQueue, setOptions, play, toggle, restart, step, dispose }
}
