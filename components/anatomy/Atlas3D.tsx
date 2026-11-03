'use client';

// components/anatomy/Atlas3D.tsx
/**
 * أطلس ثلاثي الأبعاد: الجمجمة والهيكل العظمي حتى الصدر، مع عضلات الوجه والرقبة.
 * النموذج: public/atlas/head-neck(.glb|-lite.glb) — BodyParts3D (DBCLS) وZ-Anatomy (انظر ATTRIBUTION.md).
 * الحالة العامة (التحديد، الاختبار، الفلاتر) في FaceAtlas؛ الرؤية والمقطع والشفافية محلية هنا.
 */
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import {
  Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode,
} from 'react';
import {
  Color, MathUtils, Plane, TOUCH, Vector3,
  type BufferGeometry, type Group, type Mesh, type MeshStandardMaterial, type Object3D, type Scene as ThreeScene,
} from 'three';

import { MUSCLE_BY_ID, type ZoomId } from '@/lib/anatomy-data';
import { DEPTH_LABEL, type Depth } from '@/lib/anatomy-layers';
import { MUSCLE_MESHES } from '@/lib/anatomy-meshes';
import type { Pose } from '@/lib/anatomy-pose';
import {
  ALL_CONTEXT_IDS, ALL_MUSCLE_GROUP_IDS, ALL_MUSCLE_IDS, DEFAULT_VISIBILITY, describePart, labelOfPart, partVisible,
  presetVisibility, type PartInfo, type PresetId, type Visibility,
} from './atlas3d-model';
import Atlas3DTools, { SECTION_RANGE, VIEW_LABEL, type Section, type ToolState, type ViewId } from './Atlas3DTools';

// ==================== الأنواع ====================
type Tone = 'sel' | 'ok' | 'bad';

export interface Atlas3DProps {
  zoom: ZoomId;
  selItems: readonly { id: string; tone: Tone }[];
  highlight: ReadonlySet<string> | null;
  arrowIds: readonly string[];
  pose: Pose;
  kRef: { current: number };
  hideNames: boolean;
  onPick: (id: string) => void;
  onFail: () => void;
  /** يطلب من الصفحة تقريب منطقة (عند اختيار إعداد مسبق) */
  onZoomRequest?: (z: ZoomId) => void;
}

interface Palette { bone: string; muscle: string; context: string; sel: string; ok: string; bad: string; bg: string }

const URL_FULL = '/atlas/head-neck.glb';
const URL_LITE = '/atlas/head-neck-lite.glb';
const FOV = 30;
const QUALITY_KEY = 'anatomy-3d-quality';

const LIGHT: Palette = { bone: '#E9E1CE', muscle: '#A8503A', context: '#C9AC9B', sel: '#0E6B73', ok: '#3D6E4A', bad: '#B8860B', bg: '#F7F6F1' };
const DARK: Palette = { bone: '#D2CAB5', muscle: '#D98B73', context: '#8F7B72', sel: '#7FD3DC', ok: '#7BC28A', bad: '#E8BC6A', bg: '#1D262B' };

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const v = (n: string): string => cs.getPropertyValue(n).trim();
  let dark = false;
  try {
    const deep = v('--paper-deep');
    dark = deep !== '' && new Color(deep).getHSL({ h: 0, s: 0, l: 0 }).l < 0.2;
  } catch {
    dark = false;
  }
  const fb = dark ? DARK : LIGHT;
  let context = fb.context;
  try {
    context = `#${new Color(fb.muscle).lerp(new Color(fb.bone), 0.55).getHexString()}`;
  } catch {
    /* القيمة الاحتياطية */
  }
  return { ...fb, context, ok: v('--success') || fb.ok, bg: v('--paper-soft') || fb.bg };
}

const hash01 = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

// ==================== قطع النموذج ====================
interface Part extends PartInfo {
  label: string;
  geometry: BufferGeometry;
  center: Vector3;
  radius: number;
}

function usePartList(url: string): Part[] {
  const gltf = useGLTF(url);
  return useMemo(() => {
    const out: Part[] = [];
    gltf.scene.traverse((o: Object3D) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const raw = (typeof m.userData.name === 'string' ? m.userData.name : m.name.replace(/_/g, ' ')) as string;
      const info = describePart(raw);
      m.geometry.computeBoundingBox();
      const box = m.geometry.boundingBox;
      const center = new Vector3();
      let radius = 0.2;
      if (box) {
        box.getCenter(center);
        radius = box.getSize(new Vector3()).length() / 2;
      }
      out.push({ ...info, label: labelOfPart(info, (id) => MUSCLE_BY_ID[id]?.en), geometry: m.geometry, center, radius });
    });
    return out;
  }, [gltf]);
}

// ==================== الكاميرا ====================
const FRAMES: Record<ZoomId, { target: [number, number, number]; height: number }> = {
  whole: { target: [0, -1.1, 0.1], height: 6.3 },
  eyes: { target: [0, 0.4, 0.8], height: 1.4 },
  nose: { target: [0, 0.1, 0.9], height: 1.2 },
  mouth: { target: [0, -0.45, 0.8], height: 1.3 },
  side: { target: [0.6, 0.0, 0.3], height: 2.0 },
  neck: { target: [0, -1.5, 0.0], height: 3.4 },
  throat: { target: [0, -1.0, 0.4], height: 2.0 },
  posterior: { target: [0.7, -1.3, -0.1], height: 2.2 },
};

const VIEW_DIR: Record<ViewId, [number, number, number]> = {
  front: [0, 0.05, 1], left: [1, 0.05, 0], right: [-1, 0.05, 0], back: [0, 0.05, -1], top: [0, 1, 0.12], bottom: [0, -1, 0.2],
};

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

interface FocusReq { id: string; n: number }

function CameraRig({
  zoom, view, focus, parts, controls, freeTouch,
}: {
  zoom: ZoomId;
  view: { id: ViewId; n: number } | null;
  focus: FocusReq | null;
  parts: readonly Part[];
  controls: { current: ComponentRef<typeof OrbitControls> | null };
  freeTouch: boolean;
}) {
  const { camera, invalidate, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const goal = useRef<{ target: Vector3; dist: number; dir: Vector3 | null; instant: boolean } | null>(null);
  const first = useRef(true);
  const off = useMemo(() => new Vector3(), []);
  const lastDist = useRef(8);

  useEffect(() => {
    const el = (controls.current as unknown as { domElement?: HTMLElement } | null)?.domElement;
    if (el) el.style.touchAction = freeTouch ? 'none' : 'pan-y';
  }, [controls, freeTouch]);

  useEffect(() => {
    const f = FRAMES[zoom];
    const needW = Math.max(1.7, f.height * 0.62);
    const fit = Math.max(f.height, needW / aspect);
    const dist = fit / (2 * Math.tan(MathUtils.degToRad(FOV / 2)));
    lastDist.current = dist;
    goal.current = {
      target: new Vector3(...f.target),
      dist,
      dir: first.current ? new Vector3(...VIEW_DIR.front).normalize() : null,
      instant: first.current || reducedMotion(),
    };
    first.current = false;
    invalidate();
  }, [zoom, invalidate, aspect]);

  useEffect(() => {
    if (!view) return;
    const g = goal.current;
    goal.current = {
      target: g?.target ?? new Vector3(...FRAMES[zoom].target),
      dist: g?.dist ?? lastDist.current,
      dir: new Vector3(...VIEW_DIR[view.id]).normalize(),
      instant: reducedMotion(),
    };
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, invalidate]);

  // الانتقال إلى العضلة المحددة (الجهة الأقرب للكاميرا)
  useEffect(() => {
    if (!focus) return;
    const cands = parts.filter((p) => p.muscleId === focus.id);
    if (cands.length === 0) return;
    let best = cands[0];
    let bd = Infinity;
    for (const p of cands) {
      const d = p.center.distanceTo(camera.position);
      if (d < bd) { bd = d; best = p; }
    }
    if (!best) return;
    const radius = cands.filter((p) => Math.sign(p.center.x) === Math.sign(best.center.x)).reduce((m, p) => Math.max(m, p.radius), best.radius);
    const dist = MathUtils.clamp(radius * 3.4, 1.3, 5);
    lastDist.current = dist;
    goal.current = { target: best.center.clone(), dist, dir: null, instant: reducedMotion() };
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.n]);

  useFrame((_, dt) => {
    const c = controls.current;
    const g = goal.current;
    if (!c || !g) return;
    const k = g.instant ? 1 : 1 - Math.exp(-dt * 7);
    off.copy(camera.position).sub(c.target);
    let len = off.length();
    if (len < 1e-4) off.set(0, 0.05, 1);
    if (g.dir) off.normalize().lerp(g.dir, k).normalize();
    else off.normalize();
    len = MathUtils.lerp(len, g.dist, k);
    off.multiplyScalar(len);
    c.target.lerp(g.target, k);
    camera.position.copy(c.target).add(off);
    c.update();
    const dirDone = !g.dir || off.clone().normalize().distanceTo(g.dir) < 0.01;
    if (c.target.distanceTo(g.target) < 0.002 && Math.abs(len - g.dist) < 0.01 && dirDone) goal.current = null;
    else invalidate();
  });

  return null;
}

// ==================== حركة الرأس والفك ====================
const HEAD_PIVOT: [number, number, number] = [0, -0.09, -0.12];
const JAW_PIVOT: [number, number, number] = [0, 0.18, 0.14];
const neg = (p: [number, number, number]): [number, number, number] => [-p[0], -p[1], -p[2]];

function HeadRig({ pose, kRef, children }: { pose: Pose; kRef: { current: number }; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const animated = (pose.tilt ?? 0) !== 0 || (pose.turn ?? 0) !== 0 || (pose.fx ?? 0) !== 0;

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = kRef.current;
    const tx = (pose.fx ?? 0) * k * 0.28;
    const ty = (pose.turn ?? 0) * k * 0.45;
    const tz = -(pose.tilt ?? 0) * k * 0.25;
    g.rotation.x = MathUtils.damp(g.rotation.x, tx, 14, dt);
    g.rotation.y = MathUtils.damp(g.rotation.y, ty, 14, dt);
    g.rotation.z = MathUtils.damp(g.rotation.z, tz, 14, dt);
    const moving = Math.abs(g.rotation.x - tx) > 5e-4 || Math.abs(g.rotation.y - ty) > 5e-4 || Math.abs(g.rotation.z - tz) > 5e-4;
    if (animated || moving) invalidate();
  });

  return (
    <group ref={ref} position={HEAD_PIVOT}>
      <group position={neg(HEAD_PIVOT)}>{children}</group>
    </group>
  );
}

function JawRig({ pose, kRef, children }: { pose: Pose; kRef: { current: number }; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const animated = (pose.jaw ?? 0) !== 0;

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = Math.max(0, pose.jaw ?? 0) * kRef.current * 0.2;
    g.rotation.x = MathUtils.damp(g.rotation.x, target, 14, dt);
    if (animated || Math.abs(g.rotation.x - target) > 5e-4) invalidate();
  });

  return (
    <group ref={ref} position={JAW_PIVOT}>
      <group position={neg(JAW_PIVOT)}>{children}</group>
    </group>
  );
}

// ==================== المواد ====================
interface ShaderLike { fragmentShader: string; uniforms: Record<string, { value: unknown }> }

/** إضاءة حافّة خفيفة (Fresnel) تُبرز شكل العضلة وحجمها */
function rimPatch(shader: ShaderLike): void {
  shader.uniforms.rimColor = { value: new Color('#ffffff') };
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;')
    .replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  float rimF = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 2.6);\n  totalEmissiveRadiance += rimColor * rimF * 0.2;',
    );
}

// ==================== قطعة واحدة ====================
interface Look {
  palette: Palette;
  tones: ReadonlyMap<string, Tone>;
  highlight: ReadonlySet<string> | null;
  vis: Visibility;
  autoHide: ReadonlySet<string>;
  peel: Depth;
  boneOpacity: number;
  muscleOpacity: number;
  focus: boolean;
  anySelected: boolean;
  moving: boolean;
  plane: Plane | null;
  kRef: { current: number };
  hover: string | null;
  pickedKey: string | null;
  setHover: (key: string | null, label?: string) => void;
  onPickPart: (p: Part) => void;
}

function PartMesh({ part, look }: { part: Part; look: Look }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const mat = useRef<MeshStandardMaterial>(null);
  const { palette, tones, highlight } = look;
  const id = part.muscleId;
  const tone = id ? tones.get(id) : look.pickedKey === part.key ? ('sel' as const) : undefined;
  const pulse = tone === 'sel' && look.moving && id !== null;

  useFrame(() => {
    const m = mat.current;
    if (!m || !pulse) return;
    m.emissiveIntensity = 0.1 + 0.55 * look.kRef.current;
    invalidate();
  });

  const baseColor = useMemo(() => {
    const base = part.kind === 'bone' ? palette.bone : id ? palette.muscle : palette.context;
    const c = new Color(base);
    c.offsetHSL(0, 0, (hash01(part.name) - 0.5) * (part.kind === 'bone' ? 0.05 : 0.11));
    return `#${c.getHexString()}`;
  }, [part.kind, part.name, id, palette]);

  const hidden =
    !partVisible(part, look.vis, look.peel) || (id !== null && look.autoHide.has(id) && !tone);
  if (hidden) return null;

  const dim = id !== null && highlight !== null && !highlight.has(id) && !tone;
  const faded = look.focus && look.anySelected && part.kind === 'muscle' && !tone;
  const hovered = look.hover === part.key;
  let color = baseColor;
  if (tone === 'sel') color = palette.sel;
  else if (tone === 'ok') color = palette.ok;
  else if (tone === 'bad') color = palette.bad;
  else if (hovered) color = `#${new Color(baseColor).lerp(new Color('#ffffff'), 0.25).getHexString()}`;

  const base = part.kind === 'bone' ? look.boneOpacity : look.muscleOpacity;
  const opacity = dim ? Math.min(base, 0.12) : faded ? Math.min(base, 0.3) : base;
  const transparent = opacity < 1;
  const sectioned = look.plane !== null;

  return (
    <mesh
      key={sectioned ? 's' : 'n'}
      geometry={part.geometry}
      renderOrder={transparent ? 1 : 0}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta > 6) return;
        look.onPickPart(part);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        look.setHover(part.key, part.label);
        gl.domElement.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        look.setHover(null);
        gl.domElement.style.cursor = '';
      }}
    >
      <meshStandardMaterial
        ref={mat}
        color={color}
        emissive={tone || hovered ? color : '#000000'}
        emissiveIntensity={tone === 'sel' ? 0.22 : tone ? 0.18 : hovered ? 0.1 : 0}
        roughness={part.kind === 'bone' ? 0.8 : 0.46}
        metalness={0.02}
        transparent={transparent}
        opacity={opacity}
        depthWrite={!transparent}
        side={sectioned ? 2 : 0}
        clippingPlanes={look.plane ? [look.plane] : null}
        onBeforeCompile={rimPatch}
      />
    </mesh>
  );
}

// ==================== أسماء مثبّتة على العضلات المحددة ====================
function PinnedLabels({ ids, parts }: { ids: readonly string[]; parts: readonly Part[] }) {
  return (
    <>
      {ids.slice(0, 6).map((id) => (
        <PinnedLabel key={id} id={id} parts={parts} />
      ))}
    </>
  );
}

function PinnedLabel({ id, parts }: { id: string; parts: readonly Part[] }) {
  const ref = useRef<Group>(null);
  const cands = useMemo(() => parts.filter((p) => p.muscleId === id), [parts, id]);
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const g = ref.current;
    if (!g || cands.length === 0) return;
    let best = cands[0];
    let bd = Infinity;
    for (const p of cands) {
      const d = p.center.distanceTo(camera.position);
      if (d < bd) { bd = d; best = p; }
    }
    if (best) g.position.copy(best.center);
  });

  if (cands.length === 0) return null;
  const m = MUSCLE_BY_ID[id];
  return (
    <group ref={ref}>
      <Html center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span className="fa3-pin" dir="ltr">{m?.short ?? m?.en ?? id}</span>
      </Html>
    </group>
  );
}

// ==================== المشهد ====================
interface SceneProps extends Atlas3DProps {
  url: string;
  palette: Palette;
  ts: ToolState;
  view: { id: ViewId; n: number } | null;
  focusReq: FocusReq | null;
  autoHide: ReadonlySet<string>;
  hover: string | null;
  pickedKey: string | null;
  setHover: (key: string | null, label?: string) => void;
  onPickPart: (p: Part) => void;
  partsRef: { current: readonly Part[] };
  captureRef: { current: (() => string | null) | null };
  bg: string;
}

function Scene(props: SceneProps) {
  const { ts } = props;
  const parts = usePartList(props.url);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { gl, scene, camera, invalidate } = useThree();

  useEffect(() => {
    props.partsRef.current = parts;
  }, [parts, props.partsRef]);

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  useEffect(() => {
    props.captureRef.current = () => {
      const prev = gl.getClearAlpha();
      gl.setClearColor(new Color(props.bg), 1);
      gl.render(scene as ThreeScene, camera);
      const url = gl.domElement.toDataURL('image/png');
      gl.setClearColor(new Color(props.bg), prev);
      invalidate();
      return url;
    };
    return () => {
      props.captureRef.current = null;
    };
  }, [gl, scene, camera, invalidate, props.bg, props.captureRef]);

  useFrame(() => {
    if (ts.autoRotate) invalidate();
  });

  const plane = useMemo(() => new Plane(new Vector3(-1, 0, 0), 0), []);
  if (ts.section.on) {
    const n = ts.section.axis === 'x' ? [1, 0, 0] : ts.section.axis === 'y' ? [0, 1, 0] : [0, 0, 1];
    const s = ts.section.flip ? 1 : -1;
    plane.normal.set(n[0] ?? 0, n[1] ?? 0, n[2] ?? 0).multiplyScalar(s);
    plane.constant = ts.section.flip ? -ts.section.pos : ts.section.pos;
  }

  const tones = useMemo(() => new Map(props.selItems.map((s) => [s.id, s.tone] as const)), [props.selItems]);
  const moving = Object.keys(props.pose).length > 0;
  const look: Look = {
    palette: props.palette,
    tones,
    highlight: props.highlight,
    vis: ts.vis,
    autoHide: props.autoHide,
    peel: ts.peel,
    boneOpacity: ts.boneOpacity,
    muscleOpacity: ts.muscleOpacity,
    focus: ts.focus && !props.hideNames,
    anySelected: props.selItems.length > 0,
    moving,
    plane: ts.section.on ? plane : null,
    kRef: props.kRef,
    hover: props.hover,
    pickedKey: props.pickedKey,
    setHover: props.setHover,
    onPickPart: props.onPickPart,
  };

  const fixed = parts.filter((p) => !p.head);
  const head = parts.filter((p) => p.head && !p.jaw);
  const jaw = parts.filter((p) => p.head && p.jaw);
  const selIds = props.selItems.filter((s) => s.tone === 'sel').map((s) => s.id);

  return (
    <>
      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#ffffff', '#b8a99a', 0.9]} />
      <directionalLight position={[3, 4, 6]} intensity={2.0} />
      <directionalLight position={[-4, 1, 3]} intensity={0.8} />
      <directionalLight position={[0, 3, -5]} intensity={0.7} />

      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.7}
        zoomSpeed={0.8}
        autoRotate={ts.autoRotate}
        autoRotateSpeed={1.4}
        screenSpacePanning
        minDistance={0.7}
        maxDistance={22}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
      />
      <CameraRig zoom={props.zoom} view={props.view} focus={props.focusReq} parts={parts} controls={controls} freeTouch={ts.freeTouch} />

      <group>{fixed.map((p) => <PartMesh key={p.key} part={p} look={look} />)}</group>
      <HeadRig pose={props.pose} kRef={props.kRef}>
        {head.map((p) => <PartMesh key={p.key} part={p} look={look} />)}
        <JawRig pose={props.pose} kRef={props.kRef}>
          {jaw.map((p) => <PartMesh key={p.key} part={p} look={look} />)}
        </JawRig>
      </HeadRig>

      {ts.labels && !props.hideNames && selIds.length <= 3 && <PinnedLabels ids={selIds} parts={parts} />}
    </>
  );
}

// ==================== الواجهة ====================
const INITIAL_TS = (): ToolState => {
  let quality: 'full' | 'lite' = 'full';
  let freeTouch = false;
  try {
    const stored = localStorage.getItem(QUALITY_KEY);
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const small = Math.min(window.screen.width, window.screen.height) < 700;
    quality = stored === 'lite' || stored === 'full' ? stored : small || mem <= 2 ? 'lite' : 'full';
    freeTouch = window.innerWidth >= 700;
  } catch {
    /* القيم الافتراضية */
  }
  return {
    vis: DEFAULT_VISIBILITY,
    peel: 1,
    boneOpacity: 1,
    muscleOpacity: 1,
    section: { on: false, axis: 'x', pos: 0, flip: false } satisfies Section,
    autoRotate: false,
    labels: true,
    focus: true,
    freeTouch,
    quality,
  };
};

export default function Atlas3D(props: Atlas3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const fromCanvas = useRef(false);
  const partsRef = useRef<readonly Part[]>([]);
  const captureRef = useRef<(() => string | null) | null>(null);
  const [palette, setPalette] = useState<Palette>(LIGHT);
  const [ts, setTs] = useState<ToolState>(INITIAL_TS);
  const [hist, setHist] = useState<Visibility[]>([]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [hoverLabel, setHoverLabel] = useState('');
  const [view, setView] = useState<{ id: ViewId; n: number } | null>(null);
  const [viewMenu, setViewMenu] = useState(false);
  const [tools, setTools] = useState(false);
  const [picked, setPicked] = useState<{ key: string; label: string; kind: 'bone' | 'muscle' } | null>(null);
  const [focusReq, setFocusReq] = useState<FocusReq | null>(null);
  const [missing, setMissing] = useState(false);
  const { onFail, onPick } = props;
  const { active: loading, progress } = useProgress();

  const url = ts.quality === 'lite' ? URL_LITE : URL_FULL;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    fetch(url, { method: 'HEAD' })
      .then((r) => { if (live && !r.ok) setMissing(true); })
      .catch(() => { if (live) setMissing(true); });
    return () => { live = false; };
  }, [url]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = (): void => setPalette(readPalette(el));
    apply();
    const mo = new MutationObserver(apply);
    const opts = { attributes: true, attributeFilter: ['class', 'data-theme'] };
    mo.observe(document.documentElement, opts);
    mo.observe(document.body, opts);
    return () => mo.disconnect();
  }, []);

  const patch = useCallback((p: Partial<ToolState>) => {
    setTs((s) => ({ ...s, ...p }));
    if (p.quality) {
      try { localStorage.setItem(QUALITY_KEY, p.quality); } catch { /* تجاهل */ }
    }
  }, []);

  const commitVis = useCallback((next: Visibility) => {
    setHist((h) => [...h.slice(-29), ts.vis]);
    setTs((s) => ({ ...s, vis: next }));
  }, [ts.vis]);

  const undo = useCallback(() => {
    setHist((h) => {
      const prev = h[h.length - 1];
      if (prev) setTs((s) => ({ ...s, vis: prev }));
      return h.slice(0, -1);
    });
  }, []);

  const toggleGroup = useCallback((id: string) => {
    const g = new Set(ts.vis.groups);
    if (g.has(id)) g.delete(id);
    else g.add(id);
    commitVis({ ...ts.vis, groups: g });
  }, [ts.vis, commitVis]);

  const { onZoomRequest } = props;
  const preset = useCallback(
    (id: PresetId) => {
      commitVis(presetVisibility(id));
      const z: ZoomId = id === 'neck' ? 'neck' : id === 'anterior' ? 'throat' : id === 'posterior' ? 'posterior' : 'whole';
      onZoomRequest?.(z);
    },
    [commitVis, onZoomRequest],
  );

  const selectedId = props.selItems.find((s) => s.tone === 'sel')?.id ?? null;
  const multiSel = props.selItems.filter((s) => s.tone === 'sel').length > 1;
  const selectedMissing = selectedId !== null && !multiSel && !MUSCLE_MESHES[selectedId]?.length;

  // عند اختيار عضلة من خارج المجسّم ننتقل إليها
  useEffect(() => {
    if (picked && selectedId) setPicked(null);
    if (!selectedId || multiSel) return;
    if (fromCanvas.current) {
      fromCanvas.current = false;
      return;
    }
    setFocusReq((f) => ({ id: selectedId, n: (f?.n ?? 0) + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const autoHide = useMemo(() => {
    const s = new Set<string>();
    const wanted = props.selItems.some((i) => i.id === 'platysma') || (props.highlight?.has('platysma') ?? false);
    if (!wanted) s.add('platysma');
    return s;
  }, [props.selItems, props.highlight]);

  const setHover = useCallback((key: string | null, label = '') => {
    setHoverKey(key);
    setHoverLabel(key ? label : '');
  }, []);

  const onPickPart = useCallback((p: Part) => {
    if (p.muscleId) {
      fromCanvas.current = true;
      setPicked(null);
      onPick(p.muscleId);
    } else {
      setPicked({ key: p.key, label: p.label, kind: p.kind });
    }
  }, [onPick]);

  // ---- إجراءات المحدد ----
  const target: { label: string; muscleId: string | null; key: string | null; kind: 'bone' | 'muscle' } | null =
    picked
      ? { label: picked.label, muscleId: null, key: picked.key, kind: picked.kind }
      : selectedId && !multiSel && !selectedMissing
        ? { label: MUSCLE_BY_ID[selectedId]?.en ?? selectedId, muscleId: selectedId, key: null, kind: 'muscle' }
        : null;

  const hideTarget = (): void => {
    if (!target) return;
    if (target.muscleId) commitVis({ ...ts.vis, muscles: new Set(ts.vis.muscles).add(target.muscleId) });
    else if (target.key) commitVis({ ...ts.vis, parts: new Set(ts.vis.parts).add(target.key) });
    setPicked(null);
  };

  const isolateTarget = (): void => {
    if (!target) return;
    if (target.muscleId) {
      commitVis({
        groups: new Set(ALL_CONTEXT_IDS),
        muscles: new Set(ALL_MUSCLE_IDS.filter((id) => id !== target.muscleId)),
        parts: new Set(),
      });
    } else if (target.key) {
      commitVis({
        groups: new Set(ALL_MUSCLE_GROUP_IDS.concat(ALL_CONTEXT_IDS)),
        muscles: new Set(),
        parts: new Set(partsRef.current.filter((p) => p.key !== target.key).map((p) => p.key)),
      });
    }
  };

  const resetAll = (): void => {
    setHist([]);
    setPicked(null);
    setTs((s) => ({
      ...s, vis: DEFAULT_VISIBILITY, peel: 1, boneOpacity: 1, muscleOpacity: 1, section: { ...s.section, on: false, pos: 0 }, autoRotate: false,
    }));
    setView({ id: 'front', n: (view?.n ?? 0) + 1 });
  };

  const shot = (): void => {
    const data = captureRef.current?.();
    if (!data) return;
    const a = document.createElement('a');
    a.href = data;
    a.download = `anatomy-${selectedId ?? 'atlas'}.png`;
    a.click();
  };

  if (missing) {
    return (
      <div className="fa3 fa3-empty" role="alert" dir="rtl">
        <p>ملف النموذج غير موجود. ضعه في <span dir="ltr">public/atlas/</span> ثم أعد تحميل الصفحة.</p>
      </div>
    );
  }

  const quiz = props.hideNames;
  const nameShown = hoverLabel && !quiz ? hoverLabel : '';
  const hiddenCount = ts.vis.muscles.size + ts.vis.parts.size + ts.vis.groups.size - (ts.vis.groups.has('c:chest') ? 1 : 0);

  return (
    <div ref={wrapRef} className="fa3" role="group" aria-label="3D model of the skeleton, facial and neck muscles">
      <Canvas
        flat
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ fov: FOV, near: 0.1, far: 80, position: [0, 0, 12] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          const el = gl.domElement;
          const onLost = (e: Event): void => {
            e.preventDefault();
            // يُطلق الحدث أيضاً عند إغلاق المجسّم عمداً؛ لا يُعدّ ذلك فشلاً
            if (alive.current) onFail();
          };
          el.addEventListener('webglcontextlost', onLost);
        }}
      >
        <Suspense fallback={null}>
          <Scene
            {...props}
            url={url}
            palette={palette}
            ts={ts}
            view={view}
            focusReq={focusReq}
            autoHide={autoHide}
            hover={hoverKey}
            pickedKey={picked?.key ?? null}
            setHover={setHover}
            onPickPart={onPickPart}
            partsRef={partsRef}
            captureRef={captureRef}
            bg={palette.bg}
          />
        </Suspense>
      </Canvas>

      {loading && <div className="fa3-loading" role="status">جارٍ تحميل النموذج… {Math.round(progress)}%</div>}

      <div className="fa3-top" dir="rtl">
        <div className="fa3-menu">
          <button type="button" className="fa-btn" aria-expanded={viewMenu} onClick={() => setViewMenu((v) => !v)}>الزاوية ▾</button>
          {viewMenu && (
            <div className="fa3-pop" role="menu">
              {VIEW_LABEL.map(([id, label]) => (
                <button key={id} type="button" role="menuitem" onClick={() => { setView((v) => ({ id, n: (v?.n ?? 0) + 1 })); setViewMenu(false); }}>{label}</button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="fa-btn" aria-pressed={tools} onClick={() => setTools((t) => !t)}>
          الطبقات والأدوات{hiddenCount > 0 ? ` · ${hiddenCount}` : ''}
        </button>
      </div>

      <Atlas3DTools
        ts={ts}
        patch={patch}
        setVis={commitVis}
        toggleGroup={toggleGroup}
        preset={preset}
        canUndo={hist.length > 0}
        undo={undo}
        resetAll={resetAll}
        shot={shot}
        open={tools}
        onClose={() => setTools(false)}
      />

      <div className="fa3-bottom" dir="rtl">
        {(target || hist.length > 0) && (
          <div className="fa3-actions">
            {target && <span className="fa3-target" dir="ltr">{target.label}</span>}
            {target && <button type="button" className="fa-btn" onClick={hideTarget}>إخفاء</button>}
            {target && <button type="button" className="fa-btn" onClick={isolateTarget}>عزل</button>}
            {hist.length > 0 && <button type="button" className="fa-btn" onClick={undo}>تراجع</button>}
            {(hist.length > 0 || hiddenCount > 0) && (
              <button type="button" className="fa-btn" onClick={() => commitVis({ groups: new Set(), muscles: new Set(), parts: new Set() })}>إظهار الكل</button>
            )}
          </div>
        )}
        <div className="fa3-peel">
          <div className="fa3-peel-head">
            <span>قشّر الطبقات</span>
            <span className="fa3-peel-now">{ts.peel === 1 ? 'كل الطبقات' : `من الطبقة ${DEPTH_LABEL[ts.peel]}`}</span>
          </div>
          <input
            type="range" min={1} max={4} step={1} value={ts.peel} dir="ltr" aria-label="Peel muscle layers"
            onChange={(e) => patch({ peel: Number(e.target.value) as Depth })}
          />
          <div className="fa3-peel-scale" dir="ltr" aria-hidden="true">
            {([1, 2, 3, 4] as const).map((d) => <span key={d}>{DEPTH_LABEL[d]}</span>)}
          </div>
        </div>
      </div>

      {selectedMissing && <div className="fa3-note" dir="rtl">هذه العضلة غير موجودة في النموذج ثلاثي الأبعاد، راجعها في وضع 2D.</div>}
      <div className="fa3-hover" aria-hidden="true">{nameShown}</div>
      <div className="fa3-credit" dir="ltr">BodyParts3D © DBCLS · Z-Anatomy</div>
    </div>
  );
}

export { SECTION_RANGE };
