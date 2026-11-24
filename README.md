# tool-video

Pipeline sản xuất video YouTube tiếng Việt chạy local, 0 đồng: **Claude Code (gói Max) viết & điều phối → VieNeu TTS → Remotion dựng → ffmpeg**, kèm công cụ nghiên cứu thị trường YouTube và tạo ảnh local (mflux).

- Định hướng, quy tắc nội dung, cách làm việc: **[CLAUDE.md](CLAUDE.md)** (Claude Code tự đọc)
- Chiến lược & nghiên cứu ngách: [docs/STRATEGY.md](docs/STRATEGY.md)
- Kiến trúc & schema kịch bản: [docs/PIPELINE.md](docs/PIPELINE.md)
- Quyết định đã chốt + việc đang dở: [docs/DECISIONS.md](docs/DECISIONS.md)
- Lỗi đã gặp: [docs/LESSONS.md](docs/LESSONS.md)

## Cài đặt (macOS Apple Silicon)
```bash
brew install ffmpeg python@3.13 node@22
./scripts/setup.sh
```

## Dùng nhanh
```bash
# render thử 1 đoạn / ảnh duyệt / full
CONCURRENCY=6 node scripts/pipeline.mjs projects/dune3-trailer --script=script_long.json --scenes=0-14
node scripts/pipeline.mjs projects/dune3-trailer --script=script_long.json --stills
CONCURRENCY=6 node scripts/pipeline.mjs projects/dune3-trailer --script=script_long.json

# kiểm tra phát âm trước khi render
python3 scripts/lexicon.py lexicon/pronunciations.json projects/dune3-trailer/script_long.json
```

## Không có trong repo (tải/tạo lại)
Trailer & footage (`projects/*/trailer/*.mp4`, tải bằng yt-dlp theo link trong kịch bản/DECISIONS), video render (`out/`), audio TTS (`audio/`), ảnh tạo ra, model AI, thumbnail/transcript của kênh khác.

## Bên thứ ba
- `lexicon/third_party/vietnormalizer/` — MIT (xem LICENSE trong thư mục).
- Model: VieNeu-TTS (Apache-2.0), Z-Image Turbo (Apache-2.0, bản 4-bit của filipstrand), Whisper (MIT), rembg isnet (MIT).
- Remotion: miễn phí cho cá nhân/công ty ≤ 3 người — kiểm tra license nếu mở rộng.
