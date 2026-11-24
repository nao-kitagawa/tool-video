// script.json → TTS (VieNeu) → Remotion render → out/video.mp4
// CLI: node scripts/pipeline.mjs projects/<id> [--no-captions] [--skip-tts]
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PY = path.join(ROOT, '.venv-tts/bin/python');

const MIME = {
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.json': 'application/json',
};

/** Tiny static server so Remotion's headless browser can load project assets. */
const serveDir = (dir) =>
  new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(dir, rel);
      if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end();
        return;
      }
      const size = fs.statSync(file).size;
      const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
      if (m) {
        const start = m[1] ? Number(m[1]) : 0;
        const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
        res.writeHead(206, {
          'Content-Type': type,
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Content-Length': end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Accept-Ranges': 'bytes', 'Content-Length': size });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, base: `http://127.0.0.1:${srv.address().port}` }));
  });

const run = (cmd, args, onLog) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: ROOT });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => {
      for (const line of String(d).split('\n')) if (/^\[(tts|prep)\]/.test(line)) onLog(line);
    });
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}`))));
  });

let bundlePromise = null;
const getBundle = (onLog) => {
  if (!bundlePromise || process.env.NO_BUNDLE_CACHE) {
    onLog('[render] bundling Remotion project…');
    bundlePromise = bundle({ entryPoint: path.join(ROOT, 'remotion/index.ts') });
  }
  return bundlePromise;
};

const isUrl = (s) => /^https?:\/\//.test(s);

export async function makeVideo(projectDir, opts = {}) {
  const onLog = opts.onLog ?? ((l) => console.log(l));
  const onProgress = opts.onProgress ?? (() => {});
  projectDir = path.resolve(projectDir);
  const script = JSON.parse(fs.readFileSync(path.join(projectDir, opts.scriptFile ?? 'script.json'), 'utf8'));
  let outName = script.out ?? 'video';
  if (opts.scenes) {
    // Preview a slice of scenes, e.g. "0-14" (inclusive).
    const [a, b] = opts.scenes.split('-').map(Number);
    script.scenes = script.scenes.slice(a, (Number.isFinite(b) ? b : a) + 1);
    outName += `_preview_${a}-${b}`;
  }
  const voice = script.voice || 'Trúc Ly';
  const speed = script.speed ?? 1.08;
  const pitch = script.pitch ?? 1.0;
  fs.mkdirSync(path.join(projectDir, 'audio'), { recursive: true });
  fs.mkdirSync(path.join(projectDir, 'out'), { recursive: true });

  // 0) Assets: cut out product photos, find bite spots, synth SFX (once)
  const metaPath = path.join(projectDir, 'assets/meta.json');
  if (fs.existsSync(path.join(projectDir, 'assets/src')) && (!fs.existsSync(metaPath) || opts.reprep)) {
    onLog('[prep] tách nền ảnh + tạo SFX…');
    await run(PY, [path.join(ROOT, 'scripts/prep_assets.py'), projectDir], onLog);
  }
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : null;

  // 1) TTS — cache by hash(text+voice+speed)
  const cachePath = path.join(projectDir, 'audio/cache.json');
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
  // Cache key must change whenever the voice file or pronunciation lexicon changes.
  const fileHash = (p) => (fs.existsSync(p) ? createHash('sha1').update(fs.readFileSync(p)).digest('hex') : '');
  const ttsFingerprint = createHash('sha1')
    .update(fileHash(path.join(ROOT, 'lexicon/pronunciations.json')))
    .update(voice.startsWith('file:') ? fileHash(path.join(ROOT, voice.slice(5))) : '')
    .update(fileHash(path.join(ROOT, 'scripts/lexicon.py')))
    .digest('hex')
    .slice(0, 10);
  const items = script.scenes.map((s) => {
    const h = createHash('sha1').update(`${voice}|${speed}|${pitch}|${ttsFingerprint}|${s.voice}`).digest('hex').slice(0, 12);
    // Dialogue scenes play the source audio: no TTS.
    return { text: s.dialogue ? '' : (s.voice ?? '').trim(), file: `audio/${h}.wav`, h };
  });
  const todo = items.filter((it) => it.text && !(cache[it.h] && fs.existsSync(path.join(projectDir, it.file))));
  if (todo.length && !opts.skipTts) {
    onLog(`[tts] ${todo.length} câu cần đọc (giọng ${voice})…`);
    const jobsFile = path.join(projectDir, 'audio/jobs.json');
    fs.writeFileSync(
      jobsFile,
      JSON.stringify({ voice, speed, pitch, items: todo.map((t) => ({ text: t.text, out: path.join(projectDir, t.file) })) }),
    );
    const out = await run(PY, [path.join(ROOT, 'scripts/tts.py'), jobsFile], onLog);
    const { durations } = JSON.parse(out.trim().split('\n').at(-1));
    todo.forEach((t, i) => (cache[t.h] = durations[i]));
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } else onLog('[tts] dùng audio cache');

  // 2) Render
  const { srv, base } = await serveDir(projectDir);
  try {
    const url = (p) => (!p ? null : isUrl(p) ? p : `${base}/${p.replace(/^\.?\//, '')}`);
    const inputProps = {
      showCaptions: opts.captions ?? script.captions ?? true,
      music: url(script.music),
      product: (() => {
        const imgs = script.product.images?.length ? script.product.images : (meta?.cutouts ?? []).map((c) => c.file);
        const photos = script.product.photos?.length ? script.product.photos : (meta?.photos ?? []).map((c) => c.file);
        const cutMeta = imgs.map((f) => meta?.cutouts?.find((c) => c.file === f) ?? null);
        return { ...script.product, images: imgs.map(url), photos: photos.map(url), cutMeta, videos: (script.videos ?? []).map(url) };
      })(),
      sfx: { crunch: (meta?.sfx?.crunch ?? []).map(url) },
      style: script.style ?? 'sales',
      tag: script.tag,
      source: script.source,
      scenes: script.scenes.map((s, i) => ({
        ...s,
        voice: items[i].text ? s.voice : '',
        audio: items[i].text && cache[items[i].h] ? url(items[i].file) : null,
        audioSec: !items[i].text
          ? (s.clips ?? []).reduce((a, c) => a + c.d, 0) || 2
          : cache[items[i].h] ?? Math.max(1.5, s.voice.length / 14),
      })),
    };
    // Long-form: propagate chapter names, compute chapter timestamps + SRT.
    const FPS = 30;
    const framesOf = (s) =>
      s.dialogue && s.clips?.length
        ? Math.round(s.clips.reduce((a, c) => a + c.d, 0) * FPS)
        : Math.ceil(Math.max(1.6, s.minSec ?? 0, s.audioSec + 0.35) * FPS);
    let chapterName;
    let t = 0;
    const chapters = [];
    const srt = [];
    const ts = (sec) => {
      const ms = Math.round(sec * 1000);
      const p2 = (n, w = 2) => String(n).padStart(w, '0');
      return `${p2(Math.floor(ms / 3600000))}:${p2(Math.floor(ms / 60000) % 60)}:${p2(Math.floor(ms / 1000) % 60)},${p2(ms % 1000, 3)}`;
    };
    for (const s of inputProps.scenes) {
      if (s.type === 'chapter' || s.chapter) {
        chapterName = s.chapter ?? s.headline;
        chapters.push({ t, title: chapterName });
      }
      s.chapterName = chapterName;
      const text = s.dialogue ? s.caption : s.caption ?? s.voice;
      if (text) {
        // split into ~12-word lines, timed by character weight across the voice duration
        const words = text.split(/\s+/).filter(Boolean);
        const lines = [];
        for (let k = 0; k < words.length; k += 12) lines.push(words.slice(k, k + 12).join(' '));
        const total = lines.reduce((a, l) => a + l.length, 0) || 1;
        let lt = t;
        const span = s.dialogue ? framesOf(s) / FPS : s.audioSec;
        for (const l of lines) {
          const d = (l.length / total) * span;
          srt.push(`${srt.length + 1}\n${ts(lt)} --> ${ts(lt + d)}\n${l}\n`);
          lt += d;
        }
      }
      t += framesOf(s) / FPS;
    }
    if (chapters.length) {
      const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
      fs.writeFileSync(path.join(projectDir, `out/${outName}.chapters.txt`), chapters.map((c) => `${mmss(c.t)} ${c.title}`).join('\n'));
    }
    fs.writeFileSync(path.join(projectDir, `out/${outName}.vi.srt`), srt.join('\n'));
    fs.writeFileSync(path.join(projectDir, `out/${outName}.props.json`), JSON.stringify(inputProps, null, 2));
    const serveUrl = await getBundle(onLog);
    const composition = await selectComposition({ serveUrl, id: script.format === 'long' ? 'LongForm' : 'ProductAd', inputProps });
    const outFile = path.join(projectDir, `out/${outName}.mp4`);
    if (opts.stills) {
      // QA mode: one still per scene (middle frame), no video render.
      const dir = path.join(projectDir, `out/${outName}_stills`);
      fs.mkdirSync(dir, { recursive: true });
      let f0 = 0;
      for (const [i, sc] of inputProps.scenes.entries()) {
        const fr = framesOf(sc);
        await renderStill({ composition, serveUrl, inputProps, frame: f0 + Math.floor(fr * 0.6), output: path.join(dir, `${String(i).padStart(2, '0')}_${sc.type}.jpg`), imageFormat: 'jpeg', jpegQuality: 70, scale: 0.4 });
        f0 += fr;
      }
      onLog(`[stills] ${inputProps.scenes.length} → ${path.relative(ROOT, dir)}`);
      return dir;
    }
    onLog(`[render] ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)…`);
    let last = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outFile,
      inputProps,
      concurrency: opts.concurrency ?? Number(process.env.CONCURRENCY || 4),
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 100);
        onProgress(pct);
        if (pct % 10 === 0 && pct !== last) {
          last = pct;
          onLog(`[render] ${pct}%`);
        }
      },
    });
    // Loudness normalise to TikTok/Reels standard (-14 LUFS), keep video stream as-is.
    onLog('[audio] chuẩn hoá âm lượng -14 LUFS…');
    const tmp = outFile.replace(/\.mp4$/, '.tmp.mp4');
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', outFile, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', tmp], onLog);
    fs.renameSync(tmp, outFile);
    const caption = [script.caption ?? '', (script.hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')]
      .filter(Boolean)
      .join('\n\n');
    fs.writeFileSync(path.join(projectDir, `out/${outName}.caption.txt`), caption);
    onLog(`[done] ${path.relative(ROOT, outFile)}`);
    return outFile;
  } finally {
    srv.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node scripts/pipeline.mjs projects/<id> [--no-captions] [--skip-tts]');
    process.exit(1);
  }
  makeVideo(dir, {
    captions: process.argv.includes('--no-captions') ? false : undefined,
    skipTts: process.argv.includes('--skip-tts'),
    reprep: process.argv.includes('--reprep'),
    stills: process.argv.includes('--stills'),
    scenes: (process.argv.find((a) => a.startsWith('--scenes=')) ?? '').slice(9) || undefined,
    scriptFile: (process.argv.find((a) => a.startsWith('--script=')) ?? '').slice(9) || undefined,
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
