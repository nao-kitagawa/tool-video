import React from 'react';
import { Composition } from 'remotion';
import { ProductAd, sceneFrames } from './ProductAd';
import type { RenderProps } from './types';
import { FPS } from './constants';
import { LongForm } from './long/LongForm';

const demoProps: RenderProps = {
  showCaptions: true,
  music: null,
  product: {
    name: 'Bánh Tráng Trộn Cay',
    brand: 'Cô Ba',
    price: '29.000đ',
    oldPrice: '49.000đ',
    discount: '-40%',
    images: [],
    theme: { primary: '#ff3b1f', accent: '#ffd400', bg: '#2a0a05', text: '#ffffff' },
    emojis: ['🌶️', '🔥', '🥭', '🥚'],
  },
  scenes: [
    { type: 'hook', voice: 'Ê, đói bụng chưa?', headline: 'ĐÓI CHƯA?', audio: null, audioSec: 2 },
    { type: 'product', voice: 'Bánh tráng trộn cay xé lưỡi đây nè!', headline: 'Bánh Tráng Trộn', audio: null, audioSec: 2.5 },
    { type: 'features', voice: 'Giòn, cay, chua ngọt đủ vị.', bullets: ['Giòn rụm', 'Cay xé lưỡi', 'Chua ngọt'], audio: null, audioSec: 3 },
    { type: 'price', voice: 'Chỉ hai mươi chín nghìn thôi!', audio: null, audioSec: 2.5 },
    { type: 'cta', voice: 'Bấm giỏ hàng ngay!', headline: 'BẤM GIỎ HÀNG', audio: null, audioSec: 2 },
  ],
};

export const Root: React.FC = () => (
  <>
  <Composition
    id="ProductAd"
    component={ProductAd}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={300}
    defaultProps={demoProps}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.scenes.reduce((s, sc) => s + sceneFrames(sc), 0),
    })}
  />
  <Composition
    id="LongForm"
    component={LongForm}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={300}
    defaultProps={demoProps}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(30, props.scenes.reduce((s, sc) => s + sceneFrames(sc), 0)),
    })}
  />
  </>
);
