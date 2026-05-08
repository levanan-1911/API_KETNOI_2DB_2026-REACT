// ============================================================
// API Configuration
// Thay đổi API_BASE_URL khi deploy:
//   - Local:  http://localhost:5000
//   - ngrok:  https://abc123.ngrok-free.app  (thay bằng URL thực)
// ============================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default API_BASE_URL;
