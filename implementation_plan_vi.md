# Kế hoạch Chuyên nghiệp hóa Dự án Spotify-fullstack

Tài liệu này chi tiết các bước nâng cấp dự án của bạn lên mức độ chuyên nghiệp nhất, áp dụng các tinh túy từ kiến trúc SOC AIO (Microservices, Clean Code, High Performance).

## 1. Cải tiến Backend (Microservices Core)

Chúng ta sẽ không copy code một cách máy móc, mà sẽ xây dựng một nền tảng vững chắc thông qua các thư viện dùng chung (`libs`).

### Thư viện dùng chung (`libs`)
- **Chuẩn hóa Phản hồi (Standardized Response)**: Tất cả API sẽ trả về chung một format (Success, Message, Data, StatusCode).
- **Hệ thống Lỗi tập trung (Global Error Handling)**: Tự động bắt lỗi và trả về mã lỗi chính xác (400, 401, 403, 404, 500) thay vì crash server.
- **Middleware chuyên nghiệp**:
    - `validate`: Sử dụng **Zod** để kiểm tra dữ liệu đầu vào (Body, Query, Params) trước khi xử lý.
    - `auth`: Xác thực JWT tập trung, hỗ trợ phân quyền người dùng (User/Artist/Admin).

### Nâng cấp Auth Service
- **Refresh Token Rotation**: Cơ chế tự động làm mới token mà không bắt người dùng đăng nhập lại, đồng thời thu hồi token cũ để bảo mật.
- **Security**: Mã hóa mật khẩu bằng Bcrypt, lưu trữ phiên đăng nhập an toàn.

---

## 2. Nâng cấp Frontend (Modern React Patterns)

Giao diện sẽ không chỉ đẹp mà còn phải cực kỳ mượt mà nhờ vào các kỹ thuật quản lý trạng thái hiện đại.

### Quản lý Trạng thái (Player State)
- **Redux Toolkit**: Quản lý toàn bộ trạng thái trình phát nhạc (Bài hát hiện tại, Hàng chờ, mute/volume).
- **Redux Persist**: Đảm bảo khi Refresh trang, nhạc vẫn tiếp tục ở đúng vị trí cũ.

### Xử lý Dữ liệu (Performance)
- **React Query**: 
    - Tự động Caching dữ liệu bài hát/album giúp tải trang tức thì.
    - Tự động Fetch lại dữ liệu khi mạng quay trở lại.
- **Axios Interceptor**: Tự động gắn Token vào header và xử lý lỗi 401 (token hết hạn) để gọi API làm mới token một cách thầm lặng.

---

## 3. Các thành phần Chuyên nghiệp bổ sung

- **Zod Schema**: Định nghĩa schema cho mọi Model để đảm bảo tính toàn vẹn của dữ liệu.
- **Shadcn UI + Framer Motion**: Tạo ra các hiệu ứng micro-interactions mượt mà như Spotify thật.
- **Dockerization**: Đóng gói mọi service vào Docker để dễ dàng triển khai lên Server thật (Production).

## Lộ trình Thực hiện (Roadmap)

1. **Giai đoạn 1**: Hoàn thiện `libs` (Error, Response, Validation). (Đang thực hiện)
2. **Giai đoạn 2**: Refactor `Auth Service` & `User Service` theo chuẩn mới.
3. **Giai đoạn 3**: Xây dựng Core Player logic phía Frontend với Redux Toolkit.
4. **Giai đoạn 4**: Tích hợp React Query và Refinement UI với Shadcn.
5. **Giai đoạn 5**: Test và đóng gói Docker.
