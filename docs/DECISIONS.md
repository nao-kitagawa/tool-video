# Nhật ký quyết định

| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-11-17 | Chi phí 0đ: chỉ Claude Max + công cụ mở chạy local | Người dùng không muốn phát sinh chi phí |
| 2026-11-17 | Không dùng AI video (Veo/Kling) mặc định; dựng bằng Remotion | M2 16GB không chạy nổi model video local; API tốn tiền |
| 2026-11-17 | edge-tts → VieNeu-TTS | edge-tts bị chặn câu dài; VieNeu offline, Apache-2.0 |
| 2026-11-25 | Bỏ TikTok, tập trung YouTube long-form + Shorts | Người dùng chốt |
| 2026-11-25 | Ngôn ngữ: tiếng Việt | Người dùng chốt (kênh cũ có 1 short GTA6 tiếng Anh — lưu ý trộn ngôn ngữ) |
| 2026-11-25 | Kênh `@TheBookerRise` là kênh tổng hợp (phim, tin, clip game, mẹo) — KHÔNG phải kênh sách | Người dùng đính chính |
| 2026-11-25 | Lời bình kiểu reviewer độc lập, không trích tên nguồn | Người dùng yêu cầu |
| 2026-11-25 | Video trailer dài: 2 phần, có cảnh báo spoiler | Người dùng chọn |
| 2026-11-25 | Không clone giọng Phê Phim/W2W | Mạo danh, rủi ro pháp lý & chính sách YouTube |
| 2026-11-25 | Giọng chính: Thanh Bình raw, không hậu kỳ | PSOLA/hạ tông/EQ gây "vang" (đo: decay 5dB vs 10dB) |
| 2026-11-25 | Từ điển phát âm áp trước chuẩn hoá + kiểm chứng Whisper | "IMAX" bị đọc "i mờ a ích", tên Dune sai |
| 2026-11-25 | Project phục vụ 2 kênh: phim/tiểu thuyết + ngách nhân bản thị trường | Người dùng chốt |
| 2026-11-25 | Kênh 2 ngách "Xuyên không sinh tồn"; loại "kẹt với crush" | Crush đã đông; sinh tồn có chiều sâu, khó chép |
| 2026-11-25 | Tránh lịch sử/chính trị VN | Người dùng yêu cầu |
| 2026-11-25 | Không dùng nhân vật "bóng đen mắt trắng" | Là nhận diện chung của ngách → trông như kênh nhái |
| 2026-11-25 | Tạo ảnh local: Z-Image Turbo 4-bit qua mflux | 0đ, Apache-2.0 base, chất lượng tốt; chậm (~3.5 phút/ảnh 1280×720) |

## Việc đang dở (handoff)
- Kênh 1: `projects/dune3-trailer/script_long.json` (out `long_v4`) — đã duyệt bản 2 phút; cần người dùng nghe lại phát âm rồi render full (~30–40 phút, CONCURRENCY=6).
- Kênh 2: chọn mascot (3 mẫu đang tạo ở `research/mascot/`), chuyển `script_draft.md` → scene list + prompt ảnh, chọn giọng kênh 2, dựng HUD sinh tồn (Remotion), render tập 1.
- Từ điển: người dùng nghe `lexicon/listen_check.wav`, báo số thứ tự sai để khoá.
