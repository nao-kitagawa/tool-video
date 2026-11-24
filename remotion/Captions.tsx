import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, strokeText } from './ui';
import type { Theme } from './types';

type Chunk = { text: string; start: number; end: number };

/** Split voice text into 2–4 word chunks, timed proportional to char length. */
export const buildChunks = (text: string, audioSec: number, fps: number): Chunk[] => {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const groups: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    const len = cur.join(' ').length;
    const endsSentence = /[.!?…,;:]$/.test(w);
    if (cur.length >= 4 || len >= 16 || endsSentence) {
      groups.push(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length) groups.push(cur.join(' '));
  const weight = (g: string) => g.replace(/[^\p{L}\p{N}]/gu, '').length + 2;
  const total = groups.reduce((s, g) => s + weight(g), 0) || 1;
  const startSec = 0.05;
  const span = Math.max(0.5, audioSec * 0.97 - startSec);
  let t = startSec;
  return groups.map((g) => {
    const d = (weight(g) / total) * span;
    const c = { text: g, start: Math.round(t * fps), end: Math.round((t + d) * fps) };
    t += d;
    return c;
  });
};

export const Captions: React.FC<{ text: string; audioSec: number; theme: Theme; top?: number }> = ({
  text,
  audioSec,
  theme,
  top = 1250,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chunks = React.useMemo(() => buildChunks(text, audioSec, fps), [text, audioSec, fps]);
  const idx = chunks.findIndex((c) => frame >= c.start && frame < c.end);
  const c = idx >= 0 ? chunks[idx] : frame >= (chunks.at(-1)?.end ?? 0) ? chunks.at(-1) : null;
  if (!c) return null;
  const p = spring({ frame: frame - c.start, fps, config: { damping: 11, mass: 0.4 } });
  const words = c.text.split(' ');
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 60,
        right: 60,
        textAlign: 'center',
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 92,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        color: '#fff',
        transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`,
        ...strokeText(16, '#000'),
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ color: i === words.length - 1 ? theme.accent : '#fff' }}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </div>
  );
};
