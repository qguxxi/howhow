# howhow 🥖📚
> Tiện ích mở rộng Chrome (Manifest V3) hỗ trợ mở khóa tài liệu và xuất file PDF chất lượng cao từ **Studocu**, **Scribd** và **SlideShare**.  
> Được thiết kế chuẩn theo mẫu giao diện Figma của dự án **howhow**.

---

## ✨ Tính năng chính

- **Tải file PDF gốc**: Sử dụng cơ chế in Native của trình duyệt, giữ nguyên lớp văn bản (selectable / searchable text) và độ sắc nét cao nhất của hình ảnh, không bị vỡ hạt như phương pháp chụp ảnh màn hình thông thường.
- **Mở khóa tài liệu (Unblur)**: 
  - Gỡ bỏ lớp làm mờ bằng CSS filters (`blur(...)`) và các thẻ overlay che khuất tài liệu.
  - Tự động thay thế đường dẫn ảnh mờ (`/pages/blurred/`) thành ảnh gốc sắc nét.
  - Patch trạng thái React Fiber và `__NEXT_DATA__` của Studocu để ngăn trang tự động kích hoạt lại bộ lọc mờ.
- **Xóa quảng cáo & rào cản**: Tự động dọn dẹp các banner ép mua gói Premium, modal yêu cầu đăng nhập chống bot (`AuthWall`), và các popup gây phiền toái.
- **Hỗ trợ đa nền tảng**:
  - **Studocu** (`studocu.com`, `studocu.vn`, `studeersnel.nl`, `studocu.id`)
  - **Scribd** (`scribd.com`, hỗ trợ cả iframe lồng nhau)
  - **SlideShare** (`slideshare.net`, trích xuất slide độ phân giải cao nhất `data-full` / `srcset`)
- **Xóa Cookie Studocu 1-click**: Dễ dàng đặt lại phiên làm việc khi gặp giới hạn số trang xem trước miễn phí.
- **Giao diện chuẩn Pixel-Perfect**: Thiết kế theo phong cách tối giản, hiện đại từ Figma, hỗ trợ chuyển đổi linh hoạt giữa Tiếng Việt và English.

---

## 🚀 Hướng dẫn cài đặt vào trình duyệt

Tiện ích hoạt động trên các trình duyệt sử dụng nhân Chromium: **Google Chrome**, **Microsoft Edge**, **Brave**, **Cốc Cốc**,...

1. Mở trang quản lý tiện ích trên trình duyệt:
   - Trên Chrome / Cốc Cốc: gõ `chrome://extensions` vào thanh địa chỉ.
   - Trên Microsoft Edge: gõ `edge://extensions`.
   - Trên Brave: gõ `brave://extensions`.
2. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải màn hình.
3. Nhấp vào nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
4. Chọn thư mục dự án:
   ```
   C:\Users\qgucci\howhow
   ```
5. Tiện ích **howhow** sẽ xuất hiện trên thanh công cụ của bạn. Hãy bấm vào biểu tượng chiếc ghim (Pin) để cố định tiện ích trên thanh trình duyệt.

---

## 📖 Hướng dẫn sử dụng

1. **Mở tài liệu cần tải**:
   - Truy cập vào trang tài liệu bất kỳ trên `studocu.com`, `scribd.com` hoặc `slideshare.net`.
2. **Mở popup howhow**:
   - Bấm vào biểu tượng tiện ích **howhow** trên thanh công cụ.
3. **Mở khóa tài liệu**:
   - Bấm nút **"Mở khóa tài liệu"**: Hệ thống sẽ tự động gỡ mờ văn bản, thay thế ảnh chất lượng cao và ẩn các banner phiền toái.
4. **Tải file PDF**:
   - Bấm nút **"Tải file PDF"**: Tiện ích sẽ tự động cuộn qua toàn bộ tài liệu để tải đủ 100% các trang và ảnh, sau đó mở hộp thoại in của trình duyệt.
   - Tại hộp thoại in (Print Preview):
     - **Máy in đích (Destination)**: Chọn **Lưu dưới dạng PDF (Save as PDF)**.
     - **Lề (Margins)**: Chọn **Không có (None)** để tránh bị thừa viền trắng.
     - **Đồ họa nền (Background graphics)**: Tích chọn để giữ đầy đủ màu sắc và hình ảnh.
     - Nhấn **Lưu (Save)**.
5. **Khôi phục trang**:
   - Sau khi in xong, bấm **"Khôi phục trang"** nếu bạn muốn quay lại giao diện đọc thông thường.

---

## 📁 Cấu trúc thư mục

```
c:\Users\qgucci\howhow\
├── manifest.json            # File cấu hình Manifest V3
├── background.js            # Background service worker (quản lý cookie & messaging)
├── assets/                  # Các icon SVG và logo chính hãng từ Figma
│   ├── logo.png
│   ├── pdf-icon.svg
│   ├── unlock-icon.svg
│   ├── warning-icon.svg
│   ├── coffee-icon.svg
│   ├── qr-icon.svg
│   ├── chevron-down.svg
│   ├── chevron-right-white.svg
│   └── arrow-right.svg
├── icons/                   # Bộ icon ứng dụng (16, 32, 48, 128 px)
├── popup/                   # Giao diện Popup Extension
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/                 # Content scripts theo từng nền tảng
│   ├── studocu.js           # Unblur, auto-scroll hydration & in cho Studocu
│   ├── studocu.css          # Style CSS gỡ mờ & layout trang in Studocu
│   ├── scribd.js            # Frame discovery, hydration & in cho Scribd
│   └── slideshare.js        # Trích xuất slide HD & in cho SlideShare
├── DESIGN.md                # Hệ thống thiết kế Shadcn UI System (tokens, colors, typography)
└── README.md
```

---

## 🔒 Bản quyền & Miễn trừ trách nhiệm

- Dự án được xây dựng cho mục đích học tập và nghiên cứu cá nhân.
- Vui lòng tôn trọng bản quyền của các tác giả và điều khoản sử dụng của từng nền tảng tài liệu.
