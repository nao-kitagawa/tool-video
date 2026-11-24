# CLAUDE.md — tool-video

Công cụ sản xuất video YouTube tiếng Việt **0 đồng** (chỉ dùng gói Claude Max + phần mềm mở chạy local trên MacBook M2 16GB).
Đọc file này trước, rồi `docs/STRATEGY.md`, `docs/PIPELINE.md`, `docs/DECISIONS.md`, `docs/LESSONS.md`.

## Hai kênh (yêu cầu thuộc kênh nào tuỳ prompt)
1. **Kênh 1 — phim & tiểu thuyết** (handle hiện tại `@TheBookerRise`, tên KHÔNG có nghĩa là kênh sách): phân tích trailer, so sánh sách vs phim, tóm tắt nguyên tác, "Liệu có thể xảy ra?" (khoa học trong phim), "Nếu như…" về vũ trụ phim. Mẫu: `projects/dune3-trailer/`.
2. **Kênh 2 — ngách "nhân bản thị trường"**: lấy *format* đã chứng minh ở Mỹ, làm bản Việt có bản sắc riêng. Kim chỉ nam đã chốt: **"XUYÊN KHÔNG SINH TỒN"** — "bạn" xuyên không tới các thời đại/thế giới và thử sống sót (HUD thanh sinh tồn + % sống sót). Mẫu: `projects/kenh2-ep01-xuyen-khong/`.

## Quy tắc nội dung (bắt buộc)
- **Giọng reviewer độc lập**: lời bình là đánh giá của chính kênh sau khi đã đọc mọi nguồn. KHÔNG nói "theo TheWrap/Wikipedia/báo chí…". Nguồn chỉ để trong mô tả video. Được trích lời trực tiếp của người thật (đạo diễn, diễn viên, tác giả).
- **Chính xác**: nghiên cứu từ nguồn uy tín; suy đoán phải nói rõ là suy đoán ("mình đoán", "có thể"); số liệu ước tính vui (vd. % sống sót) phải nói là ước tính. Người chưa bị kết án → "theo cáo trạng/bị cáo buộc".
- **Tránh chính trị & lịch sử Việt Nam**, chiến tranh hiện đại, địa chính trị đương thời, chế giễu tôn giáo. Việt Nam chỉ xuất hiện ở giọng kể/so sánh đời thường.
- **Không clone giọng người thật** (kể cả kênh đối thủ như Phê Phim, W2W) khi không có đồng ý. Chỉ học *nhịp/cấu trúc* bằng số liệu.
- **Bản sắc riêng**: học khung format của đối thủ, KHÔNG sao chép nhận diện (nhân vật, phong cách vẽ, thumbnail). Ví dụ: nhân vật "bóng đen mắt trắng" là phong cách chung của ngách → không dùng.
- **Bản quyền**: footage trailer chính thức dùng ở mức trích dẫn có bình luận; không dùng ảnh báo chí/Getty; nhạc nền tự tổng hợp (`scripts/make_ambient.py`).
- Thời lượng long-form ≥ 8 phút (mid-roll). Kèm Shorts 9:16.

## Giọng đọc & phát âm
- Giọng chính: `voices/booker_raw.json` = VieNeu preset **Thanh Bình**, KHÔNG hậu kỳ (PSOLA/EQ/hạ tông gây "vang" — người dùng đã từ chối). Nhấn nhá bằng kịch bản: câu ngắn, "…", thẻ `[thở dài]` `[cười]` `[hắng giọng]`.
- **Từ điển phát âm** `lexicon/pronunciations.json` (IPA hoặc phiên âm Việt, có khoá `lock`) được áp TRƯỚC bước chuẩn hoá của VieNeu (`scripts/lexicon.py`). Trước mỗi render: `python3 scripts/lexicon.py lexicon/pronunciations.json projects/<p>/<script>.json` → thêm mọi từ còn thiếu; chạy `scripts/verify_lexicon.py` để kiểm chứng bằng Whisper.

## Cách làm việc với người dùng
- Người dùng nói tiếng Việt, thích hành động ngay, kết quả xem được (mở video/ảnh cho họ xem), báo trung thực khi chưa nghe/chưa kiểm chứng.
- Việc nặng (TTS, render, tạo ảnh, quét YouTube) chạy nền; báo tiến độ khi được hỏi.
- Trước render dài: render thử `--scenes=a-b` hoặc `--stills` để duyệt.
- Không xoá/đẩy/đăng gì ra ngoài khi chưa được yêu cầu rõ.

## Lệnh nhanh
```bash
# render (9:16 short hoặc long 16:9 nếu script.format == "long")
CONCURRENCY=6 node scripts/pipeline.mjs projects/<p> --script=<file>.json [--scenes=0-14] [--stills]
# phân tích video nguồn (tách shot + contact sheet + Whisper)
.venv-tts/bin/python scripts/analyze_video.py <video.mp4> <outDir>
# nghiên cứu ngách
.venv-tts/bin/python scripts/niche_scan.py research/niches_us.json research/niche_scan_us.jsonl --n 10
python3 scripts/niche_score.py research/niche_scan_us.jsonl
python3 scripts/niche_gap.py research/niche_scan_us_scored.json research/niche_scan_vn_mapped.json research/niche_scan_vn2_scored.json
# tạo ảnh local (Z-Image Turbo 4-bit, ~28s/bước ở 1280x720 trên M2)
.venv-img/bin/mflux-generate-z-image-turbo --model filipstrand/Z-Image-Turbo-mflux-4bit --base-model z-image-turbo --width 1280 --height 720 --steps 6 --prompt "..." --output x.png
```
