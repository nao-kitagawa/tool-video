// 16:9 long-form YouTube composition (1920x1080).
import React from 'react';
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, HEAD, strokeText } from '../ui';
import { planClips } from '../VideoScenes';
import { sceneFrames } from '../ProductAd';
import type { Clip, Product, RenderProps, RenderScene } from '../types';

const W = 1920;
const H = 1080;

const ease = (f: number, dur: number) => {
  const t = Math.max(0, Math.min(1, f / dur));
  return 1 - Math.pow(1 - t, 3);
};

type LP = { scene: RenderScene; product: Product; frames: number; idx: number };

const srcOf = (product: Product, c: Clip) => {
  const v = product.videos ?? [];
  return v[Math.min(c.v ?? 0, v.length - 1)];
};

/** Full-frame 16:9 clip montage with slow push-in. */
const Footage: React.FC<{ scene: RenderScene; product: Product; frames: number; clips: Clip[]; volume: number; dim?: number; blur?: number }> = ({
  scene,
  product,
  frames,
  clips,
  volume,
  dim = 1,
  blur = 0,
}) => {
  const { fps } = useVideoConfig();
  const plan = planClips(clips, frames, fps, !!scene.dialogue);
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {plan.map((c, i) => {
        const src = srcOf(product, c);
        if (!src) return null;
        return (
          <Sequence key={i} from={c.from} durationInFrames={c.allot} layout="none">
            <PushIn allot={c.allot} zoom={c.zoom ?? 1.06} x={c.x ?? 0.5}>
              <OffthreadVideo
                src={src}
                trimBefore={Math.round(c.t * fps)}
                playbackRate={c.rate}
                volume={volume}
                style={{ width: W, height: H, filter: `brightness(${dim}) ${blur ? `blur(${blur}px)` : ''}` }}
              />
            </PushIn>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const PushIn: React.FC<{ allot: number; zoom: number; x: number; children: React.ReactNode }> = ({ allot, zoom, x, children }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, allot], [1, zoom]);
  return <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `${x * 100}% 50%` }}>{children}</AbsoluteFill>;
};

const bgClips = (scene: RenderScene): Clip[] => (scene.bgClip ? [scene.bgClip] : scene.clips ?? []);

// ---------------------------------------------------------------- scenes

const ClipL: React.FC<LP> = ({ scene, product, frames }) => {
  const f = useCurrentFrame();
  const vol = scene.dialogue ? 1 : scene.bedVolume ?? 0.1;
  return (
    <>
      <Footage scene={scene} product={product} frames={frames} clips={scene.clips ?? []} volume={vol} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 62%, rgba(0,0,0,.7) 100%)' }} />
      {scene.label ? (
        <div style={{ position: 'absolute', left: 90, bottom: scene.dialogue ? 300 : 120, opacity: ease(f - 8, 10), transform: `translateX(${(1 - ease(f - 8, 10)) * -40}px)` }}>
          <div style={{ width: 110, height: 8, background: product.theme.primary, marginBottom: 14 }} />
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, color: '#fff', ...strokeText(5, '#000') }}>{scene.label}</div>
          {scene.sub ? <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 36, color: product.theme.accent, marginTop: 4, ...strokeText(3, '#000') }}>{scene.sub}</div> : null}
        </div>
      ) : null}
      {!scene.dialogue && scene.headline ? (
        <div
          style={{
            position: 'absolute',
            right: 90,
            bottom: 120,
            maxWidth: 900,
            textAlign: 'right',
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 74,
            lineHeight: 1.05,
            color: '#fff',
            opacity: ease(f - 4, 10),
            ...strokeText(8, '#000'),
          }}
        >
          {scene.headline}
        </div>
      ) : null}
      {scene.dialogue ? (
        <div style={{ position: 'absolute', left: 160, right: 160, bottom: 90, textAlign: 'center', opacity: ease(f, 5) }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 56, lineHeight: 1.25, color: product.theme.accent, ...strokeText(9, '#000') }}>{scene.caption}</div>
          {scene.quote ? <div style={{ marginTop: 10, fontFamily: BODY, fontStyle: 'italic', fontWeight: 600, fontSize: 32, color: '#fff', ...strokeText(5, '#000') }}>{scene.quote}</div> : null}
        </div>
      ) : null}
    </>
  );
};

const Dim: React.FC<LP & { amount?: number }> = ({ scene, product, frames, amount = 0.3 }) =>
  bgClips(scene).length ? <Footage scene={{ ...scene, dialogue: false }} product={product} frames={frames} clips={bgClips(scene)} volume={0.06} dim={amount} blur={6} /> : null;

const ChapterL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 3, fps, config: { damping: 14 } });
  return (
    <>
      <Dim {...p} amount={0.35} />
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 160 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 10, color: p.product.theme.accent, opacity: ease(f, 8) }}>{p.scene.sub ?? ''}</div>
        <div style={{ width: 260 * ease(f - 4, 12), height: 10, background: p.product.theme.primary, margin: '24px 0 30px' }} />
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 130, lineHeight: 1, color: '#fff', maxWidth: 1500, transform: `translateY(${(1 - s) * 40}px)`, opacity: s }}>{p.scene.headline}</div>
      </AbsoluteFill>
    </>
  );
};

const TitleL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  return (
    <>
      <Dim {...p} amount={0.55} />
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 30% 60%, rgba(0,0,0,0) 0%, rgba(0,0,0,.7) 80%)' }} />
      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 140px 150px' }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 38, letterSpacing: 8, color: p.product.theme.accent, opacity: ease(f, 10) }}>{p.scene.sub}</div>
        <div style={{ marginTop: 16, fontFamily: HEAD, fontWeight: 800, fontSize: 150, lineHeight: 0.95, color: '#fff', opacity: ease(f - 5, 12), ...strokeText(6, '#000') }}>{p.scene.headline}</div>
      </AbsoluteFill>
    </>
  );
};

const ListL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  const items = p.scene.bullets ?? [];
  const step = Math.max(8, (p.frames - 20) / Math.max(1, items.length + 0.5));
  const hasBg = bgClips(p.scene).length > 0;
  return (
    <>
      <AbsoluteFill style={{ background: p.product.theme.bg }} />
      {hasBg ? (
        <div style={{ position: 'absolute', right: 0, top: 0, width: 860, height: H, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: -530, width: W, height: H }}>
            <Footage scene={{ ...p.scene, dialogue: false }} product={p.product} frames={p.frames} clips={bgClips(p.scene)} volume={0.06} dim={0.85} />
          </div>
          <AbsoluteFill style={{ background: `linear-gradient(90deg, ${p.product.theme.bg} 0%, rgba(0,0,0,0) 35%)` }} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 130, top: 170, width: 1000 }}>
        <div style={{ width: 120 * ease(f, 10), height: 10, background: p.product.theme.primary, marginBottom: 28 }} />
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 84, lineHeight: 1.05, color: '#fff', opacity: ease(f - 2, 10) }}>{p.scene.headline}</div>
        <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 30 }}>
          {items.map((it, i) => {
            const o = ease(f - 10 - i * step, 10);
            return (
              <div key={i} style={{ display: 'flex', gap: 28, alignItems: 'flex-start', opacity: o, transform: `translateX(${(1 - o) * -40}px)` }}>
                <div style={{ flex: '0 0 auto', width: 64, height: 64, background: p.product.theme.primary, color: '#fff', fontFamily: HEAD, fontWeight: 800, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, lineHeight: 1.3, color: '#fff', paddingTop: 4 }}>{it}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const QuoteL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  return (
    <>
      <Dim {...p} amount={0.25} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 220px' }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 200, lineHeight: 0.6, color: p.product.theme.primary, opacity: ease(f, 8) }}>“</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 64, lineHeight: 1.3, color: '#fff', opacity: ease(f - 4, 12) }}>{p.scene.quote}</div>
        <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 800, fontSize: 36, color: p.product.theme.accent, opacity: ease(f - 14, 10) }}>— {p.scene.sub}</div>
      </AbsoluteFill>
    </>
  );
};

const CompareL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  const rows = p.scene.rows ?? [];
  const [ca, cb] = p.scene.cols ?? ['Sách', 'Phim'];
  const step = Math.max(8, (p.frames - 20) / Math.max(1, rows.length));
  return (
    <>
      <Dim {...p} amount={0.18} />
      <div style={{ position: 'absolute', left: 130, right: 130, top: 130 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 80, color: '#fff', opacity: ease(f, 10) }}>{p.scene.headline}</div>
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1.2fr', fontFamily: BODY }}>
          {['', ca, cb].map((h, i) => (
            <div key={i} style={{ padding: '16px 22px', fontWeight: 900, fontSize: 38, color: i === 2 ? p.product.theme.accent : 'rgba(255,255,255,.75)', borderBottom: '3px solid rgba(255,255,255,.35)' }}>{h}</div>
          ))}
          {rows.map((r, i) => {
            const o = ease(f - 10 - i * step, 10);
            const cell: React.CSSProperties = { padding: '24px 22px', borderBottom: '1px solid rgba(255,255,255,.18)', opacity: o, fontSize: 38, lineHeight: 1.3 };
            return (
              <React.Fragment key={i}>
                <div style={{ ...cell, fontWeight: 900, color: '#fff' }}>{r.label}</div>
                <div style={{ ...cell, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>{r.a}</div>
                <div style={{ ...cell, fontWeight: 800, color: p.product.theme.accent, background: o > 0.9 ? 'rgba(224,122,44,.12)' : 'transparent' }}>{r.b}</div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

const WarningL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const left = Math.max(0, Math.ceil((p.frames - f) / fps));
  const pulse = 0.85 + Math.sin(f / 4) * 0.15;
  return (
    <AbsoluteFill style={{ background: '#1a0303', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(45deg, rgba(255,40,40,.08) 0 40px, transparent 40px 80px)' }} />
      <div style={{ fontSize: 150, opacity: pulse }}>⚠️</div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 130, color: '#ff3b3b', letterSpacing: 6 }}>{p.scene.headline ?? 'CẢNH BÁO SPOILER'}</div>
      <div style={{ marginTop: 20, fontFamily: BODY, fontWeight: 700, fontSize: 46, color: '#fff', maxWidth: 1400 }}>{p.scene.sub}</div>
      <div style={{ marginTop: 50, fontFamily: HEAD, fontWeight: 800, fontSize: 90, color: '#fff' }}>{left}</div>
    </AbsoluteFill>
  );
};

const TimelineL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  const steps = p.scene.rows ?? [];
  const step = Math.max(8, (p.frames - 20) / Math.max(1, steps.length));
  const x0 = 200;
  const x1 = W - 200;
  return (
    <>
      <Dim {...p} amount={0.2} />
      <div style={{ position: 'absolute', left: 130, top: 140, fontFamily: HEAD, fontWeight: 800, fontSize: 80, color: '#fff', opacity: ease(f, 10) }}>{p.scene.headline}</div>
      <div style={{ position: 'absolute', left: x0, top: 572, height: 8, width: (x1 - x0) * ease(f - 4, p.frames * 0.6), background: p.product.theme.primary }} />
      {steps.map((s, i) => {
        const x = x0 + ((x1 - x0) * i) / Math.max(1, steps.length - 1);
        const o = ease(f - 8 - i * step, 10);
        return (
          <div key={i} style={{ position: 'absolute', left: x - 230, top: 430, width: 460, textAlign: 'center', opacity: o }}>
            <div style={{ height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 50, lineHeight: 1, color: p.product.theme.accent, whiteSpace: 'nowrap' }}>{s.label}</div>
            <div style={{ margin: '24px auto', width: 44, height: 44, borderRadius: '50%', background: '#fff', border: `10px solid ${p.product.theme.primary}` }} />
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 36, lineHeight: 1.3, color: '#fff' }}>{s.a}</div>
            {s.b ? <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 600, fontSize: 28, color: 'rgba(255,255,255,.65)' }}>{s.b}</div> : null}
          </div>
        );
      })}
    </>
  );
};

const OutroL: React.FC<LP> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 12 } });
  return (
    <>
      <Dim {...p} amount={0.3} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 110, color: '#fff', opacity: ease(f, 10) }}>{p.scene.headline}</div>
        <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 700, fontSize: 44, color: 'rgba(255,255,255,.85)', maxWidth: 1300 }}>{p.scene.sub}</div>
        <div
          style={{
            marginTop: 60,
            transform: `scale(${s})`,
            background: '#ff0033',
            color: '#fff',
            fontFamily: BODY,
            fontWeight: 900,
            fontSize: 54,
            padding: '26px 70px',
            borderRadius: 16,
            boxShadow: '0 14px 0 rgba(0,0,0,.4)',
          }}
        >
          ĐĂNG KÝ @TheBookerRise
        </div>
      </AbsoluteFill>
    </>
  );
};

const LONG: Partial<Record<RenderScene['type'], React.FC<LP>>> = {
  clip: ClipL,
  chapter: ChapterL,
  title: TitleL,
  list: ListL,
  quote: QuoteL,
  compare: CompareL,
  warning: WarningL,
  timeline: TimelineL,
  outro: OutroL,
};

const Chrome: React.FC<{ chapter?: string; theme: Product['theme']; source?: string }> = ({ chapter, theme }) => (
  <>
    <div style={{ position: 'absolute', top: 44, right: 60, fontFamily: BODY, fontWeight: 800, fontSize: 28, color: 'rgba(255,255,255,.8)', letterSpacing: 1, ...strokeText(3, 'rgba(0,0,0,.6)') }}>
      @TheBookerRise
    </div>
    {chapter ? (
      <div style={{ position: 'absolute', top: 40, left: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: theme.primary }} />
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: 'rgba(255,255,255,.85)', ...strokeText(3, 'rgba(0,0,0,.6)') }}>{chapter.toUpperCase()}</div>
      </div>
    ) : null}
  </>
);

const CrossFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 6], [0, 1], { extrapolateRight: 'clamp' }) }}>{children}</AbsoluteFill>;
};

export const LongForm: React.FC<RenderProps> = ({ product, scenes, music }) => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: product.theme.bg }}>
      {music ? <Audio src={music} volume={0.16} loop /> : null}
      {scenes.map((scene, i) => {
        const frames = sceneFrames(scene);
        const start = from;
        from += frames;
        const Comp = LONG[scene.type] ?? ClipL;
        const showChrome = scene.type !== 'warning' && scene.type !== 'title' && scene.type !== 'chapter';
        return (
          <Sequence key={i} from={start} durationInFrames={frames} name={`${i + 1}. ${scene.type} ${scene.headline ?? ''}`}>
            <CrossFade>
              <Comp scene={scene} product={product} frames={frames} idx={i} />
            </CrossFade>
            {scene.audio ? <Audio src={scene.audio} /> : null}
            {showChrome ? <Chrome chapter={scene.chapterName} theme={product.theme} /> : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
