# Bài học / lỗi đã gặp

- **VS Code preview không phát AAC** → mở video bằng QuickTime (`open -a "QuickTime Player" file.mp4`).
- **edge-tts** từ chối câu dài (NoAudioReceived) → dùng VieNeu.
- **VieNeu chuẩn hoá trước G2P**: chữ hoa trong câu bị đánh vần kiểu Việt ("IMAX" → "i mờ a ích"); `phoneme_dict` của sea-g2p bị lõi Rust bỏ qua → phải encode placeholder trước chuẩn hoá (`scripts/lexicon.py`).
- **Cache TTS phải gồm hash từ điển + file giọng**, nếu không sẽ dùng lại audio cũ sai phát âm.
- **Hậu kỳ giọng** (PSOLA ×1.35, Praat Change gender, EQ tăng 320Hz, compressor) → người dùng nghe "vang". Đo bằng tốc độ tắt âm: W2 5dB/60ms (vang) vs raw ~10dB.
- **Trộn timbre với Hải Đăng/Thái Sơn** làm cao tông hơn chứ không trầm hơn.
- **Whisper** đoán sai tên riêng trong trailer có nhạc to ("Chani's" → "Johnny's") → đối chiếu nguồn báo; chấm phát âm từ đơn lẻ hay bị "bịa" câu.
- **faster-whisper + PyAV** lỗi `metadata_errors` → giải mã audio bằng ffmpeg rồi đưa numpy.
- **yt-dlp** có lượt search treo nhiều phút hoặc trả cả playlist (361 kết quả) → timeout 180s + cắt `[:n]`.
- **Remotion OffthreadVideo**: dùng `trimBefore` (frame composition), server nội bộ cần hỗ trợ Range. Clip ít hơn voice → lặp lại clip đã chọn, không để chạy tràn sang shot lạ.
- **Remotion text**: "~" trông như dấu trừ; emoji 👀 không render; nhãn timeline dài phải `nowrap`.
- **zsh** không tách từ của biến `$TS` trong `for` → liệt kê giá trị trực tiếp.
- **Render 16:9 với 3 trailer 1080p**: ~5 phút cho 2:20 video; CPU M2 ~94% (compositor ffmpeg nặng nhất). CONCURRENCY=6 hợp lý.
- **Tạo ảnh mflux**: bottleneck là GPU (~28s/bước), tắt Chrome không giúp.
- **Tên kênh ≠ ngách**: đừng suy diễn ngách từ tên kênh; hỏi/đọc DECISIONS.
