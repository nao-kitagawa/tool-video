# Kiến trúc pipeline

```
script.json ──► scripts/pipeline.mjs
                 ├─ (assets/src có ảnh) prep_assets.py: tách nền rembg, điểm cắn, SFX
                 ├─ tts.py (VieNeu, chạy .venv-tts) ← lexicon.py (encode trước chuẩn hoá)
                 │     cache: projects/<p>/audio/<sha1(voice|speed|pitch|fingerprint|text)>.wav
                 │     fingerprint = hash(lexicon json + voice file + lexicon.py)
                 ├─ server HTTP nội bộ (có Range) phục vụ assets/video cho Remotion
                 ├─ Remotion bundle → selectComposition("ProductAd" 9:16 | "LongForm" 16:9)
                 ├─ renderMedia (CONCURRENCY env, mặc định 4) / renderStill (--stills)
                 ├─ ffmpeg loudnorm −14 LUFS
                 └─ out/<name>.mp4 + .chapters.txt + .vi.srt + .props.json + .caption.txt
```

## Thư mục
| Đường dẫn | Nội dung |
|---|---|
| `remotion/` | Compositions. `ProductAd.tsx` (9:16), `long/LongForm.tsx` (16:9), `Scenes.tsx` (bán hàng), `PhotoScenes.tsx` (hero/macro/bite), `NewsScenes.tsx` (tin tức: stat/compare/chart/list), `VideoScenes.tsx` (clip trailer, phụ đề thoại) |
| `scripts/pipeline.mjs` | Điều phối. Cờ: `--script=`, `--scenes=a-b`, `--stills`, `--no-captions`, `--skip-tts`, `--reprep` |
| `scripts/tts.py` | VieNeu TTS; voice `"file:voices/x.json"` hỗ trợ trộn timbre, temperature, gaps, (tuỳ chọn) expand/deepen/eq/dry |
| `scripts/lexicon.py` | Từ điển phát âm: encode → placeholder `qxlex…qx` → IPA/phiên âm; tự đánh vần acronym bằng tên chữ cái tiếng Anh; `check()` liệt kê từ thiếu |
| `scripts/verify_lexicon.py` | Đọc thử từng phương án bằng giọng kênh + Whisper chấm điểm, ghi `use`, xuất `lexicon/listen_check.wav` |
| `scripts/voice_lab.py` | Thiết kế giọng (trộn speaker_emb preset, style codes, gaps, expand) → `voices/*.json` |
| `scripts/prosody.py` | Hậu kỳ giọng (PSOLA expand, deepen, warm/dry EQ) — hiện KHÔNG dùng cho giọng chính |
| `scripts/analyze_video.py` | PySceneDetect tách shot + contact sheet đánh số + faster-whisper transcript |
| `scripts/make_ambient.py` | Nhạc nền ambient tự tổng hợp (không bản quyền) |
| `scripts/niche_scan.py`/`niche_score.py`/`niche_gap.py` | Nghiên cứu thị trường YouTube |
| `lexicon/third_party/vietnormalizer/` | 17.7k từ tiếng Anh phiên âm Việt (MIT) — dự phòng |
| `voices/booker_raw.json` | Giọng chính (Thanh Bình raw) |
| `prompts/script.md` | Prompt viết kịch bản bán hàng (giai đoạn đầu) |

## script.json (rút gọn)
```jsonc
{
  "format": "long" | (bỏ trống = 9:16),
  "out": "long_v4",                 // tên file đầu ra
  "style": "sales" | "news",
  "videos": ["trailer/final_trailer.mp4", ...],   // nguồn cho scene clip (v = index)
  "music": "assets/ambient_desert.wav",
  "voice": "file:voices/booker_raw.json", "speed": 1.0, "pitch": 1.0,
  "product": { "name": "...", "theme": {"primary","accent","bg","text"} },
  "scenes": [
    { "type": "clip", "clips": [{"v":0,"t":12.3,"d":2.1,"x":0.4}], "voice": "...", "caption": "...", "headline": "...", "label": "Tên diễn viên", "sub": "Vai" },
    { "type": "clip", "dialogue": true, "clips": [...], "caption": "VN phụ đề", "quote": "EN gốc", "voice": "" },
    { "type": "chapter", "chapter": "Tên chương", "sub": "CHƯƠNG 1", "headline": "...", "bgClip": {...}, "minSec": 2.8 },
    { "type": "list" | "quote" | "compare" | "timeline" | "warning" | "title" | "outro", ... }
  ]
}
```
Scene types 9:16: hook, problem, product, features, proof, price, cta, hero, macro, bite, newsTitle, stat, compare, list, outro, chart, clip.
Scene types 16:9 (LongForm): clip, chapter, title, list, quote, compare, warning, timeline, outro (khác → clip).

## Quy trình phân tích trailer (kênh 1)
1. yt-dlp tải trailer chính thức (kiểm tra kênh là Warner Bros. v.v.).
2. `analyze_video.py` → xem `sheet_*.jpg` để biết shot nào là ai; Whisper word-timestamps cho câu thoại.
3. Viết `script_long.json` theo cấu trúc: cold open thoại → title → chương không spoil → `warning` → chương spoil sách → so sánh → giả thuyết → outro.
4. `--stills` duyệt bố cục → `--scenes=0-14` duyệt giọng → render full (CONCURRENCY=6).

## Tạo ảnh (kênh 2)
- mflux 0.24 + `filipstrand/Z-Image-Turbo-mflux-4bit` (5.9GB, base Apache-2.0). M2 16GB: ~28s/bước @1280×720, peak 4.9GB.
- Ngân sách đề xuất: 960×540, 6 bước, ~45–50 ảnh/video + thẻ đồ hoạ Remotion.
