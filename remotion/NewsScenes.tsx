import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, HEAD, shade } from './ui';
import type { Theme } from './types';
import type { P } from './Scenes';

const vn = (n: number, d = 0) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const ease = (f: number, dur: number) => {
  const t = Math.max(0, Math.min(1, f / dur));
  return 1 - Math.pow(1 - t, 3);
};

export const NewsBackground: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 80% 10%, ${shade(theme.primary, -0.35)} 0%, transparent 45%), radial-gradient(circle at 10% 90%, ${shade(theme.bg, 0.12)} 0%, transparent 55%)`,
          opacity: 0.9,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.07,
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${frame * 0.5}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Persistent chrome: topic tag + source footer. */
export const NewsChrome: React.FC<{ theme: Theme; tag: string; source: string }> = ({ theme, tag, source }) => (
  <>
    <div style={{ position: 'absolute', top: 80, left: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: theme.primary, boxShadow: `0 0 0 6px ${theme.primary}55` }} />
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: '#fff' }}>{tag}</div>
    </div>
    <div style={{ position: 'absolute', bottom: 70, left: 60, fontFamily: BODY, fontWeight: 600, fontSize: 28, color: 'rgba(255,255,255,.7)' }}>{source}</div>
  </>
);

const Title: React.FC<{ text: string; size?: number; delay?: number; color?: string }> = ({ text, size = 84, delay = 0, color = '#fff' }) => {
  const f = useCurrentFrame();
  const p = ease(f - delay, 10);
  return (
    <div
      style={{
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.12,
        color,
        transform: `translateY(${(1 - p) * 40}px)`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};

const RedBar: React.FC<{ theme: Theme; delay?: number }> = ({ theme, delay = 0 }) => {
  const f = useCurrentFrame();
  return <div style={{ width: 140 * ease(f - delay, 10), height: 12, background: theme.primary, marginBottom: 30 }} />;
};

export const NewsTitleScene: React.FC<P> = ({ scene, product, frames }) => {
  const f = useCurrentFrame();
  const photo = product.photos?.[scene.photo ?? 0];
  const z = interpolate(f, [0, frames], [1.05, 1.18]);
  return (
    <>
      {photo ? (
        <AbsoluteFill>
          <Img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})` }} />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${product.theme.bg}cc 0%, ${product.theme.bg}33 30%, ${product.theme.bg}aa 55%, ${product.theme.bg} 78%)` }} />
        </AbsoluteFill>
      ) : null}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 980 }}>
        {scene.sub ? (
          <div
            style={{
              display: 'inline-block',
              background: product.theme.primary,
              color: '#fff',
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: 34,
              padding: '10px 22px',
              marginBottom: 26,
              opacity: ease(f, 6),
            }}
          >
            {scene.sub}
          </div>
        ) : null}
        <Title text={scene.headline ?? product.name} size={92} delay={3} />
      </div>
      {scene.quote ? (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 1600, fontFamily: BODY, fontWeight: 600, fontSize: 30, color: 'rgba(255,255,255,.65)' }}>{scene.quote}</div>
      ) : null}
    </>
  );
};

/** Big counting number + optional comparison bars. */
export const StatScene: React.FC<P> = ({ scene, product }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = scene.number;
  const cmp = scene.compare;
  const p = ease(f - 4, fps * 0.9);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 300 }}>
      <RedBar theme={product.theme} />
      {scene.headline ? <Title text={scene.headline} size={64} /> : null}
      {n ? (
        <div style={{ marginTop: 40, fontFamily: HEAD, fontWeight: 800, fontSize: n.size ?? 210, lineHeight: 1, color: product.theme.accent, whiteSpace: 'nowrap' }}>
          {n.prefix ?? ''}
          {vn(n.value * p, n.decimals ?? 0)}
          <span style={{ fontSize: (n.size ?? 210) * 0.36, marginLeft: 16 }}>{n.suffix ?? ''}</span>
        </div>
      ) : null}
      {scene.sub ? (
        <div style={{ marginTop: 20, fontFamily: BODY, fontWeight: 800, fontSize: 52, color: '#fff', opacity: ease(f - 10, 10) }}>{scene.sub}</div>
      ) : null}
      {cmp ? (
        <div style={{ marginTop: 70, display: 'flex', flexDirection: 'column', gap: 34 }}>
          {[cmp.left, cmp.right].map((c, i) => {
            const max = Math.max(cmp.left.value, cmp.right.value);
            const w = ease(f - 8 - i * 14, fps * 0.8) * (c.value / max);
            return (
              <div key={i}>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: 'rgba(255,255,255,.8)', marginBottom: 12 }}>{c.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  <div style={{ height: 84, width: `${Math.max(1.5, w * 78)}%`, background: i === 0 ? 'rgba(255,255,255,.55)' : product.theme.primary }} />
                  <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 80, color: i === 0 ? '#fff' : product.theme.accent }}>
                    {vn(Math.round(c.value * Math.min(1, w * (max / c.value))))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {scene.quote ? (
        <div
          style={{
            marginTop: 60,
            fontFamily: BODY,
            fontWeight: n || cmp ? 600 : 800,
            fontSize: n || cmp ? 36 : 58,
            lineHeight: 1.3,
            color: n || cmp ? 'rgba(255,255,255,.7)' : '#fff',
            borderLeft: n || cmp ? 'none' : `10px solid ${product.theme.primary}`,
            paddingLeft: n || cmp ? 0 : 36,
            opacity: ease(f - 16, 10),
          }}
        >
          {scene.quote}
        </div>
      ) : null}
    </div>
  );
};

/** Table: label | before | after, rows reveal one by one. */
export const CompareScene: React.FC<P> = ({ scene, product, frames }) => {
  const f = useCurrentFrame();
  const rows = scene.rows ?? [];
  const step = Math.max(6, (frames - 15) / Math.max(1, rows.length));
  const [ca, cb] = scene.cols ?? ['Được duyệt', 'Thực tế'];
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 260 }}>
      <div style={{ paddingLeft: 10 }}>
        <RedBar theme={product.theme} />
        <Title text={scene.headline ?? ''} size={70} />
      </div>
      <div style={{ marginTop: 50, display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', fontFamily: BODY }}>
        {['', ca, cb].map((h, i) => (
          <div key={i} style={{ padding: '14px 18px', fontWeight: 900, fontSize: 32, color: i === 2 ? product.theme.accent : 'rgba(255,255,255,.7)', borderBottom: '3px solid rgba(255,255,255,.3)', textAlign: i ? 'right' : 'left' }}>
            {h}
          </div>
        ))}
        {rows.map((r, i) => {
          const p = ease(f - 8 - i * step, 8);
          const cell: React.CSSProperties = {
            padding: '26px 18px',
            borderBottom: '1px solid rgba(255,255,255,.15)',
            opacity: p,
            transform: `translateX(${(1 - p) * 60}px)`,
          };
          return (
            <React.Fragment key={i}>
              <div style={{ ...cell, fontWeight: 700, fontSize: 38, color: '#fff' }}>{r.label}</div>
              <div style={{ ...cell, fontWeight: 800, fontSize: 44, color: 'rgba(255,255,255,.75)', textAlign: 'right' }}>{r.a}</div>
              <div style={{ ...cell, fontWeight: 900, fontSize: 48, color: product.theme.accent, textAlign: 'right', background: p > 0.9 ? `${product.theme.primary}33` : 'transparent' }}>{r.b}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/** Numbered list of points. */
export const ListScene: React.FC<P> = ({ scene, product, frames }) => {
  const f = useCurrentFrame();
  const items = scene.bullets ?? [];
  const step = Math.max(6, (frames - 12) / Math.max(1, items.length + 0.3));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 280 }}>
      <RedBar theme={product.theme} />
      <Title text={scene.headline ?? ''} size={70} />
      {scene.sub ? <div style={{ marginTop: 16, fontFamily: BODY, fontWeight: 600, fontSize: 36, color: 'rgba(255,255,255,.7)' }}>{scene.sub}</div> : null}
      <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {items.map((it, i) => {
          const p = ease(f - 6 - i * step, 8);
          return (
            <div key={i} style={{ display: 'flex', gap: 26, alignItems: 'flex-start', opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
              <div style={{ flex: '0 0 auto', width: 78, height: 78, background: product.theme.primary, color: '#fff', fontFamily: HEAD, fontWeight: 800, fontSize: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, color: '#fff', lineHeight: 1.25, paddingTop: 8 }}>{it}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const OutroScene: React.FC<P> = ({ scene, product }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 4, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 70, textAlign: 'center' }}>
      <div style={{ marginTop: -300 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: 'rgba(255,255,255,.7)', letterSpacing: 3 }}>{scene.sub ?? ''}</div>
        <div style={{ marginTop: 20, fontFamily: HEAD, fontWeight: 800, fontSize: 120, lineHeight: 1.05, color: '#fff', transform: `scale(${s})` }}>{scene.headline ?? ''}</div>
        <div style={{ margin: '50px auto 0', width: 300 * ease(f - 10, 12), height: 10, background: product.theme.primary }} />
      </div>
    </AbsoluteFill>
  );
};

/** Animated line chart with labelled points and dashed level lines. */
export const ChartScene: React.FC<P> = ({ scene, product, frames }) => {
  const f = useCurrentFrame();
  const pts = scene.points ?? [];
  const levels = scene.levels ?? [];
  const unit = scene.unit ?? '';
  const W = 960, H = 720, padX = 70, padY = 90;
  const vals = [...pts.map((p) => p.value), ...levels.map((l) => l.value)];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const min = lo - span * 0.15, max = hi + span * 0.15;
  const x = (i: number) => padX + (i * (W - padX * 2)) / Math.max(1, pts.length - 1);
  const y = (v: number) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);
  const draw = ease(f - 6, Math.min(frames * 0.6, 60));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(x(i) - x(i - 1), y(pts[i].value) - y(pts[i - 1].value));
  const fmt = (v: number) => `${unit}${vn(v)}`;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 260 }}>
      <RedBar theme={product.theme} />
      <Title text={scene.headline ?? ''} size={68} />
      <svg width={W} height={H} style={{ marginTop: 30, overflow: 'visible' }}>
        {levels.map((l, i) => (
          <g key={i} opacity={ease(f - 4, 10)}>
            <line x1={0} x2={W} y1={y(l.value)} y2={y(l.value)} stroke={product.theme.accent} strokeWidth={4} strokeDasharray="18 14" />
            <text x={W} y={y(l.value) + 46} textAnchor="end" fill={product.theme.accent} style={{ fontFamily: BODY, fontWeight: 900, fontSize: 36 }}>
              {l.label}
            </text>
          </g>
        ))}
        <path d={d} fill="none" stroke={product.theme.primary} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        {pts.map((p, i) => {
          const at = pts.length > 1 ? i / (pts.length - 1) : 1;
          const o = draw >= at - 0.001 ? ease(f - 6 - at * Math.min(frames * 0.6, 60), 6) : 0;
          const above = i === 0 || p.value >= pts[i - 1].value;
          return (
            <g key={i} opacity={o}>
              <circle cx={x(i)} cy={y(p.value)} r={18} fill="#fff" stroke={product.theme.primary} strokeWidth={8} />
              <text x={x(i)} y={y(p.value) + (above ? -40 : 66)} textAnchor="middle" fill="#fff" style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 52 }}>
                {p.display ?? fmt(p.value)}
              </text>
              <text x={x(i)} y={H + 10} textAnchor="middle" fill="rgba(255,255,255,.7)" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34 }}>
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
