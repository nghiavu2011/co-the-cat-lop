# Cơ Thể Cắt Lớp

Atlas giải phẫu người tương tác bằng tiếng Việt cho người thường (không cần biết thuật ngữ y khoa). Bóc từng lớp da – mỡ – cơ – xương – nội tạng – mạch/thần kinh trên hình minh hoạ 2D, hoặc xoay và cắt lát mô hình ba chiều **thật** dựng từ toàn bộ 2.234 khối hình học gốc của BodyParts3D — chia theo 11 hệ cơ quan, mỗi bộ phận tiêu biểu có chú thích ngắn gọn: nằm ở đâu, làm việc gì, con số đáng nhớ, dấu hiệu bất thường, và điều nên lưu ý / khi nào cần khám.

Đây là bản đầy đủ (bước 2), kế tiếp bản demo/artifact ban đầu — dùng nguyên bộ mesh gốc của BodyParts3D thay vì bản rút gọn/gộp trước đó. Bản này đã được nâng cấp thêm một lớp trải nghiệm "sống động" (tim đập, hô hấp, dòng chảy trong mạch máu, hành trình dẫn dắt có kịch bản...) — xem mục riêng bên dưới.

## Chạy thử

```bash
npm install
npm run dev
```

Mở địa chỉ hiện ra (mặc định `http://localhost:5173`).

## Đóng gói để triển khai

```bash
npm run build
npm run preview   # xem thử bản build tại http://localhost:4173
```

Lệnh `build` xuất ra thư mục `dist/` — có thể triển khai lên bất kỳ static host nào (Vercel, Netlify, Cloudflare Pages, GitHub Pages, hoặc một Nginx/Apache đơn giản). Không cần server riêng, không cần cơ sở dữ liệu; toàn bộ dữ liệu hình học nằm sẵn trong `public/models/` (khoảng 33 MB, đã nén gzip) và được tải dần theo yêu cầu khi người dùng mở tab "Cắt lát 3D thật".

**Lưu ý khi chọn host:** một số static host tự động gắn header `Content-Encoding: gzip` cho các file có đuôi `.gz` (ví dụ `vite preview`, hoặc Vercel/Netlify tuỳ cấu hình) — trình duyệt khi đó tự giải nén trước khi JavaScript thấy dữ liệu. Bộ tải trong `src/data/loader.ts` đã tự nhận diện cả hai trường hợp (server có hoặc không tự giải nén) bằng cách kiểm tra chữ ký gzip trên bytes nhận được, nên không cần cấu hình gì thêm.

## Vì sao phông chữ được đóng gói sẵn (không dùng Google Fonts CDN)

Ba phông chữ (Playfair Display, Be Vietnam Pro, IBM Plex Mono) được cài qua các gói `@fontsource/*` và nhúng trực tiếp vào bản build, thay vì tải từ `fonts.googleapis.com`. Lý do: khi kiểm thử, phát hiện nếu Google Fonts không tải được (mạng công ty/trường học chặn, trình chặn quảng cáo, hoặc không có mạng), trình duyệt phải dùng phông thay thế của hệ điều hành — và một số phông thay thế (đặc biệt phông đơn cách dùng cho các nhãn/số liệu) không có đủ bộ dấu tiếng Việt, khiến chữ có dấu hiển thị sai (ví dụ "cơ thể" vỡ thành ký tự lạ). Tự đóng gói phông giúp trang luôn hiển thị đúng tiếng Việt bất kể tình trạng mạng, đồng thời không gửi request ra ngoài tới Google.

## Kiến trúc

```
src/
  data/         # atlas loader (JSON manifest + 15 chunk nhị phân nén gzip),
                # ánh xạ 15 hệ gốc của BodyParts3D -> 11 hệ tiếng Việt,
                # dựng THREE.BufferGeometry không sao chép (zero-copy view)
  content/      # 94 mục chú thích tiếng Việt (notes.json), thông tin tầng bóc lớp 2D,
                # bảng match3d.ts ghép mỗi mục chú thích với các cấu trúc thật tương ứng,
                # tours.ts: kịch bản 2 hành trình dẫn dắt có sẵn (hô hấp, tiêu hoá)
  components/   # Peel2D (SVG bóc lớp), View3D (Three.js, 2.234 mesh + mặt phẳng cắt,
                #   hoạt ảnh tim đập/hô hấp/dòng máu, xoay tự động khi rảnh),
                # Sidebar (tìm kiếm + danh sách hệ), InfoPanel, Header, Footer,
                # OnboardingHint (hướng dẫn lần đầu), TourBar (thanh điều khiển hành trình)
  audio/        # bodySounds.ts: tổng hợp âm thanh tim đập / hơi thở bằng Web Audio API
                # (không dùng file âm thanh ngoài, tự tắt/bật được, mặc định tắt)
  fonts.ts      # nhúng phông tự lưu trữ (@fontsource)
  urlState.ts   # đọc/ghi trạng thái xem (chế độ, hệ, lựa chọn) lên URL để chia sẻ liên kết
  App.tsx       # điều phối state chính (chế độ xem, độ sâu/mặt cắt, lựa chọn, tìm kiếm,
                # giao diện sáng/tối, âm thanh, hành trình dẫn dắt, liên kết chia sẻ)
public/
  models/       # atlas.json + 15 file body-N.bin.gz (dữ liệu hình học BodyParts3D)
  ATTRIBUTION.md
```

### Hai chế độ xem

- **Bóc lớp 2D** — minh hoạ SVG vẽ tay, 6 tầng (da, mỡ, cơ, xương, nội tạng, mạch·thần kinh), có nhãn tên và các ô "phóng to" cho cấu trúc quá nhỏ để vẽ tỉ lệ thật (ví dụ tế bào máu). Luôn hoạt động ngay cả khi chưa tải xong dữ liệu 3D.
- **Cắt lát 3D thật** — dựng toàn bộ 2.234 mesh gốc của BodyParts3D bằng Three.js. Có thể xoay tự do, cắt theo 3 mặt phẳng (ngang/axial, dọc giữa/sagittal, trước-sau/coronal) bằng `THREE.Plane` dùng chung cho mọi vật liệu, lọc theo hệ cơ quan (ẩn/hiện bằng thuộc tính `.visible`, không dùng trong suốt để tránh tốn hiệu năng khi sắp xếp lớp trong suốt trên hàng nghìn khối), và bấm trực tiếp vào khối để xem chú thích (raycasting chỉ tính các khối đang hiển thị và nằm ở phía chưa bị cắt).

### Ghép nội dung tiếng Việt với mesh thật

`src/content/match3d.ts` chứa 61 quy tắc chọn lọc (theo khái niệm FMA, biểu thức chính quy trên tên tiếng Anh, hoặc theo hệ gốc) để gộp các mesh liên quan thành một mục chú thích tiếng Việt duy nhất — ví dụ mục "Tim" gồm 7 cấu trúc thật (các buồng tim, vách tim…). 33 mục còn lại trong tổng số 94 mục chú thích chưa có quy tắc ghép mesh 3D tương ứng (`no3d`); các mục này vẫn hiển thị đầy đủ ở tab 2D nhưng ẩn ở tab 3D. Người dùng tìm một cấu trúc giải phẫu chưa được chú thích (qua ô tìm kiếm) vẫn xem được tên gốc và một đoạn giải thích chung, và trang tự chuyển sang tab 3D để hiển thị đúng khối đó.

### Lớp trải nghiệm "sống động" & dẫn dắt

Bản nâng cấp này thêm một loạt chi tiết nhỏ để mô hình 3D bớt "khô" và người xem không rành y khoa vẫn hình dung được cơ thể đang hoạt động, thay vì chỉ nhìn một khối tĩnh:

- **Tim đập & phổi thở**: khi hệ Tuần hoàn hoặc Hô hấp đang hiển thị, khối tim tự co bóp theo nhịp ~72 lần/phút và khối phổi phồng-xẹp theo nhịp thở chậm — thuần hoạt ảnh (scale theo thời gian), không ảnh hưởng vị trí lựa chọn hay cắt lớp.
- **Dòng chảy trong mạch máu**: mạch máu dùng vật liệu shader riêng (`THREE.ShaderMaterial`) vẽ các dải sáng chạy dọc thành mạch để gợi ý chiều dòng máu, vẫn tương thích đầy đủ với mặt phẳng cắt 3D.
- **Sáng lên khi chọn**: cấu trúc đang được chọn phát sáng nhẹ (emissive) để dễ nhận ra giữa hàng nghìn khối xung quanh.
- **Tự xoay khi không thao tác**: sau khoảng 3 giây không kéo/lăn chuột, mô hình tự xoay chậm để gợi ý "đây là vật thể 3D xoay được"; dừng ngay khi người dùng chạm vào lại. Tôn trọng thiết lập "giảm chuyển động" (`prefers-reduced-motion`) của trình duyệt/hệ điều hành.
- **Âm thanh nhẹ, tắt/bật được**: nút loa ở đầu trang bật tiếng tim đập hoặc hơi thở tổng hợp bằng Web Audio API (không phải file ghi âm) tương ứng với hệ đang xem; mặc định **tắt**, trạng thái được nhớ lại ở lần truy cập sau.
- **Hướng dẫn lần đầu**: người dùng mới thấy một lớp gợi ý thao tác (xoay/phóng to/bấm chọn/cắt lớp) khi mở mỗi chế độ xem lần đầu; bấm "Đã hiểu" hoặc bấm ra ngoài để tắt, không hiện lại ở các lần sau.
- **Hành trình dẫn dắt có kịch bản**: hai hành trình dựng sẵn — "Đường đi của hơi thở" (mũi → khí quản → phế quản → phổi → tim → động mạch chủ) và "Đường đi của thức ăn" (thực quản → dạ dày → tá tràng → ruột non → đại tràng → trực tràng) — tự động chuyển hệ, chọn đúng cấu trúc và hiện chú thích theo từng bước, có nút Tiếp/Trước/Thoát.
- **Giao diện sáng/tối**: nút chuyển đổi ở đầu trang (Hệ thống / Sáng / Tối), theo mặc định dùng thiết lập hệ điều hành, lựa chọn thủ công được nhớ lại.
- **Chia sẻ liên kết**: chế độ xem, hệ đang chọn và cấu trúc đang xem được mã hoá vào URL — bấm nút "Chia sẻ" để sao chép liên kết dẫn thẳng người khác đến đúng trạng thái đang xem.
- **Bố cục di động**: dưới 720px, khung xem 3D/2D được ưu tiên hiển thị lên đầu, các bảng điều khiển xếp gọn theo chiều dọc, không còn tràn ngang.

## Giới hạn dữ liệu (quan trọng)

- **Giải phẫu tham chiếu là nam giới trưởng thành** (theo TARO MRI) — không có tử cung, buồng trứng, vòi trứng, cổ tử cung.
- Không có mesh riêng cho: tuyến giáp, cơ thẳng bụng, cơ chéo bụng, amidan, hạch/mạch bạch huyết, và phần lớn dây thần kinh ngoại vi nhỏ. Các mục này chỉ có ở tab bóc lớp 2D.
- Đây là **một** bộ giải phẫu tham chiếu, không phản ánh sự đa dạng cơ thể thật (kích thước, biến thể giải phẫu, giới tính) — cần nói rõ với người dùng nếu triển khai cho mục đích giáo dục rộng rãi.
- Trang phục vụ mục đích giáo dục, **không phải công cụ chẩn đoán**. Mọi triệu chứng cần bác sĩ thăm khám trực tiếp.
- Số liệu y khoa trong các mục chú thích tham chiếu Gray's Anatomy và Atlas Giải phẫu người (Netter, bản dịch tiếng Việt) — nên được một chuyên gia y khoa rà soát lại trước khi dùng cho mục đích giảng dạy chính thức.

## Giấy phép & nguồn dữ liệu

- **Hình học 3D**: BodyParts3D 4.0, © The Database Center for Life Science (Nhật Bản), giấy phép **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/). Công bố gốc: Mitsuhashi et al. (2009), *Nucleic Acids Research* (doi:10.1093/nar/gkn613). Một số file OBJ gốc còn ghi giấy phép CC BY-SA 2.1 Nhật Bản cũ; giấy phép hiện hành (CC BY 4.0, cập nhật 27/02/2025) đã thay thế và cho phép phân phối lại/chỉnh sửa tự do miễn ghi nguồn.
- **Gói dữ liệu nhị phân** (atlas.json + body-N.bin.gz) lấy từ dự án mã nguồn mở [ashemag/human-atlas](https://github.com/ashemag/human-atlas) — đã đơn giản hoá lưới (mỗi cấu trúc giữ sai số tương đối ≤0.2%), lượng tử hoá pháp tuyến, đóng gói nhị phân. Xem đầy đủ tại `public/ATTRIBUTION.md`.
- **Nội dung tiếng Việt** (94 mục chú thích, ánh xạ hệ cơ quan, thiết kế giao diện) do phiên làm việc này biên soạn.
- Xem thêm ý tưởng tham khảo ban đầu: [thebuggeddev/anatomy](https://github.com/thebuggeddev/anatomy).

## Ghi chú hiệu năng

Tab 3D dựng khoảng 2.234 đối tượng `THREE.Mesh` riêng lẻ (không gộp batch) để giữ khả năng bấm chọn từng cấu trúc — trên máy cấu hình thấp hoặc trình duyệt di động, nên bật "Chỉ hệ đang chọn" để giảm số khối cần xử lý mỗi khung hình. Vật liệu dùng chung theo hệ (không tạo vật liệu/geometry riêng cho từng khối) để giảm chi phí bộ nhớ GPU.
