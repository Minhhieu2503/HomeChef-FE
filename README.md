# HomeChef Frontend (Web & Mobile)

Giao diện người dùng của HomeChef, được xây dựng bằng React và Vite, hỗ trợ trải nghiệm mượt mà trên cả trình duyệt web và thiết bị di động (Android).

## 📁 Cấu trúc thư mục

- `/src/components`: Các thành phần giao diện dùng chung (Button, Card, Input, Header, Sidebar).
- `/src/pages`: Chứa mã nguồn cho các trang chức năng chính.
- `/src/services`: Xử lý việc gọi API tới backend.
- `/src/context`: Quản lý trạng thái ứng dụng (Authentication, Pantry state).
- `/src/assets`: Chứa hình ảnh và các tệp tĩnh.
- `/android`: Thư mục chứa dự án Android (được quản lý bởi Capacitor).

## 🖥 Các trang chính

- **Trang chủ (Home):** Tổng quan về tủ lạnh, gợi ý món ăn nhanh.
- **Tủ lạnh (Pantry):** Quản lý danh sách nguyên liệu, ngày hết hạn. Hỗ trợ quét ảnh bằng Camera.
- **Công thức (Recipes):** Tìm kiếm và lọc món ăn theo nhiều tiêu chí.
- **Chi tiết món ăn (RecipeDetail):** Xem hướng dẫn nấu ăn, thành phần và dinh dưỡng.
- **Lập kế hoạch bữa ăn (MealPlanner):** Lên lịch nấu ăn cho tuần.
- **Danh sách đi chợ (ShoppingList):** Tự động tạo danh sách mua sắm từ nguyên liệu thiếu.
- **Admin Dashboard:** Quản trị hệ thống dành cho người quản lý.

## 📱 Hỗ trợ di động (Capacitor)

Dự án sử dụng **Capacitor** để biến ứng dụng web thành ứng dụng Android.

### Cách build Android:
1. `npm run build` (Tạo bản build web trong thư mục `dist`).
2. `npx cap sync` (Đồng bộ bản build vào thư mục `android`).
3. Mở Android Studio để build tệp `.apk` hoặc chạy trực tiếp trên thiết bị.

## 🛠 Công nghệ sử dụng

- **Framework:** React 19
- **Bundler:** Vite 8
- **Routing:** React Router Dom
- **Icons:** Lucide React
- **Đồ thị:** Recharts (Dùng trong trang cá nhân/dinh dưỡng)
- **API Client:** Axios

## 🚀 Cách chạy dự án

1. `npm install`
2. Tạo file `.env` với `VITE_API_URL` trỏ về Backend (mặc định `http://localhost:5000/api`).
3. `npm run dev`

---
*Lưu ý: Thiết kế sử dụng Vanilla CSS để tối ưu hóa hiệu suất và linh hoạt trong tùy biến UI.*
