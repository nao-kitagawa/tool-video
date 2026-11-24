import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { Background } from './ui';
import { NewsBackground, NewsChrome } from './NewsScenes';
import { BgClip, DialogueSubtitle } from './VideoScenes';
import { Captions } from './Captions';
import { SCENES } from './Scenes';
import { FPS, MIN_SCENE_SEC, SCENE_PAD_SEC } from './constants';
import type { RenderProps, RenderScene } from './types';

export const sceneFrames = (s: RenderScene) =>
  s.dialogue && s.clips?.length
    ? Math.round(s.clips.reduce((a, c) => a + c.d, 0) * FPS)
    : Math.ceil(Math.max(MIN_SCENE_SEC, s.minSec ?? 0, s.audioSec + SCENE_PAD_SEC) * FPS);

const CAPTION_TOP: Partial<Record<RenderScene['type'], number>> = {
  hook: 1180,
  problem: 1300,
  product: 1250,
  features: 1300,
  proof: 1420,
  price: 1420,
  cta: 1420,
  hero: 1500,
  macro: 1380,
  bite: 1420,
  newsTitle: 1420,
  stat: 1440,
  compare: 1440,
  list: 1460,
  outro: 1300,
  chart: 1500,
  clip: 1420,
};

/** Punchy cut: zoom-in + white flash at the start of each scene. */
const CutIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 7], [1.12, 1], { extrapolateRight: 'clamp' });
  const flash = interpolate(f, [0, 5], [0.55, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
    </AbsoluteFill>
  );
};

export const ProductAd: React.FC<RenderProps> = ({ product, scenes, music, showCaptions, sfx, style, tag, source }) => {
  const news = style === 'news';
  let from = 0;
  return (
    <AbsoluteFill style={{ background: product.theme.bg }}>
      {news ? <NewsBackground theme={product.theme} /> : <Background theme={product.theme} />}
      {music ? <Audio src={music} volume={0.18} loop /> : null}
      {scenes.map((scene, i) => {
        const frames = sceneFrames(scene);
        const start = from;
        from += frames;
        const Comp = SCENES[scene.type] ?? SCENES.product!;
        return (
          <Sequence key={i} from={start} durationInFrames={frames} name={`${i + 1}. ${scene.type}`}>
            {scene.bgClip ? <BgClip product={product} c={scene.bgClip} /> : null}
            <CutIn>
              <Comp scene={scene} product={product} frames={frames} idx={i} sfx={sfx} />
            </CutIn>
            {scene.audio ? <Audio src={scene.audio} /> : null}
            {scene.dialogue ? (
              <DialogueSubtitle vn={scene.caption ?? ''} en={scene.quote} theme={product.theme} />
            ) : showCaptions && scene.voice ? (
              <Captions
                text={scene.caption ?? scene.voice}
                audioSec={scene.audioSec}
                theme={product.theme}
                top={scene.type === 'clip' && scene.layout === 'fit' ? 1300 : CAPTION_TOP[scene.type]}
              />
            ) : null}
          </Sequence>
        );
      })}
      {news ? <NewsChrome theme={product.theme} tag={tag ?? 'THỜI SỰ'} source={source ?? ''} /> : null}
    </AbsoluteFill>
  );
};
