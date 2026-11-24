import React from 'react';
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, HEAD, strokeText } from './ui';
import type { Clip, Product } from './types';
import type { P } from './Scenes';

/** Split a scene's frames across its clips. Dialogue scenes keep real time (rate 1). */
export const planClips = (input: Clip[], frames: number, fps: number, realtime: boolean) => {
  // Not enough footage for the voice-over? Cycle the chosen clips (max slow-mo 0.8x)
  // instead of letting playback run past the shot into unrelated trailer frames.
  let clips = input;
  if (!realtime && input.length) {
    const need = (frames / fps) * 0.8;
    clips = [];
    let sum = 0;
    for (let k = 0; sum < need || clips.length < input.length; k++) {
      const c = input[k % input.length];
      clips.push(c);
      sum += c.d;
      if (k > 200) break;
    }
  }
  const total = clips.reduce((s, c) => s + c.d, 0) || 1;
  let from = 0;
  return clips.map((c, i) => {
    const allot = i === clips.length - 1 ? frames - from : Math.round((frames * c.d) / total);
    const rate = realtime ? 1 : Math.max(0.8, Math.min(1.25, c.d / (allot / fps)));
    const p = { ...c, from, allot, rate };
    from += allot;
    return p;
  });
};

const srcOf = (product: Product, c: Clip) => {
  const v = product.videos ?? [];
  return v[Math.min(c.v ?? 0, v.length - 1)];
};

/** One clip, either cropped to fill 9:16 or letterboxed 16:9 over its own blurred copy. */
const ClipView: React.FC<{ src: string; c: Clip & { rate: number }; layout: 'fill' | 'fit'; volume: number; allot: number }> = ({
  src,
  c,
  layout,
  volume,
  allot,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const trim = Math.round(c.t * fps);
  const push = interpolate(f, [0, allot], [1.0, c.zoom ?? 1.08]);
  const common = { src, trimBefore: trim, playbackRate: c.rate };
  if (layout === 'fill') {
    // 16:9 source scaled to 1920 tall → 3413 wide; pan to focus x.
    const W = 1920 * (16 / 9);
    const x = -(W - 1080) * (c.x ?? 0.5);
    return (
      <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
        <OffthreadVideo {...common} volume={volume} style={{ position: 'absolute', height: 1920, width: W, left: x, top: 0, transform: `scale(${push})`, transformOrigin: `${(c.x ?? 0.5) * 100}% 50%` }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
      <OffthreadVideo {...common} muted style={{ position: 'absolute', height: 1920, width: 1920 * (16 / 9), left: -(1920 * (16 / 9) - 1080) / 2, filter: 'blur(36px) brightness(0.35)', transform: 'scale(1.1)' }} />
      <div style={{ position: 'absolute', top: 640, left: 0, width: 1080, height: 608, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.7)' }}>
        <OffthreadVideo {...common} volume={volume} style={{ width: 1080, height: 608, transform: `scale(${push})` }} />
      </div>
    </AbsoluteFill>
  );
};

export const ClipScene: React.FC<P> = ({ scene, product, frames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clips = scene.clips ?? [];
  const plan = planClips(clips, frames, fps, !!scene.dialogue);
  const layout = scene.layout ?? 'fill';
  const vol = scene.dialogue ? 1 : scene.bedVolume ?? 0.12;
  const p = Math.min(1, f / 8);
  return (
    <>
      {plan.map((c, i) => {
        const src = srcOf(product, c);
        if (!src) return null;
        return (
          <Sequence key={i} from={c.from} durationInFrames={c.allot} layout="none">
            <ClipView src={src} c={c} layout={layout} volume={vol} allot={c.allot} />
          </Sequence>
        );
      })}
      {/* cinematic vignette */}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 60%, rgba(0,0,0,.75) 100%)' }} />
      {scene.headline ? (
        <div
          style={{
            position: 'absolute',
            top: layout === 'fit' ? 330 : 170,
            left: 60,
            right: 60,
            textAlign: 'center',
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 92,
            lineHeight: 1.05,
            color: '#fff',
            opacity: p,
            transform: `translateY(${(1 - p) * 30}px)`,
            ...strokeText(10, '#000'),
          }}
        >
          {scene.headline}
        </div>
      ) : null}
      {scene.label ? (
        <div style={{ position: 'absolute', left: 60, top: layout === 'fit' ? 1270 : 1120, opacity: Math.min(1, Math.max(0, (f - 6) / 8)) }}>
          <div style={{ width: 90, height: 8, background: product.theme.primary, marginBottom: 14 }} />
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 52, color: '#fff', ...strokeText(6, '#000') }}>{scene.label}</div>
          {scene.sub ? <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 36, color: product.theme.accent, marginTop: 6 }}>{scene.sub}</div> : null}
        </div>
      ) : null}
    </>
  );
};

/** Static two-line subtitle for original dialogue: VN (big) + EN original (small). */
export const DialogueSubtitle: React.FC<{ vn: string; en?: string; theme: Product['theme'] }> = ({ vn, en, theme }) => {
  const f = useCurrentFrame();
  const o = Math.min(1, f / 5);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 1330, textAlign: 'center', opacity: o }}>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 64, lineHeight: 1.2, color: theme.accent, ...strokeText(12, '#000') }}>{vn}</div>
      {en ? <div style={{ marginTop: 16, fontFamily: BODY, fontWeight: 600, fontStyle: 'italic', fontSize: 36, color: '#fff', ...strokeText(6, '#000') }}>{en}</div> : null}
    </div>
  );
};

/** Dim blurred trailer footage behind a card scene. */
export const BgClip: React.FC<{ product: Product; c: Clip }> = ({ product, c }) => {
  const { fps } = useVideoConfig();
  const src = srcOf(product, c);
  if (!src) return null;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <OffthreadVideo src={src} trimBefore={Math.round(c.t * fps)} playbackRate={0.6} volume={0.1} style={{ position: 'absolute', height: 1920, width: 1920 * (16 / 9), left: -(1920 * (16 / 9) - 1080) * (c.x ?? 0.5), filter: 'blur(14px) brightness(0.3) saturate(0.8)' }} />
    </AbsoluteFill>
  );
};
