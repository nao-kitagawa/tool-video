# Nguồn footage (tải lại bằng yt-dlp, không commit)

| File | YouTube | Kênh | Ngày |
|---|---|---|---|
| trailer/final_trailer.mp4 | https://www.youtube.com/watch?v=uJqaGLmZpGo | Warner Bros. | 2026-10-27 |
| trailer/official_trailer.mp4 | https://www.youtube.com/watch?v=rGNc8RRggzo | Warner Bros. Pictures International | 2026-07-08 |
| trailer/teaser.mp4 | https://www.youtube.com/watch?v=3_9vCamtuPY | Warner Bros. | 2026-03-17 |

```bash
.venv/bin/yt-dlp --js-runtimes node -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]" --merge-output-format mp4 -o "projects/dune3-trailer/trailer/final_trailer.%(ext)s" https://www.youtube.com/watch?v=uJqaGLmZpGo
.venv-tts/bin/python scripts/analyze_video.py projects/dune3-trailer/trailer/final_trailer.mp4 projects/dune3-trailer/trailer/analysis
```
Nhạc nền: `.venv-tts/bin/python scripts/make_ambient.py projects/dune3-trailer/assets/ambient_desert.wav --sec 150`
Nguồn nội dung: AV Club (final trailer), TheWrap (Villeneuve quotes), Wikipedia (Dune: Part Three, Dune Messiah), Deadline (ngày ra rạp).
