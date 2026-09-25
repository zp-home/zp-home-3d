import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// 3D simplex noise: Ashima Arts / Stefan Gustavson, MIT License (https://github.com/ashima/webgl-noise)
const NOISE = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * snoise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return sum;
  }

  vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
  }
`

/** Sky dome: layered nebula plus three twinkling star layers, drawn behind everything. */
function createSkyMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new Color('#c8ff3d') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(mat3(modelMatrix) * position);
        vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * vDir * 50.0, 1.0);
        gl_Position = clip.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uTint;
      varying vec3 vDir;
      ${NOISE}

      vec3 starLayer(vec3 dir, float scale, float density, float size, float brightness) {
        vec3 p = dir * scale;
        vec3 cell = floor(p);
        vec3 h = hash33(cell);
        vec3 starPos = 0.25 + 0.5 * hash33(cell + 17.0);
        float d = length(fract(p) - starPos);
        float glow = exp(-d * d / (size * size));
        float twinkle = 0.62 + 0.38 * sin(uTime * (0.5 + 2.4 * h.y) + h.z * 40.0);
        vec3 tint = mix(vec3(0.62, 0.76, 1.0), vec3(1.0, 0.8, 0.6), h.z);
        return step(1.0 - density, h.x) * glow * twinkle * brightness * mix(tint, vec3(1.0), 0.5);
      }

      void main() {
        vec3 dir = normalize(vDir);
        float band = exp(-pow(dot(dir, normalize(vec3(0.42, 1.0, 0.18))) * 2.4, 2.0));

        float n1 = fbm(dir * 1.6 + vec3(0.0, 0.0, uTime * 0.004));
        float n2 = fbm(dir * 3.6 + vec3(5.2, 1.3, uTime * 0.002));
        float cloud = smoothstep(-0.2, 0.8, n1 + band * 0.5);
        float wisps = smoothstep(0.05, 0.85, n2) * cloud;
        float lanes = smoothstep(0.15, 0.7, n2 * 0.6 + n1 * 0.4) * band;

        vec3 col = vec3(0.003, 0.006, 0.011);
        col += vec3(0.0, 0.085, 0.1) * cloud;
        col += vec3(0.085, 0.022, 0.15) * wisps * 1.25;
        col += uTint * 0.07 * pow(wisps, 2.0) * (0.4 + band);
        col += vec3(0.2, 0.05, 0.02) * smoothstep(0.5, 0.95, n2) * cloud * 0.7;
        col += vec3(0.05, 0.06, 0.08) * band * 0.6;
        col *= 1.0 - lanes * 0.45;

        col += starLayer(dir, 300.0, 0.09 + band * 0.22, 0.1, 0.8);
        col += starLayer(dir, 120.0, 0.05 + band * 0.08, 0.085, 1.7);
        col += starLayer(dir, 42.0, 0.032, 0.06, 6.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: BackSide,
    depthTest: false,
    depthWrite: false,
  })
}

/** Near dust: soft round sprites of varied size and colour, parallaxing against the sky. */
function createDust(count: number, inner: number, outer: number, flatten: number, colors: Color[], sizeRange: [number, number]) {
  const positions = new Float32Array(count * 3)
  const tints = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  for (let index = 0; index < count; index += 1) {
    const radius = inner + Math.pow(Math.random(), 1.6) * (outer - inner)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[index * 3 + 1] = radius * Math.cos(phi) * flatten
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    const tint = colors[Math.floor(Math.random() * colors.length)] ?? colors[0]
    tints.set([tint.r, tint.g, tint.b], index * 3)
    sizes[index] = MathUtils.lerp(sizeRange[0], sizeRange[1], Math.pow(Math.random(), 3))
    phases[index] = Math.random() * Math.PI * 2
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aTint', new Float32BufferAttribute(tints, 3))
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute vec3 aTint;
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vTint;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (120.0 / -mv.z);
        vTint = aTint;
        vAlpha = 0.55 + 0.45 * sin(uTime * 1.3 + aPhase);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vTint;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = exp(-d * d * 60.0);
        float halo = exp(-d * d * 12.0) * 0.35;
        float a = (core + halo) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vTint * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  return new Points(geometry, material)
}

/** Swirling filament core. Opaque on purpose so the glass shell refracts and disperses it. */
function createCoreMaterial(primary: Color) {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPrimary: { value: primary.clone() },
      uSecondary: { value: new Color('#65d9dc') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vPos = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uPrimary;
      uniform vec3 uSecondary;
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vView;
      ${NOISE}
      void main() {
        vec3 p = normalize(vPos);
        float angle = uTime * 0.45 + p.y * 1.6;
        float c = cos(angle);
        float s = sin(angle);
        vec3 q = vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
        float n = fbm(q * 1.35 + vec3(0.0, uTime * 0.18, 0.0));
        float m = fbm(q * 3.0 - vec3(uTime * 0.1, 0.0, 0.0));
        float filaments = pow(1.0 - abs(n), 12.0);
        float fine = pow(1.0 - abs(m), 24.0);
        float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
        float rim = pow(1.0 - facing, 3.0);
        float depth = 0.3 + 0.7 * pow(facing, 1.5);
        vec3 col = uPrimary * (0.02 + pow(facing, 3.0) * 0.22);
        col += uPrimary * (filaments * 1.7 + fine * 0.7) * depth;
        col += uSecondary * (fine * 0.5 + rim * 0.3);
        col += vec3(1.0, 0.97, 0.9) * pow(facing, 12.0) * filaments * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
}

/** Back-side fresnel halo that only shows outside the glass silhouette. */
function createHaloMaterial(primary: Color) {
  return new ShaderMaterial({
    uniforms: { uColor: { value: primary.clone() }, uStrength: { value: 0.3 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float d = dot(normalize(vNormal), normalize(vView));
        float t = clamp(-d / 0.66, 0.0, 1.0);
        float intensity = pow(t, 4.0);
        gl_FragColor = vec4(uColor * intensity * uStrength, 1.0);
      }
    `,
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}

/** Studio-in-space environment: the sky plus a few bright cards, so the glass has crisp highlights. */
function createEnvironment(renderer: WebGLRenderer) {
  const envScene = new Scene()
  envScene.add(new Mesh(new SphereGeometry(1, 32, 16), createSkyMaterial()))
  const cards: Array<[string, number, [number, number, number], [number, number]]> = [
    ['#dff6ff', 5, [-6, 5, 4], [7, 2.2]],
    ['#65d9dc', 3, [7, 1, -3], [2, 8]],
    ['#c8ff3d', 2, [2, -6, 5], [6, 1.2]],
    ['#ff6b4a', 2, [-5, -3, -6], [3, 3]],
  ]
  for (const [hex, strength, position, size] of cards) {
    const card = new Mesh(new PlaneGeometry(size[0], size[1]), new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(strength), side: 2 }))
    card.position.set(...position)
    card.lookAt(0, 0, 0)
    envScene.add(card)
  }
  const pmrem = new PMREMGenerator(renderer)
  const target = pmrem.fromScene(envScene, 0.02)
  pmrem.dispose()
  envScene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose()
      object.material.dispose()
    }
  })
  return target
}

export function createDeepSpace(canvas: HTMLCanvasElement, options: { paused: boolean }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5)
  renderer.setPixelRatio(pixelRatio)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.transmissionResolutionScale = 0.6

  const scene = new Scene()
  const environment = createEnvironment(renderer)
  scene.environment = environment.texture

  const camera = new PerspectiveCamera(42, 1, 0.1, 200)
  camera.position.set(0, 0, 13)

  const green = new Color('#c8ff3d')
  const cyan = new Color('#65d9dc')
  const coral = new Color('#ff6b4a')
  const starWhite = new Color('#dfe8ff')

  const skyMaterial = createSkyMaterial()
  const sky = new Mesh(new SphereGeometry(1, 48, 24), skyMaterial)
  sky.renderOrder = -1000
  sky.frustumCulled = false
  scene.add(sky)

  const farDust = createDust(1400, 16, 60, 1, [starWhite, starWhite, cyan, new Color('#ffd9b8')], [0.6, 3.2])
  const nearDust = createDust(420, 7, 16, 1, [starWhite, cyan, green], [0.8, 2.6])
  scene.add(farDust, nearDust)

  const world = new Group()
  scene.add(world)

  const radius = 2.25
  const glass = new Mesh(
    new SphereGeometry(radius, 128, 96),
    new MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.9,
      ior: 1.5,
      dispersion: 0.6,
      iridescence: 0.85,
      iridescenceIOR: 1.33,
      iridescenceThicknessRange: [160, 540],
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      specularIntensity: 1,
      envMapIntensity: 1.35,
      attenuationColor: new Color('#d6f4ff'),
      attenuationDistance: 7,
    }),
  )
  world.add(glass)

  const coreMaterial = createCoreMaterial(green)
  const core = new Mesh(new SphereGeometry(radius * 0.52, 96, 64), coreMaterial)
  world.add(core)

  const coreLight = new PointLight(green, 6, 10, 2)
  world.add(coreLight)

  const haloMaterial = createHaloMaterial(green)
  const halo = new Mesh(new SphereGeometry(radius * 1.32, 64, 48), haloMaterial)
  world.add(halo)

  const orbitGroup = new Group()
  orbitGroup.rotation.set(Math.PI * 0.42, 0, Math.PI * 0.08)
  world.add(orbitGroup)
  const ringMaterial = new MeshBasicMaterial({ color: cyan.clone().multiplyScalar(2.2), transparent: true, opacity: 0.75, blending: AdditiveBlending, depthWrite: false })
  const ringOuter = new Mesh(new TorusGeometry(radius * 1.72, 0.009, 8, 320), ringMaterial)
  const ringInner = new Mesh(new TorusGeometry(radius * 1.46, 0.005, 8, 320), ringMaterial.clone())
  ;(ringInner.material as MeshBasicMaterial).opacity = 0.4
  ringInner.rotation.x = 0.16
  orbitGroup.add(ringOuter, ringInner)
  const disk = createDust(1600, radius * 1.4, radius * 2.35, 0.035, [cyan, starWhite, green, coral], [0.5, 2.2])
  orbitGroup.add(disk)

  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(pixelRatio)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.6, 0.35, 0.9)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  const sceneTargets = [
    { x: 3.8, y: 0.0, z: 0, scale: 1.0, rx: 0.1, ry: 0.3, color: green, sky: 0 },
    { x: 5.6, y: -2.0, z: -2, scale: 0.72, rx: 0.8, ry: 1.4, color: cyan, sky: 0.22 },
    { x: 0.0, y: 4.7, z: -3, scale: 0.6, rx: 1.8, ry: 0.2, color: green, sky: 0.44 },
    { x: -5.5, y: -2.6, z: -2, scale: 0.72, rx: 0.3, ry: 2.4, color: coral, sky: 0.66 },
    { x: 4.7, y: 1.2, z: -1, scale: 0.82, rx: 1.2, ry: 3.0, color: cyan, sky: 0.88 },
    { x: 0.0, y: 0.2, z: 0, scale: 1.15, rx: 0.2, ry: 1.0, color: green, sky: 1.1 },
    { x: 3.8, y: -0.1, z: 0, scale: 1.0, rx: 1.1, ry: 2.0, color: green, sky: 1.32 },
  ]
  let target = sceneTargets[0]
  let paused = options.paused
  let elapsed = 0
  let pointerX = 0
  let pointerY = 0
  let previousFrame = performance.now()
  const scaleTarget = new Vector3()
  const dustMaterials = [farDust.material, nearDust.material, disk.material] as ShaderMaterial[]

  function resize() {
    const width = window.innerWidth
    const height = window.innerHeight
    renderer.setSize(width, height, false)
    composer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    for (const material of dustMaterials) material.uniforms.uPixelRatio.value = pixelRatio
  }

  function onPointerMove(event: PointerEvent) {
    pointerX = event.clientX / window.innerWidth - 0.5
    pointerY = event.clientY / window.innerHeight - 0.5
  }

  function render() {
    const now = performance.now()
    const delta = Math.min((now - previousFrame) / 1000, 0.05)
    previousFrame = now
    const ease = 1 - Math.pow(0.001, delta)
    if (!paused) elapsed += delta

    world.position.x = MathUtils.lerp(world.position.x, target.x, ease)
    world.position.y = MathUtils.lerp(world.position.y, target.y, ease)
    world.position.z = MathUtils.lerp(world.position.z, target.z, ease)
    world.scale.lerp(scaleTarget.setScalar(target.scale), ease)
    world.rotation.x = MathUtils.lerp(world.rotation.x, target.rx - pointerY * 0.3, ease * 0.7)
    world.rotation.y = MathUtils.lerp(world.rotation.y, target.ry + pointerX * 0.45, ease * 0.7)

    camera.position.x = MathUtils.lerp(camera.position.x, pointerX * 1.4, ease * 0.5)
    camera.position.y = MathUtils.lerp(camera.position.y, -pointerY * 0.9, ease * 0.5)
    camera.lookAt(0, 0, 0)

    sky.rotation.y = MathUtils.lerp(sky.rotation.y, target.sky, ease * 0.35)
    farDust.rotation.y = sky.rotation.y * 1.6 + elapsed * 0.004
    nearDust.rotation.y = sky.rotation.y * 2.4 + elapsed * 0.01

    coreMaterial.uniforms.uPrimary.value.lerp(target.color, ease * 0.8)
    haloMaterial.uniforms.uColor.value.lerp(target.color, ease * 0.8)
    skyMaterial.uniforms.uTint.value.lerp(target.color, ease * 0.3)
    coreLight.color.lerp(target.color, ease * 0.8)

    core.rotation.y = elapsed * 0.2
    orbitGroup.rotation.z = Math.PI * 0.08 + elapsed * 0.05
    disk.rotation.z = -elapsed * 0.03
    skyMaterial.uniforms.uTime.value = elapsed
    coreMaterial.uniforms.uTime.value = elapsed
    for (const material of dustMaterials) material.uniforms.uTime.value = elapsed

    composer.render(delta)
    requestAnimationFrame(render)
  }

  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  resize()
  render()

  return {
    setScene(index: number, direction: number) {
      target = sceneTargets[index] || sceneTargets[0]
      world.position.z += direction * 0.45
    },
    setPaused(value: boolean) { paused = value },
  }
}
