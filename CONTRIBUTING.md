# 🚀 Quy trình Git Workflow Chuẩn Production

Tài liệu này quy định chuẩn mực phát triển phần mềm, quy tắc phân nhánh (branching strategy), quy tắc commit và quy trình phát hành (release) cho dự án **howhow**.

---

## 🌳 1. Mô hình phân nhánh (Branching Strategy)

Dự án áp dụng mô hình **Trunk-Based Development** kết hợp **Feature Branching**:

```
main (Production) ──────────────────────────────────● [Tag: v1.0.0] ─────►
       \                                           /
        └── feat/scribd-downloader ───────────────┘ (Pull Request)
```

### Quy ước đặt tên nhánh (Branch Naming)
| Tiền tố | Mục đích | Ví dụ |
|---|---|---|
| `feat/` | Tính năng hoặc cải tiến mới | `feat/scribd-fast-download`, `feat/dark-mode` |
| `fix/` | Sửa lỗi tính năng hoặc tương thích | `fix/studocu-blur-selector`, `fix/popup-i18n` |
| `refactor/` | Tái cấu trúc code (không đổi tính năng) | `refactor/content-script-loader` |
| `perf/` | Tối ưu hóa hiệu năng, giảm dung lượng | `perf/optimize-svg-assets` |
| `docs/` | Cập nhật tài liệu hướng dẫn | `docs/update-readme` |
| `chore/` | Cập nhật cấu hình build, CI/CD, dependency | `chore/update-ci-pipeline` |

> ⚠️ **Nguyên tắc vàng:** Không commit trực tiếp vào nhánh `main`. Mọi thay đổi đều phải thông qua Pull Request (PR).

---

## 💬 2. Quy chuẩn Commit Message (Conventional Commits)

Định dạng commit message bắt buộc:
```
<type>(<scope>): <mô tả ngắn bằng tiếng Anh hoặc tiếng Việt>

[optional body: giải thích chi tiết lý do và ngữ cảnh thay đổi]

[optional footer: tham chiếu issue, ví dụ: Closes #12]
```

### Các loại `type`:
- **`feat`**: Thêm tính năng mới cho người dùng.
- **`fix`**: Sửa lỗi trong mã nguồn.
- **`docs`**: Chỉ thay đổi tài liệu (README, CHANGELOG,...).
- **`style`**: Định dạng code, dấu cách, chấm phẩy (không ảnh hưởng logic).
- **`refactor`**: Refactor code không sửa lỗi cũng không thêm tính năng mới.
- **`perf`**: Thay đổi code giúp tăng hiệu năng hoặc giảm tài nguyên.
- **`test`**: Bổ sung hoặc sửa đổi các bài test / validation script.
- **`chore`**: Công việc bảo trì, cấu hình git, workflow, package metadata.

### Ví dụ chuẩn:
```bash
git commit -m "feat(studocu): auto-unblur premium document pages"
git commit -m "fix(popup): correct layout alignment without PRO badge"
git commit -m "chore(ci): add automated manifest integrity check"
```

---

## 🧪 3. Quy trình làm việc hàng ngày (Daily Workflow)

### Bước 1: Tạo nhánh mới từ `main` mới nhất
```bash
git checkout main
git pull origin main
git checkout -b feat/ten-tinh-nang
```

### Bước 2: Phát triển và kiểm tra cục bộ
Chạy script kiểm tra hợp lệ của manifest và cú pháp JS:
```bash
npm run validate
# hoặc: node scripts/validate.js
```

### Bước 3: Commit tuân theo Conventional Commits
```bash
git add .
git commit -m "feat(module): your clear message"
```

### Bước 4: Đẩy nhánh lên Remote & Mở Pull Request
```bash
git push -u origin feat/ten-tinh-nang
```
- Mở Pull Request trên GitHub nhắm vào nhánh `main`.
- Điền đầy đủ thông tin theo **Pull Request Template**.
- Đảm bảo toàn bộ checks trong **CI (Lint & Validate)** chuyển sang màu xanh (Passed).

---

## 🏷️ 4. Quy trình Release Phiên bản Mới (Semantic Versioning)

Dự án áp dụng chuẩn **Semantic Versioning** (`vMAJOR.MINOR.PATCH`):
- `MAJOR`: Thay đổi lớn gây phá vỡ tương thích (breaking changes).
- `MINOR`: Thêm tính năng mới nhưng tương thích ngược.
- `PATCH`: Sửa lỗi nhỏ, tối ưu hóa.

### Các bước phát hành:
1. Cập nhật số phiên bản đồng nhất trong:
   - `manifest.json` (`"version": "1.1.0"`)
   - `package.json` (`"version": "1.1.0"`)
   - `CHANGELOG.md`
2. Commit và merge vào `main`:
   ```bash
   git commit -m "chore(release): bump version to 1.1.0"
   ```
3. Tạo tag phiên bản và push:
   ```bash
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   ```
4. **GitHub Action Release** sẽ tự động:
   - Kiểm tra tính hợp lệ của tag và manifest.
   - Đóng gói file `.zip` hoàn chỉnh cho extension.
   - Tạo GitHub Release và đính kèm file zip sẵn sàng tải lên Chrome Web Store.
