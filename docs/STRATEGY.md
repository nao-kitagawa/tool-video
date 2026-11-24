# Chiến lược nội dung

Cập nhật: 2026-11-25. Dữ liệu thô: `research/` (quét bằng `scripts/niche_scan.py`, chấm bằng `niche_score.py` / `niche_gap.py`).

## Mục tiêu
Tìm ngách **có view** cho kênh YouTube tiếng Việt, sản xuất 0 đồng. Định hướng kênh có thể đổi theo dữ liệu.

## Phương pháp "nhân bản thị trường"
(Tham khảo video của H2Dev — https://www.youtube.com/watch?v=1H4J_jrvMMQ)
1. Tìm format đang bùng nổ ở Mỹ, đặc biệt ở **kênh nhỏ/mới** (view gấp ≥3 lần số sub).
2. Đo nguồn cung ở Việt Nam cho cùng format.
3. Chọn ngách có **chênh lệch** lớn: Mỹ cầu cao + kênh nhỏ thắng + VN cung thấp.
4. Việt hoá, nhưng xây **bản sắc riêng** (mascot, phong cách vẽ, HUD, tiêu đề) — không sao chép nhận diện đối thủ, không clone giọng.

## Chỉ số chấm điểm
- `view/ngày` (trung vị video ≤ 12 tháng) — nhu cầu hiện tại
- `outlier%` — % video của kênh < 200k sub có view ≥ 3× sub (kênh mới còn cửa)
- `kênh nhỏ thắng` — số video kênh < 100k sub đạt ≥ 100k view
- `top1%` — mức độ một kênh chiếm ngách
- GAP = 0.45·cầu Mỹ + 0.25·outlier Mỹ + 0.30·(1 − cung VN)

## Kết quả (2026-11-25, ~20 video/ngách/thị trường — mẫu nhỏ, chỉ là tín hiệu)
| Ngách | GAP | Mỹ view/ngày | Mỹ outlier | VN view/ngày |
|---|---|---|---|---|
| "Sẽ ra sao nếu BẠN…" (ngôi 2) | 70.7 | 21,197 | 70% | 3,790 |
| Sinh tồn giả định | 62.7 | 5,290 | 50% | 302 |
| Kẹt cùng crush (nhánh của #1) | 61.6 | 7,655 | 60% | 2,336 |
| Siêu năng lực what-if | 61.3 | 5,660 | 65% | 1,064 |
| Khoa học trong phim | 57.0 | 41,451 | 25% | 4,593 |
| History for sleep | 56.2 | 2,336 | 39% | 108 |
| Tóm tắt phim / anime | 51–53 | 7–9k | 26–38% | 7–13.6k (VN bão hoà) |
Bảng đầy đủ: `research/gap_table.txt`. VN 25 ngách: `research/niche_scan_vn_scored.json`.

Bằng chứng nổi bật:
- Mỹ "What if you…": What If Jar (141 sub → 440k view), First Soul (1.8k → 563k), The If Lab (1.6k → 759k).
- Mỹ "every era survival": Fossil (59.7k sub → 13.4M view "How Long You'd Last in Every Prehistoric Era").
- VN "kẹt dưới hầm với crush": Giáo Sư Bút (17.9k sub → 1.4M). Nhánh "kẹt với crush" đã đông → người dùng loại.

## Quyết định ngách
- **Kênh 2: "XUYÊN KHÔNG SINH TỒN"** (format "bạn" + sinh tồn theo thời đại), bối cảnh **lịch sử thế giới, tiền sử, thế giới phim/game** — không lịch sử/chính trị VN.
  - Bản sắc: mascot riêng (đang chọn: đầu đồng hồ "Tích Tắc" / cáo cam / bé cắt giấy), **HUD "THANH SINH TỒN" + tỉ lệ sống sót %**, kết mỗi tập bằng bảng xếp hạng + câu hỏi "bạn chọn thời nào?".
  - Tập 1: "Bạn Sống Sót Được Bao Lâu Nếu Xuyên Không Về Từng Thời Đại?" (Phấn Trắng → Băng hà → Cái Chết Đen 1348 → London 1858 → La Mã → Ai Cập; twist: công trường kim tự tháp dễ sống nhất). Kịch bản: `projects/kenh2-ep01-xuyen-khong/script_draft.md`.
- **Kênh 1**: giữ phân tích trailer/sách vs phim; thêm "Liệu có thể xảy ra?" và "Nếu như…". Không làm tóm tắt phim/anime thuần (bão hoà + rủi ro bản quyền).
- Để sau: History for sleep (kênh 3).

## Đối thủ tham chiếu (kênh 1 — Dune)
Quinn's Ideas, Secrets of Dune (77.7k sub → 198k view/21 ngày, 10:28, 12 chương), The Understory (cấu trúc không-spoil → cảnh báo SPOILER → giả thuyết), Phê Phim, W2W, CBooks (7k sub → 119k).
Nhịp đọc đo từ phụ đề: Phê Phim 245–258 từ/phút, W2W 243 từ/phút, ngắt ~0.58s mỗi ~6 từ.

## Rủi ro chung
- Chính sách YouTube về "nội dung không xác thực / làm hàng loạt": mỗi video phải có phân tích/lập luận riêng.
- Content ID với footage trailer; tải YouTube bằng yt-dlp trái ToS (người dùng tự quyết).
