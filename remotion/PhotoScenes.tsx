import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, random, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, FloatingEmojis, Headline, shade, strokeText, useEnter } from './ui';
import type { CutMeta } from './types';
import type { P } from './Scenes';

const photoOf = (p: P) => {
  const photos = p.product.photos ?? [];
  return photos.length ? photos[Math.min(p.scene.photo ?? 0, photos.length - 1)] : p.product.images[0];
};

/** Real photo, blurred backdrop + framed Ken Burns. */
export const HeroScene: React.FC<P> = (props) => {
  const { scene, product, frames } = props;
  const frame = useCurrentFrame();
  const src = photoOf(props);
  const z = interpolate(frame, [0, frames], [1.0, 1.14]);
  const pan = interpolate(frame, [0, frames], [-20, 20]);
  return (
    <>
      <AbsoluteFill>
        <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.45) saturate(1.3)', transform: 'scale(1.25)' }} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 430, left: 0, width: 1080, height: 940, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}>
        <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) translateX(${pan}px)` }} />
      </div>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
        <Headline text={scene.headline ?? ''} theme={product.theme} size={140} shake />
      </AbsoluteFill>
    </>
  );
};

/** Full-bleed photo(s) with zoom; montage when scene.photos has several. */
export const MacroScene: React.FC<P> = (props) => {
  const { scene, product, frames } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const all = product.photos?.length ? product.photos : product.images;
  const list = (scene.photos?.length ? scene.photos : [scene.photo ?? 0]).map((i) => all[Math.min(i, all.length - 1)]);
  const per = frames / list.length;
  const k = Math.min(list.length - 1, Math.floor(frame / per));
  const lf = frame - k * per;
  const src = list[k];
  const [fx, fy] = scene.focus ?? [0.5, 0.5];
  const [z0, z1] = scene.zoom ?? [1.35, 1.7];
  const dir = k % 2 ? -1 : 1;
  const z = interpolate(lf, [0, per], dir > 0 ? [z0, z1] : [z1, z0]);
  const drift = interpolate(lf, [0, per], [20 * dir, -20 * dir]);
  const flash = k > 0 ? interpolate(lf, [0, 4], [0.5, 0], { extrapolateRight: 'clamp' }) : 0;
  const bullets = scene.bullets ?? [];
  const step = Math.max(8, (frames - 12) / Math.max(1, bullets.length + 0.3));
  const bottom = scene.headlinePos === 'bottom';
  return (
    <>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${fx * 100}% ${fy * 100}%`,
            transform: `scale(${z}) translate(${drift}px, ${drift * 0.4}px)`,
            transformOrigin: `${fx * 100}% ${fy * 100}%`,
            filter: 'saturate(1.1) contrast(1.05)',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: bottom
            ? 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.75) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 62%, rgba(0,0,0,.7) 100%)',
        }}
      />
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: bottom ? 1080 : 170 }}>
        <Headline text={scene.headline ?? ''} theme={product.theme} size={bottom ? 104 : 112} />
      </AbsoluteFill>
      {bullets.map((b, i) => {
        const f = frame - 6 - i * step;
        const p = f < 0 ? 0 : Math.min(1, 1 - Math.pow(1 - Math.min(1, f / (fps * 0.25)), 3));
        const left = i % 2 === 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: (bottom ? 700 : 520) + i * (bottom ? 125 : 230),
              [left ? 'left' : 'right']: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              background: 'rgba(255,255,255,.95)',
              borderRadius: 999,
              padding: '20px 36px 20px 22px',
              transform: `scale(${p}) rotate(${left ? -3 : 3}deg)`,
              transformOrigin: left ? 'left center' : 'right center',
              boxShadow: `0 10px 0 ${shade(product.theme.primary, -0.5)}`,
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: product.theme.accent, boxShadow: `0 0 0 8px ${product.theme.primary}` }} />
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: bottom ? 46 : 54, color: '#1a1a1a' }}>{b}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- bite

const pickSpots = (meta: CutMeta, n: number) => {
  const L = meta.spots.length;
  // left, top-right, right, top-left, top… (avoid bottom edge)
  const order = [0.75, 0.125, 0.25, 0.875, 0.0, 0.625, 0.375];
  return Array.from({ length: n }).map((_, i) => meta.spots[Math.round(order[i % order.length] * L) % L]);
};

const Crumbs: React.FC<{
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  src: string;
  dw: number;
  dh: number;
  ox: number;
  oy: number;
  seed: string;
}> = ({ x, y, dirX, dirY, src, dw, dh, ox, oy, seed }) => {
  const f = useCurrentFrame();
  if (f < 0 || f > 45) return null;
  return (
    <>
      {Array.from({ length: 30 }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const size = 16 + r('s') * 38;
        const vx = dirX * (5 + r('v') * 16) + (r('vx') - 0.5) * 12;
        const vy = dirY * (4 + r('v') * 10) - (6 + r('vy') * 14);
        const g = 1.6;
        const px = x + vx * f;
        const py = y + vy * f + 0.5 * g * f * f;
        const rot = (r('r') - 0.5) * 40 * f;
        const pts = Array.from({ length: 6 })
          .map((__, k) => {
            const a = (k / 6) * Math.PI * 2;
            const rr = 35 + r(`p${k}`) * 15;
            return `${50 + Math.cos(a) * rr}% ${50 + Math.sin(a) * rr}%`;
          })
          .join(',');
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px - size / 2,
              top: py - size / 2,
              width: size,
              height: size,
              backgroundImage: `url(${src})`,
              backgroundSize: `${dw}px ${dh}px`,
              backgroundPosition: `${-(ox + (r('tx') - 0.5) * 60)}px ${-(oy + (r('ty') - 0.5) * 60)}px`,
              clipPath: `polygon(${pts})`,
              transform: `rotate(${rot}deg)`,
              filter: 'brightness(1.08) drop-shadow(0 4px 4px rgba(0,0,0,.4))',
              opacity: interpolate(f, [30, 45], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}
          />
        );
      })}
    </>
  );
};

export const BiteScene: React.FC<P> = (props) => {
  const { scene, product, frames, idx, sfx } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgIdx = Math.min(scene.image ?? 0, Math.max(0, product.images.length - 1));
  const src = product.images[imgIdx];
  const meta = product.cutMeta?.[imgIdx];
  if (!src || !meta) return null;

  const n = scene.bites ?? 3;
  const DW = 900;
  const DH = DW * meta.aspect;
  const left0 = 540 - DW / 2;
  const top0 = 1000 - DH / 2;
  const first = Math.round(fps * 0.45);
  const gap = Math.max(fps * 0.55, (frames - first - fps * 0.5) / n);
  const biteFrames = Array.from({ length: n }).map((_, i) => Math.round(first + i * gap));
  const spots = pickSpots(meta, n);

  // viewBox: x in [0,1], y in [0,aspect]
  const ar = meta.aspect;
  const R = 0.155;
  const bites = spots.map((s, i) => {
    const vx = s.x - meta.cx;
    const vy = (s.y - meta.cy) * ar;
    const len = Math.hypot(vx, vy) || 1;
    const dx = vx / len;
    const dy = vy / len;
    const cx = s.x + dx * 0.035;
    const cy = s.y * ar + dy * 0.035;
    return { cx, cy, dx, dy, at: biteFrames[i] };
  });

  // punch + shake right after each bite
  const lastBite = biteFrames.filter((b) => b <= frame).at(-1);
  const since = lastBite === undefined ? 99 : frame - lastBite;
  const punch = since < 8 ? interpolate(since, [0, 8], [1.07, 1]) : 1;
  const shake = since < 6 ? Math.sin(since * 2.5) * (6 - since) * 2.2 : 0;
  // anticipation: lean towards next bite
  const next = biteFrames.find((b) => b > frame);
  const lean = next !== undefined && next - frame < 8 ? interpolate(next - frame, [0, 8], [1.05, 1]) : 1;
  const intro = useEnter(0, 11);
  const maskId = `bite-mask-${idx}`;

  return (
    <>
      <FloatingEmojis emojis={scene.emojis ?? product.emojis ?? []} seed={`bite${idx}`} count={6} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 170 }}>
        <Headline text={scene.headline ?? ''} theme={product.theme} size={120} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 450,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [4, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        <div style={{ background: 'rgba(0,0,0,.55)', color: '#fff', fontFamily: BODY, fontWeight: 800, fontSize: 40, padding: '10px 28px', borderRadius: 999 }}>
          🔊 Bật tiếng lên nghe giòn
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: left0,
          top: top0,
          width: DW,
          height: DH,
          transform: `translate(${shake}px, ${-shake * 0.5}px) scale(${intro * punch * lean}) rotate(${-4 + Math.sin(frame / 18) * 2}deg)`,
          filter: 'drop-shadow(0 40px 45px rgba(0,0,0,.55))',
        }}
      >
        <svg width={DW} height={DH} viewBox={`0 0 1 ${ar}`} style={{ overflow: 'visible' }}>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-0.2} y={-0.2} width={1.4} height={ar + 0.4}>
              <rect x={-0.2} y={-0.2} width={1.4} height={ar + 0.4} fill="white" />
              {bites
                .filter((b) => frame >= b.at)
                .map((b, i) => {
                  const px = -b.dy;
                  const py = b.dx;
                  return (
                    <g key={i} fill="black">
                      <circle cx={b.cx} cy={b.cy} r={R} />
                      <circle cx={b.cx + px * R * 0.8 - b.dx * R * 0.25} cy={b.cy + py * R * 0.8 - b.dy * R * 0.25} r={R * 0.62} />
                      <circle cx={b.cx - px * R * 0.8 - b.dx * R * 0.25} cy={b.cy - py * R * 0.8 - b.dy * R * 0.25} r={R * 0.62} />
                      <circle cx={b.cx + px * R * 0.35 - b.dx * R * 0.55} cy={b.cy + py * R * 0.35 - b.dy * R * 0.55} r={R * 0.55} />
                      <circle cx={b.cx - px * R * 0.35 - b.dx * R * 0.55} cy={b.cy - py * R * 0.35 - b.dy * R * 0.55} r={R * 0.55} />
                    </g>
                  );
                })}
            </mask>
          </defs>
          <image href={src} x={0} y={0} width={1} height={ar} mask={`url(#${maskId})`} preserveAspectRatio="none" />
        </svg>
      </div>
      {bites.map((b, i) => {
        const sx = left0 + b.cx * DW;
        const sy = top0 + (b.cy / ar) * DH;
        return (
          <React.Fragment key={i}>
            <Sequence from={b.at} durationInFrames={50} layout="none">
              <Crumbs
                x={sx}
                y={sy}
                dirX={b.dx}
                dirY={b.dy}
                src={src}
                dw={DW}
                dh={DH}
                ox={b.cx * DW}
                oy={(b.cy / ar) * DH}
                seed={`c${idx}-${i}`}
              />
            </Sequence>
            {sfx?.crunch?.length ? (
              <Sequence from={b.at} durationInFrames={Math.round(fps * 0.6)} layout="none">
                <Audio src={sfx.crunch[i % sfx.crunch.length]} volume={0.85} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}
      {/* "CRUNCH" pop text */}
      {lastBite !== undefined && since < 12 ? (
        <div
          style={{
            position: 'absolute',
            left: Math.min(740, Math.max(40, left0 + bites[biteFrames.indexOf(lastBite)].cx * DW - 150)),
            top: top0 + (bites[biteFrames.indexOf(lastBite)].cy / ar) * DH - 190,
            width: 300,
            textAlign: 'center',
            fontFamily: BODY,
            fontWeight: 900,
            fontSize: 84,
            color: product.theme.accent,
            transform: `scale(${interpolate(since, [0, 4, 12], [0.4, 1.15, 1])}) rotate(-8deg)`,
            opacity: interpolate(since, [8, 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            ...strokeText(12, '#000'),
          }}
        >
          RỘP!
        </div>
      ) : null}
    </>
  );
};
