# Tích Tắc — mascot kênh 2 ("Xuyên Không Sinh Tồn")

Chốt: 2026-11-25 (mẫu 1 trong 3 concept: đầu đồng hồ / cáo cam / bé cắt giấy). Ảnh gốc: `sheet/era_rome.png`.

## Vai trò
Tích Tắc **là "bạn"** — người xem. Mọi câu "bạn…" trong kịch bản đều do Tích Tắc diễn. Cùng một nhân vật ở mọi tập; chỉ đổi trang phục theo thời đại. Nhân vật phụ (người địa phương, thuyền trưởng…) vẽ người bình thường để Tích Tắc luôn nổi bật.

## Nhận diện BẮT BUỘC (prompt chuẩn: `character.json` → `"prompt"`)
| Bộ phận | Chuẩn |
|---|---|
| Đầu | Đồng hồ bỏ túi tròn bằng đồng thau, viền vàng bóng, **khoen treo trên đỉnh**, núm vặn bên phải |
| Mặt | Mặt số men trắng, số La Mã đen quanh viền, **2 mắt tròn đen to có điểm sáng**, má hồng, miệng nhỏ |
| Lông mày | **Kim giờ & kim phút** nằm trên mắt — biểu cảm bằng góc kim (sợ: kim chếch lên; buồn: kim rủ xuống; tự tin: một kim nhướn) |
| Thân | Nhỏ, tròn; tay chân ngắn màu **cam ấm**; giày đen nhỏ |
| Phụ kiện cố định | **Khăn quàng cam** — luôn có, kể cả khi mặc trang phục thời đại |

## Bảng màu
- Đồng thau `#B8892E` · vàng viền `#D9B45A` · mặt số `#FAF6EC` · kim/số `#1E1E1E`
- Cam nhận diện (khăn, tay chân) `#F2752B` · má `#F4A6A0`
- Nền thương hiệu (thẻ/HUD): kem `#F6EBD9`, nâu đậm `#3A2A1A`

## Phong cách vẽ
`character.json` → `"style"`: storybook 2D, cel shading mềm, màu ấm, nét sạch, ánh sáng điện ảnh nhẹ. **Không** dùng phong cách "bóng đen mắt trắng" của ngách, không anime bóng bẩy.

## Không được
- Đầu thành đồng hồ treo tường/đồng hồ số; mất khoen treo; mặt có mũi/tai người
- Mất khăn cam; tay chân màu khác cam
- Vẽ quá 1 Tích Tắc trong một cảnh (trừ cảnh "phân thân" có chủ đích)
- Biểu cảm bạo lực/máu me (khán giả teen)

## Thông số tạo ảnh
- Model: `filipstrand/Z-Image-Turbo-mflux-4bit`, base `z-image-turbo`, **6 bước**, seed gốc **11**
- Cảnh 16:9: 1280×720 (hoặc 960×540 rồi upscale nếu cần nhanh); thẻ biểu cảm: 1024×1024
- Lệnh: `.venv-img/bin/python scripts/gen_images.py <jobs.json> <outDir> --character brand/tictac/character.json` (dùng `{CHAR}` trong prompt)
- Giữ nhất quán: luôn chèn nguyên văn `{CHAR}`; mô tả trang phục **thêm** vào sau, nhắc lại "with his orange scarf"; nếu ảnh lệch → đổi seed, không sửa câu chuẩn.

## Bộ ảnh tham chiếu (`sheet/`)
`ref_front` (chính diện, nền trơn — dùng tách nền làm thumbnail/avatar) · `exp_happy` · `exp_scared` · `exp_surprised` · `exp_sad` · `exp_confident` · `exp_tired` · `era_cretaceous` · `era_iceage` · `era_blackdeath` · `era_london1858` · `era_rome` · `era_egypt`
