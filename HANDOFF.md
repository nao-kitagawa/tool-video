# HANDOFF — chuyển sang máy mạnh hơn

Cập nhật: 2026-11-25. Máy cũ: MacBook M2 16GB (tạo ảnh ~3.2 phút/ảnh, render 16:9 ~5 phút/2 phút video).
Đọc theo thứ tự: `CLAUDE.md` → file này → `docs/DECISIONS.md` → `docs/STRATEGY.md` → `docs/PIPELINE.md` → `brand/tictac/CHARACTER.md`.

## 1. Dựng môi trường
### Mac Apple Silicon (M3/M4 Pro/Max) — mọi script chạy nguyên trạng
```bash
git clone <repo> tool-video && cd tool-video
brew install ffmpeg python@3.13 node@22
./scripts/setup.sh
```
### PC NVIDIA (Windows/Linux) — cần điều chỉnh
- `mflux` CHỈ chạy trên Mac → thay `scripts/gen_images.py` bằng bản dùng **diffusers** + Z-Image-Turbo (`Tongyi-MAI/Z-Image-Turbo`, Apache-2.0). Kiểm tra diffusers đã hỗ trợ pipeline Z-Image chưa; nếu chưa, dùng repo chính thức của Tongyi-MAI. Giữ nguyên format `jobs.json` + `{CHAR}`.
- VieNeu: `pip install vieneu[gpu]` (chế độ GPU nhanh hơn nhiều). `scripts/tts.py` gọi `Vieneu()` mặc định — có thể chọn `mode="turbo_gpu"`/`"fast"`.
- Remotion, ffmpeg, yt-dlp, faster-whisper (`device="cuda"`) chạy được. Trong `scripts/*.py` các đường dẫn `.venv*/bin/python` cần đổi sang `Scripts\python.exe` trên Windows.
- Render nhanh hơn: `CONCURRENCY` = số nhân hiệu năng.

### Tải lại thứ không có trong repo
- Footage Dune: `projects/dune3-trailer/SOURCES.md`
- Nhạc nền: `scripts/make_ambient.py`
- Model tự tải lần đầu: VieNeu (~2.4GB), rembg (~180MB), Whisper small (~480MB), Z-Image Turbo 4-bit (~5.9GB), Chrome headless của Remotion.

## 2. Trạng thái công việc
### Kênh 1 — Dune: Part Three (long-form 16:9)
- Kịch bản xong: `projects/dune3-trailer/script_long.json` (60 cảnh, 10 chương, out `long_v4`, giọng `voices/booker_raw.json`).
- Đã render & duyệt 2 phút đầu. **Việc tiếp:** người dùng nghe `lexicon/listen_check.wav` → khoá từ sai trong `lexicon/pronunciations.json` → render full:
  `CONCURRENCY=6 node scripts/pipeline.mjs projects/dune3-trailer --script=script_long.json`
- Sau render: tạo thumbnail 1280×720, tiêu đề/mô tả (chèn `out/long_v4.chapters.txt` + nguồn trong SOURCES.md), upload `out/long_v4.vi.srt`.
- Phim ra rạp 18/12/2026 → nên đăng trước ngày đó.

### Kênh 2 — "Tích Tắc Travel" (@TichTacTravel), format "Xuyên Không Sinh Tồn", tập 1
- Kênh đã tạo trên YouTube: tên **Tích Tắc Travel**, handle **@TichTacTravel** (Brand Account).
- **Avatar đã chốt:** `brand/tictac/avatar/avatar_final.png` (800×800, cắt từ `sheet/era_rome.png`).
- Logo/banner: các bản SVG trong `brand/tictac/logo/` bị người dùng chê → bỏ. Brief để thiết kế ngoài (Claude web): `brand/tictac/LOGO_BRIEF.md`, `brand/tictac/CHARACTER_SHEET_BRIEF.md` (người dùng chưa dùng).
- Mascot **Tích Tắc**: `brand/tictac/CHARACTER.md` + `character.json`.
  - Prompt chuẩn đã đổi sang **v2** (cách tả của m1: mắt to biểu cảm, số mảnh mờ, "tiny round knob" — KHÔNG dùng chữ "crown" vì model vẽ vương miện). Ảnh v1 bị loại: `brand/tictac/sheet_v1_rejected/`.
  - Đang thử v2: `brand/tictac/test_v2.json` → `brand/tictac/test_v2/` (2 ảnh). Người dùng duyệt độ dễ thương so với `research/mascot/m1.png` (máy cũ, không có trong git: xem `sheet/era_rome.png` — chính là m1).
  - Nếu v2 đạt → tạo bộ hồ sơ: `.venv-img/bin/python scripts/gen_images.py brand/tictac/sheet_jobs.json brand/tictac/sheet --character brand/tictac/character.json` (11 ảnh; ảnh có rồi tự bỏ qua).
- **Kịch bản v2 xong:** `projects/kenh2-ep01-xuyen-khong/script_draft.md` — 2.464 từ (~11–12 phút), 6 thời đại, mỗi thời đại có thử thách + [CHỌN] (A/B) + [FACT] (đã kiểm chứng, nguồn ở cuối file). Đã có câu "ước tính vui", đã sửa "có thể sẽ là", đã bỏ thầy thuốc mỏ chim khỏi năm 1348 (trang phục đó từ thế kỷ 17).
- **Việc tiếp (theo thứ tự):**
  1. Chọn giọng kênh 2 (khác kênh 1 để tách thương hiệu; thử preset VieNeu trẻ/tự nhiên; KHÔNG hậu kỳ gây vang — xem docs/LESSONS.md). Tạo `voices/tictac.json` bằng `scripts/voice_lab.py`.
  2. Chia kịch bản → `projects/kenh2-ep01-xuyen-khong/script.json` (format long) ~80–90 cảnh: mỗi đoạn lời bình 1 cảnh ảnh (`img`), cộng thẻ đồ hoạ (thời đại, [CHỌN], [FACT], bảng xếp hạng). Mỗi cảnh ảnh có prompt dùng `{CHAR}`.
  3. Tạo ảnh: `scripts/gen_images.py` (jobs.json sinh từ bước 2). M2: ~4 phút/ảnh → 80 ảnh ≈ 5–6 giờ; máy mạnh hơn nhanh hơn nhiều.
  4. Code Remotion: scene `image` (Ken Burns), **HUD "THANH SINH TỒN"** (thanh máu xanh→đỏ, % sống sót, đếm ngày, tên thời đại, nội suy giữa cảnh), thẻ chuyển thời đại, bảng xếp hạng cuối. Thêm vào `remotion/long/LongForm.tsx` + types.
  5. Từ điển phát âm cho thuật ngữ mới (Tyrannosaurus, Thames, John Snow…) → `scripts/verify_lexicon.py`.
  6. Render thử `--scenes`/`--stills` → full → thumbnail (Tích Tắc 5 trang phục + "SỐNG ĐƯỢC MẤY NGÀY?").
- Tập 2 đã chọn: **"Nếu Bạn Ở Trên Tàu Titanic, Bạn Có Sống Sót?"** (HUD theo dữ liệu thật hạng vé/giới tính — cần kiểm chứng số liệu). Kho tập: tiền sử, Pompeii, đấu trường La Mã.

### Repo
- Commit đầu `d4baaee` trên `main`, chưa có remote (máy cũ thiếu `gh`; SSH chỉ có alias công ty `github.com-kitagawa` — không dùng). Tạo repo **private** rồi `git remote add origin … && git push -u origin main`.

## 3. Quy tắc không được quên (tóm tắt — chi tiết trong CLAUDE.md)
Reviewer độc lập, không trích tên nguồn trong lời bình · suy đoán phải nói rõ · tránh chính trị/lịch sử VN · không clone giọng người thật · không sao chép nhận diện đối thủ · nhạc nền tự tổng hợp · ≥ 8 phút · người dùng nói tiếng Việt, muốn thấy kết quả (mở video/ảnh), báo trung thực khi chưa kiểm chứng.
