// Shared types between pipeline (script.json → render props) and Remotion.

export type SceneType =
  | 'hook'
  | 'problem'
  | 'product'
  | 'features'
  | 'proof'
  | 'price'
  | 'cta'
  | 'hero'
  | 'macro'
  | 'bite'
  | 'newsTitle'
  | 'stat'
  | 'compare'
  | 'list'
  | 'outro'
  | 'chart'
  | 'clip'
  | 'chapter'
  | 'title'
  | 'quote'
  | 'warning'
  | 'timeline';

export type Scene = {
  type: SceneType;
  /** Text the voice reads (Vietnamese). Also used for on-screen captions. */
  voice: string;
  /** On-screen caption text if different from voice (e.g. numbers as digits). */
  caption?: string;
  headline?: string;
  sub?: string;
  bullets?: string[];
  rating?: number;
  sold?: string;
  quote?: string;
  /** Index into product.images (if user supplied images). */
  image?: number;
  /** Emojis flying around in this scene. */
  emojis?: string[];
  /** Index into product.photos (hero / macro scenes). */
  photo?: number;
  /** Several photo indices → quick-cut montage within the scene. */
  photos?: number[];
  /** Zoom range for macro/photo scenes, default [1.35, 1.7]. */
  zoom?: [number, number];
  /** Where the headline sits on photo scenes. */
  headlinePos?: 'top' | 'bottom';
  /** Normalised focus point [x, y] for macro zoom. */
  focus?: [number, number];
  /** Number of bites (bite scene). */
  bites?: number;
  /** Minimum scene length in seconds (e.g. to fit ASMR bites). */
  minSec?: number;
  /** stat scene: big counting number. */
  number?: { value: number; prefix?: string; suffix?: string; decimals?: number; size?: number };
  /** stat scene: two bars. */
  compare?: { left: { label: string; value: number }; right: { label: string; value: number } };
  /** compare scene: table rows. */
  rows?: { label: string; a: string; b: string }[];
  cols?: [string, string];
  /** chart scene: line points + horizontal levels. */
  points?: { label: string; value: number; display?: string }[];
  levels?: { value: number; label: string }[];
  unit?: string;
  /** clip scene: source segments played in order. */
  clips?: Clip[];
  /** 'fill' = crop to 9:16, 'fit' = 16:9 band over blurred copy. */
  layout?: 'fill' | 'fit';
  /** Play original dialogue: no TTS, full trailer volume, subtitle = caption (VN) + quote (EN). */
  dialogue?: boolean;
  /** Name tag on clip scenes. */
  label?: string;
  /** Trailer audio volume under voice-over (default 0.12). */
  bedVolume?: number;
  /** Blurred footage behind card scenes. */
  bgClip?: Clip;
  /** Long-form: chapter this scene belongs to (filled by pipeline). */
  chapterName?: string;
};

/** A segment of a source video. t/d in seconds of the source. */
export type Clip = {
  t: number;
  d: number;
  /** Index into product.videos (default 0). */
  v?: number;
  /** Horizontal focus 0..1 when cropping 16:9 into 9:16. */
  x?: number;
  /** End zoom for slow push-in (default 1.08). */
  zoom?: number;
};

export type CutMeta = {
  cx: number;
  cy: number;
  aspect: number;
  spots: { x: number; y: number; angle: number }[];
};

export type Theme = {
  primary: string;
  accent: string;
  bg: string;
  text: string;
};

export type Product = {
  name: string;
  brand?: string;
  price?: string;
  oldPrice?: string;
  discount?: string;
  unit?: string;
  tagline?: string;
  /** Resolved URLs (pipeline converts local paths to served URLs). */
  images: string[];
  /** Full photos (not cut out). */
  photos?: string[];
  /** Source videos (trailers etc.), served URLs. */
  videos?: string[];
  /** Bite-spot metadata aligned with images (from prep_assets.py). */
  cutMeta?: (CutMeta | null)[];
  theme: Theme;
  emojis?: string[];
};

/** script.json written by Claude / user. */
export type VideoScript = {
  product: Omit<Product, 'images'> & { images?: string[] };
  voice?: string;
  music?: string | null;
  scenes: Scene[];
  caption?: string;
  hashtags?: string[];
};

export type RenderScene = Scene & {
  audio: string | null;
  audioSec: number;
};

export type RenderProps = {
  product: Product;
  scenes: RenderScene[];
  music?: string | null;
  showCaptions: boolean;
  sfx?: { crunch: string[] };
  /** 'sales' (default) or 'news' look. */
  style?: 'sales' | 'news';
  tag?: string;
  source?: string;
};
