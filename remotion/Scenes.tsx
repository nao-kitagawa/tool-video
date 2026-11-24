import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, FloatingEmojis, HEAD, Headline, ProductVisual, shade, strokeText, useEnter } from './ui';
import type { Product, RenderScene } from './types';
import { BiteScene, HeroScene, MacroScene } from './PhotoScenes';
import { ClipScene } from './VideoScenes';
import { ChartScene, CompareScene, ListScene, NewsTitleScene, OutroScene, StatScene } from './NewsScenes';

export type P = { scene: RenderScene; product: Product; frames: number; idx: number; sfx?: { crunch: string[] } };

const emojisOf = (scene: RenderScene, product: Product) => scene.emojis ?? product.emojis ?? [];

const Col: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 230 }) => (
  <AbsoluteFill style={{ alignItems: 'center', paddingTop: top }}>{children}</AbsoluteFill>
);

export const HookScene: React.FC<P> = ({ scene, product, idx }) => {
  const up = useEnter(4, 13);
  return (
    <>
      <FloatingEmojis emojis={emojisOf(scene, product)} seed={`hook${idx}`} count={12} burst />
      <Col top={300}>
        <Headline text={scene.headline ?? scene.voice} theme={product.theme} size={170} shake />
        {scene.sub ? (
          <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 800, fontSize: 60, color: product.theme.accent, textAlign: 'center', padding: '0 80px', ...strokeText(10) }}>
            {scene.sub}
          </div>
        ) : null}
      </Col>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ transform: `translateY(${interpolate(up, [0, 1], [900, 380])}px) rotate(-10deg)` }}>
          <ProductVisual product={product} image={scene.image} width={620} />
        </div>
      </AbsoluteFill>
    </>
  );
};

export const TextScene: React.FC<P> = ({ scene, product, idx }) => {
  const p = useEnter(6);
  return (
    <>
      <FloatingEmojis emojis={emojisOf(scene, product)} seed={`txt${idx}`} count={8} />
      <Col top={300}>
        <Headline text={scene.headline ?? ''} theme={product.theme} size={120} />
        {scene.sub ? (
          <div
            style={{
              marginTop: 40,
              maxWidth: 900,
              background: '#fff',
              color: '#111',
              borderRadius: 40,
              padding: '28px 44px',
              fontFamily: BODY,
              fontWeight: 800,
              fontSize: 56,
              textAlign: 'center',
              transform: `scale(${p})`,
              boxShadow: `0 14px 0 ${shade(product.theme.primary, -0.6)}`,
            }}
          >
            {scene.sub}
          </div>
        ) : null}
      </Col>
      <AbsoluteFill style={{ alignItems: 'center', top: 820 }}>
        <div style={{ transform: `scale(${interpolate(p, [0, 1], [0.3, 1])})`, opacity: 0.95 }}>
          <ProductVisual product={product} image={scene.image} width={360} />
        </div>
      </AbsoluteFill>
    </>
  );
};

export const ProductScene: React.FC<P> = ({ scene, product, idx }) => {
  const p = useEnter(0, 9);
  const frame = useCurrentFrame();
  return (
    <>
      <FloatingEmojis emojis={emojisOf(scene, product)} seed={`prod${idx}`} count={10} />
      <Col top={200}>
        <Headline text={scene.headline ?? product.name} theme={product.theme} size={120} delay={4} />
      </Col>
      <AbsoluteFill style={{ alignItems: 'center', top: 480 }}>
        <div style={{ transform: `scale(${interpolate(p, [0, 1], [0, 1])}) rotate(${interpolate(p, [0, 1], [-25, 0])}deg)` }}>
          <ProductVisual product={product} image={scene.image} width={product.images.length ? 820 : 520} />
        </div>
      </AbsoluteFill>
      {product.tagline || scene.sub ? (
        <div
          style={{
            position: 'absolute',
            top: 1130,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: interpolate(frame, [12, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          <div
            style={{
              background: product.theme.accent,
              color: '#111',
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: 50,
              padding: '14px 40px',
              borderRadius: 999,
              transform: 'rotate(-3deg)',
            }}
          >
            {scene.sub ?? product.tagline}
          </div>
        </div>
      ) : null}
    </>
  );
};

export const FeaturesScene: React.FC<P> = ({ scene, product, frames, idx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bullets = scene.bullets ?? [];
  const step = Math.max(6, (frames - 10) / Math.max(1, bullets.length + 0.4));
  return (
    <>
      <FloatingEmojis emojis={emojisOf(scene, product)} seed={`feat${idx}`} count={6} />
      <Col top={190}>
        <Headline text={scene.headline ?? 'Có gì đặc biệt?'} theme={product.theme} size={104} />
      </Col>
      <div style={{ position: 'absolute', top: 470, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {bullets.map((b, i) => {
          const f = frame - i * step;
          const p = f < 0 ? 0 : Math.min(1, 1 - Math.pow(1 - Math.min(1, f / (fps * 0.3)), 3));
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                background: '#fff',
                borderRadius: 34,
                padding: '24px 34px',
                transform: `translateX(${(1 - p) * (i % 2 ? 1200 : -1200)}px) rotate(${(i % 2 ? 1 : -1) * 1.2}deg)`,
                boxShadow: `0 12px 0 ${shade(product.theme.primary, -0.55)}`,
              }}
            >
              <div
                style={{
                  flex: '0 0 auto',
                  width: 86,
                  height: 86,
                  borderRadius: '50%',
                  background: product.theme.primary,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: BODY,
                  fontWeight: 900,
                  fontSize: 54,
                }}
              >
                ✓
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 58, color: '#141414', lineHeight: 1.15 }}>{b}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', right: -30, top: 1430, transform: 'rotate(12deg)' }}>
        <ProductVisual product={product} image={scene.image} width={280} />
      </div>
    </>
  );
};

export const ProofScene: React.FC<P> = ({ scene, product, idx }) => {
  const frame = useCurrentFrame();
  const rating = scene.rating ?? 4.9;
  const p = useEnter(2);
  const shown = interpolate(frame, [4, 26], [0, rating], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <>
      <FloatingEmojis emojis={['⭐', '💯', '❤️']} seed={`proof${idx}`} count={8} />
      <Col top={240}>
        <Headline text={scene.headline ?? 'Ai ăn cũng mê!'} theme={product.theme} size={110} />
        <div style={{ marginTop: 50, display: 'flex', gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const fill = Math.max(0, Math.min(1, shown - i));
            return (
              <div key={i} style={{ position: 'relative', fontSize: 130, lineHeight: 1 }}>
                <span style={{ opacity: 0.25, filter: 'grayscale(1)' }}>⭐</span>
                <span style={{ position: 'absolute', left: 0, top: 0, width: `${fill * 100}%`, overflow: 'hidden' }}>⭐</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, fontFamily: HEAD, fontWeight: 800, fontSize: 110, color: product.theme.accent, ...strokeText(12) }}>
          {shown.toFixed(1)}/5
        </div>
        {scene.sold ? (
          <div style={{ marginTop: 10, fontFamily: BODY, fontWeight: 900, fontSize: 64, color: '#fff', ...strokeText(10) }}>
            Đã bán {scene.sold}
          </div>
        ) : null}
        {scene.quote ? (
          <div
            style={{
              marginTop: 50,
              maxWidth: 880,
              background: '#fff',
              borderRadius: 40,
              padding: '30px 44px',
              fontFamily: BODY,
              fontWeight: 600,
              fontStyle: 'italic',
              fontSize: 50,
              color: '#222',
              textAlign: 'center',
              transform: `scale(${p})`,
            }}
          >
            “{scene.quote}”
          </div>
        ) : null}
      </Col>
    </>
  );
};

export const PriceScene: React.FC<P> = ({ scene, product, idx }) => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [6, 14], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slam = useEnter(14, 8);
  const badge = useEnter(22, 9);
  return (
    <>
      <FloatingEmojis emojis={['💸', '🔥', ...(product.emojis ?? [])]} seed={`price${idx}`} count={10} burst />
      <Col top={200}>
        <Headline text={scene.headline ?? 'GIÁ SỐC'} theme={product.theme} size={130} />
      </Col>
      <AbsoluteFill style={{ alignItems: 'center', top: 470 }}>
        <ProductVisual product={product} image={scene.image} width={400} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 1040, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {product.oldPrice ? (
          <div style={{ position: 'relative', fontFamily: BODY, fontWeight: 800, fontSize: 70, color: '#fff', opacity: 0.85, ...strokeText(8) }}>
            {product.oldPrice}
            <div style={{ position: 'absolute', left: -10, top: '52%', height: 10, width: `calc(${strike}% + 20px)`, background: '#ff1f1f', borderRadius: 6, transform: 'rotate(-6deg)' }} />
          </div>
        ) : null}
        {product.price ? (
          <div
            style={{
              fontFamily: HEAD,
              fontWeight: 800,
              fontSize: 190,
              lineHeight: 1,
              color: product.theme.accent,
              transform: `scale(${interpolate(slam, [0, 1], [3, 1])})`,
              opacity: slam > 0.02 ? 1 : 0,
              ...strokeText(18, '#000'),
            }}
          >
            {product.price}
          </div>
        ) : null}
      </div>
      {product.discount ? (
        <div
          style={{
            position: 'absolute',
            top: 520,
            right: 80,
            width: 250,
            height: 250,
            background: product.theme.accent,
            clipPath:
              'polygon(50% 0%, 61% 15%, 79% 9%, 82% 27%, 100% 31%, 92% 48%, 100% 65%, 82% 70%, 79% 90%, 61% 84%, 50% 100%, 39% 84%, 21% 90%, 18% 70%, 0% 65%, 8% 48%, 0% 31%, 18% 27%, 21% 9%, 39% 15%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 76,
            color: '#c00',
            transform: `scale(${badge}) rotate(${12 + Math.sin(frame / 6) * 6}deg)`,
          }}
        >
          {product.discount}
        </div>
      ) : null}
    </>
  );
};

export const CtaScene: React.FC<P> = ({ scene, product, idx }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 4) * 0.05;
  const p = useEnter(6, 10);
  return (
    <>
      <FloatingEmojis emojis={['🛒', ...(product.emojis ?? [])]} seed={`cta${idx}`} count={10} />
      <Col top={220}>
        <Headline text={scene.headline ?? 'MUA NGAY'} theme={product.theme} size={130} shake />
      </Col>
      <AbsoluteFill style={{ alignItems: 'center', top: 520 }}>
        <ProductVisual product={product} image={scene.image} width={product.images.length ? 720 : 430} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            background: `linear-gradient(180deg, ${shade(product.theme.accent, 0.2)}, ${product.theme.accent})`,
            color: '#111',
            fontFamily: BODY,
            fontWeight: 900,
            fontSize: 78,
            padding: '30px 70px',
            borderRadius: 999,
            border: '8px solid #fff',
            boxShadow: '0 16px 0 rgba(0,0,0,.4)',
            transform: `scale(${p * pulse})`,
          }}
        >
          🛒 {scene.sub ?? 'Bấm giỏ hàng'}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 1330 + Math.abs(Math.sin(frame / 5)) * 50,
          fontSize: 170,
          fontFamily: BODY,
          fontWeight: 900,
          color: product.theme.accent,
          transform: 'rotate(125deg)',
          opacity: p,
          ...strokeText(12),
        }}
      >
        ➜
      </div>
    </>
  );
};

export const SCENES: Partial<Record<RenderScene['type'], React.FC<P>>> = {
  hook: HookScene,
  problem: TextScene,
  product: ProductScene,
  features: FeaturesScene,
  proof: ProofScene,
  price: PriceScene,
  cta: CtaScene,
  hero: HeroScene,
  macro: MacroScene,
  bite: BiteScene,
  newsTitle: NewsTitleScene,
  stat: StatScene,
  compare: CompareScene,
  list: ListScene,
  outro: OutroScene,
  chart: ChartScene,
  clip: ClipScene,
};
