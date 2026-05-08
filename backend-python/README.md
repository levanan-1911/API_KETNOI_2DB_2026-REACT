# HRM Payroll Integration - Python Backend

Backend được viết bằng Python sử dụng FastAPI framework.

## Cài đặt

```bash
cd backend-python
pip install -r requirements.txt
```

## Chạy server

```bash
python app.py
```

Hoặc sử dụng uvicorn trực tiếp:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 3000
```

## API Endpoints

Tất cả endpoints đều giống với Node.js backend cũ:

- `GET /api/dashboard/employees` - Lấy danh sách nhân viên
- `GET /api/dashboard/employees?q=keyword` - Tìm kiếm nhân viên
- `POST /api/dashboard/employees` - Tạo nhân viên mới
- `PUT /api/dashboard/employees/:id` - Cập nhật nhân viên
- `DELETE /api/dashboard/employees/:id` - Xoá nhân viên
- `POST /api/dashboard/employees/sync` - Đồng bộ nhân viên
- `GET /api/dashboard/organization` - Lấy thông tin tổ chức
- `PUT /api/dashboard/departments/:id` - Cập nhật phòng ban
- `PUT /api/dashboard/positions/:id` - Cập nhật vị trí
- `POST /api/dashboard/organization/sync` - Đồng bộ tổ chức
