# Kế hoạch Xây dựng Dự án Music Streaming (Dựa trên SOC AIO Architecture)

Tài liệu này tổng hợp các kiến trúc, luồng xử lý và các thành phần chuyên nghiệp từ dự án SOC AIO để ứng dụng vào việc xây dựng đồ án website nghe nhạc.

## Phân tích Kiến trúc Gốc (SOC AIO)

### 1. Backend (Microservices with NestJS)
- **Cấu trúc Monorepo:** Tận dụng `apps` cho các service riêng biệt và `libs` cho code dùng chung (database schemas, utilities).
- **BFF Pattern:** Một Gateway duy nhất (`soc-aio`) giao tiếp với Frontend và điều phối các service phía sau.
- **Database:** MongoDB tối ưu cho việc lưu trữ meta-data bài hát, playlist (schema linh hoạt).
- **Real-time:** Socket.io với Redis adapter giúp đồng bộ hóa trạng thái nghe nhạc giữa các thiết bị.

### 2. Frontend (Modern React with Vite)
- **State Management:** 
    - `Redux Toolkit` + `Redux Persist`: Quản lý trạng thái Player (bài hát đang phát, hàng chờ).
    - `React Query`: Fetching dữ liệu bài hát, album với cơ chế caching mạnh mẽ.
- **UI/UX:** Tailwind CSS + Shadcn UI cho giao diện chuyên nghiệp, mượt mà.
- **API Client:** Axios interceptor xử lý Refresh Token và Retry (429) tự động.

---

## Các Thành phần quan trọng cần "Học tập"

### [COMPONENT] Authentication & Security
- **Luồng Logout/Refresh:** Copy cơ chế trong [client.ts](file:///home/hoadd7/soc/Frontend/app/src/api/client.ts) để đảm bảo người dùng không bị văng ra khi đang nghe nhạc do hết hạn token.
- **2FA (Optional):** Có thể áp dụng luồng OTP Verification từ [auth.service.ts](file:///home/hoadd7/soc/soc_backend/apps/soc-aio/src/auth/auth.service.ts) cho các tài khoản nghệ sĩ.

### [COMPONENT] Form & Validation
- **Upload Music:** Sử dụng pattern từ [AddUserDialog.tsx](file:///home/hoadd7/soc/Frontend/app/src/components/admin/UserManagement/dialogs/AddUserDialog.tsx).
    - Chia form thành nhiều bước (Metadata -> File Upload -> Review).
    - Dùng `zod` để validate định dạng file mp3/flac và ảnh bìa album.

### [COMPONENT] Music Player State
- **Global Store:** Tham khảo cách tổ chức slice trong `store/slices` để quản lý:
    - `currentTrack`: Thông tin bài hát hiện tại.
    - `queue`: Danh sách bài hát chờ.
    - `playbackState`: play/pause/loading.

---

## Kế hoạch Thực hiện cho Đồ án Music Streaming

### Phase 1: Foundation (Backend & DB)
- Khởi tạo NestJS với cấu trúc tương tự `soc_backend`.
- Thiết kế Schema MongoDB: [User](file:///home/hoadd7/soc/soc_backend/libs/core/src/database/schemas/user.schema.ts#6-60), `Song`, `Album`, `Artist`, `Playlist`.
- Setup Redis cho caching và Socket.io cho tính năng "Listening Party" (nghe chung).

### Phase 2: Core Frontend Structure
- Setup Vite + React + Tailwind + Shadcn UI.
- Triển khai `apiClient` với đầy đủ interceptors như dự án SOC.
- Xây dựng Layout Player (Sticky bottom) dùng Redux để giữ nhạc luôn phát.

### Phase 3: Features Implementation
- **Trang Dashboard:** Áp dụng `StatCard` và `Tabs` từ [AgentsPage.tsx](file:///home/hoadd7/soc/Frontend/app/src/pages/AgentsPage.tsx) để hiển thị xu hướng nghe nhạc, nghệ sĩ nổi bật.
- **Trang Library:** Sử dụng `DataTable` linh hoạt để quản lý danh sách bài hát cá nhân.
- **Trang Artist:** Hiển thị thông tin nghệ sĩ với Recharts (thống kê lượt nghe).

---

## Verification Plan

### Automated Tests
- Kiểm tra luồng Refresh Token bằng cách chỉnh thời hạn JWT cực ngắn.
- Unit test cho logic Playback (Next/Prev/Shuffle) dùng Vitest.

### Manual Verification
- Kiểm tra việc duy trì nhạc phát khi chuyển giữa các Page trong ứng dụng (Single Page App behavior).
- Kiểm tra việc upload file nhạc lớn (>10MB) với thanh progress bar (UI dùng Radix Progress).
