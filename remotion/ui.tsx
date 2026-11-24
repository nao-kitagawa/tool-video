import React from 'react';
import { AbsoluteFill, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadBaloo } from '@remotion/google-fonts/Baloo2';
import { loadFont as loadBVP } from '@remotion/google-fonts/BeVietnamPro';
import type { Product, Theme } from './types';

export const HEAD = loadBaloo('normal', { weights: ['800'], subsets: ['vietnamese', 'latin'] }).fontFamily;
export const BODY = loadBVP('normal', { weights: ['600', '800', '900'], subsets: ['vietnamese', 'latin'] }).fontFamily;

/** Mix hex color with black (amt<0) or white (amt>0). */
export const shade = (hex: string, amt: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt),
  );
  return `rgb(${ch.join(',')})`;
};

export const useEnter = (delay = 0, damping = 12) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.6 } });
};

/** Thick outlined text, TikTok style. */
export const strokeText = (px: number, color = '#000'): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${color}`,
  paintOrder: 'stroke fill',
});

export const Background: React.FC<{ theme: Theme; intensity?: number }> = ({ theme, intensity = 1 }) => {
  const frame = useCurrentFrame();
  const rot = frame * 0.25;
  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, ${shade(theme.primary, 0.15)} 0%, ${theme.primary} 28%, ${shade(theme.primary, -0.55)} 62%, ${theme.bg} 100%)`,
        }}
      />
      {/* sunburst rays */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '42%',
          width: 3200,
          height: 3200,
          marginLeft: -1600,
          marginTop: -1600,
          transform: `rotate(${rot}deg)`,
          opacity: 0.16 * intensity,
          background: `repeating-conic-gradient(${theme.accent} 0deg 9deg, transparent 9deg 22.5deg)`,
          maskImage: 'radial-gradient(circle, black 0%, black 35%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, black 35%, transparent 70%)',
        }}
      />
      {/* dots pattern */}
      <AbsoluteFill
        style={{
          opacity: 0.08,
          backgroundImage: `radial-gradient(${theme.text} 3px, transparent 3px)`,
          backgroundSize: '48px 48px',
          backgroundPosition: `0 ${frame * 0.6}px`,
        }}
      />
    </AbsoluteFill>
  );
};

export const FloatingEmojis: React.FC<{ emojis: string[]; seed: string; count?: number; burst?: boolean }> = ({
  emojis,
  seed,
  count = 10,
  burst = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!emojis.length) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const e = emojis[i % emojis.length];
        const size = 70 + r('s') * 90;
        let x: number, y: number;
        if (burst) {
          const p = spring({ frame: frame - r('d') * 6, fps, config: { damping: 14, mass: 0.7 } });
          const ang = r('a') * Math.PI * 2;
          const dist = 380 + r('r') * 420;
          x = 540 + Math.cos(ang) * dist * p;
          y = 820 + Math.sin(ang) * dist * p + frame * 1.5;
        } else {
          x = r('x') * 1080;
          y = 1900 - ((frame * (2 + r('v') * 4) + r('y') * 1900) % 2100);
        }
        const rot = Math.sin((frame + i * 20) / 14) * 20 + r('rot') * 40;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2,
              fontSize: size,
              transform: `rotate(${rot}deg)`,
              filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.35))',
            }}
          >
            {e}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Fallback stylised snack bag when user gives no product photo. */
export const PackShot: React.FC<{ product: Product; width?: number }> = ({ product, width = 560 }) => {
  const { theme } = product;
  const h = width * 1.38;
  const teeth = 14;
  const zig = (y0: number, dir: 1 | -1) =>
    Array.from({ length: teeth * 2 + 1 })
      .map((_, i) => `${(i / (teeth * 2)) * 100}% ${y0 + (i % 2 ? dir * 2.2 : 0)}%`)
      .join(',');
  const clip = `polygon(${zig(0, 1)}, 97% 50%, ${zig(100, -1)
    .split(',')
    .reverse()
    .join(',')}, 3% 50%)`;
  const emoji = product.emojis?.[0] ?? '🍿';
  return (
    <div style={{ width, height: h, position: 'relative', filter: 'drop-shadow(0 40px 50px rgba(0,0,0,.55))' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: clip,
          background: `linear-gradient(165deg, ${shade(theme.primary, 0.12)} 0%, ${theme.primary} 45%, ${shade(theme.primary, -0.45)} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: h * 0.07,
          overflow: 'hidden',
        }}
      >
        {/* crimp bands */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.055, background: shade(theme.primary, -0.3) }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h * 0.055, background: shade(theme.primary, -0.3) }} />
        {product.brand ? (
          <div
            style={{
              marginTop: h * 0.03,
              background: theme.accent,
              color: shade(theme.primary, -0.6),
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: width * 0.065,
              padding: `${width * 0.012}px ${width * 0.05}px`,
              borderRadius: 999,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {product.brand}
          </div>
        ) : null}
        <div
          style={{
            marginTop: h * 0.035,
            width: width * 0.56,
            height: width * 0.56,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, #fff 0%, ${shade(theme.accent, 0.4)} 60%, ${theme.accent} 100%)`,
            border: `${width * 0.018}px solid #fff`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: width * 0.3,
            boxShadow: 'inset 0 -12px 30px rgba(0,0,0,.25)',
          }}
        >
          {emoji}
        </div>
        <div
          style={{
            marginTop: h * 0.03,
            padding: `0 ${width * 0.07}px`,
            textAlign: 'center',
            fontFamily: HEAD,
            fontWeight: 800,
            color: '#fff',
            fontSize: width * 0.115,
            lineHeight: 1.0,
            ...strokeText(width * 0.014, shade(theme.primary, -0.65)),
          }}
        >
          {product.name}
        </div>
        {product.tagline ? (
          <div
            style={{
              marginTop: h * 0.02,
              fontFamily: BODY,
              fontWeight: 800,
              color: theme.accent,
              fontSize: width * 0.05,
              textAlign: 'center',
              padding: `0 ${width * 0.08}px`,
            }}
          >
            {product.tagline}
          </div>
        ) : null}
        {/* gloss */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '8%',
            width: '16%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.28) 50%, rgba(255,255,255,0) 100%)',
          }}
        />
      </div>
    </div>
  );
};

export const ProductVisual: React.FC<{ product: Product; image?: number; width?: number; float?: boolean }> = ({
  product,
  image = 0,
  width = 560,
  float = true,
}) => {
  const frame = useCurrentFrame();
  const dy = float ? Math.sin(frame / 12) * 14 : 0;
  const rot = float ? Math.sin(frame / 20) * 2.5 : 0;
  const src = product.images.length ? product.images[Math.min(image, product.images.length - 1)] : null;
  return (
    <div style={{ transform: `translateY(${dy}px) rotate(${rot}deg)` }}>
      {src ? (
        <Img
          src={src}
          style={{
            width,
            height: 'auto',
            maxHeight: width * 1.25,
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 40px 50px rgba(0,0,0,.55))',
          }}
        />
      ) : (
        <PackShot product={product} width={width} />
      )}
    </div>
  );
};

export const Headline: React.FC<{
  text: string;
  theme: Theme;
  size?: number;
  delay?: number;
  color?: string;
  shake?: boolean;
}> = ({ text, theme, size = 130, delay = 0, color, shake }) => {
  const frame = useCurrentFrame();
  const p = useEnter(delay, 10);
  const wobble = shake ? Math.sin(frame * 1.3) * interpolate(frame, [0, 20], [6, 1.5], { extrapolateRight: 'clamp' }) : 0;
  return (
    <div
      style={{
        fontFamily: HEAD,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.02,
        color: color ?? theme.text,
        textAlign: 'center',
        padding: '0 70px',
        transform: `scale(${interpolate(p, [0, 1], [2.2, 1])}) rotate(${wobble}deg)`,
        opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
        textShadow: `0 10px 0 ${shade(theme.primary, -0.6)}`,
        ...strokeText(size * 0.09, shade(theme.primary, -0.7)),
      }}
    >
      {text}
    </div>
  );
};
