"""
seed_via_api.py
===============
Script sinh 100 nhân viên mẫu bằng cách gọi API hiện có.
Sau khi thêm nhân viên thành công, tự động insert lương + chấm công
12 tháng (5/2025 → 4/2026) trực tiếp vào MySQL.

Cách chạy:
    python database/seed_via_api.py

Yêu cầu:
    - Backend đang chạy tại http://localhost:5000
    - pip install requests
"""

import requests
import random
import time
import sys

random.seed(42)

API = "http://localhost:5000"

# ============================================================
# DỮ LIỆU MẪU
# ============================================================

HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi",
      "Ngô", "Đinh", "Trịnh", "Lý", "Phan", "Cao", "Hồ", "Dương", "Tô", "Mai", "Lưu", "Kiều"]

TEN_NAM = ["Văn An", "Minh Khoa", "Văn Bảo", "Văn Dũng", "Văn Phúc",
           "Văn Sơn", "Văn Tuấn", "Văn Vinh", "Văn Yên", "Văn Bình",
           "Văn Đạt", "Văn Giang", "Văn Hùng", "Văn Long", "Văn Nam",
           "Văn Phong", "Văn Rạng", "Văn Thắng", "Văn Toàn", "Văn Trung",
           "Văn Tùng", "Văn Uy", "Văn Vương", "Văn Xuân", "Văn Yên",
           "Văn Zin", "Văn Cảnh", "Văn Đăng", "Văn Điền", "Văn Đức",
           "Minh Tâm", "Quang Huy", "Đức Anh", "Hoàng Nam", "Trọng Nghĩa"]

TEN_NU  = ["Thị Hoa", "Thị Cẩm", "Thị Oanh", "Thị Lan", "Thị Ngọc",
           "Thị Tâm", "Thị Uyên", "Thị Xuân", "Thị Ánh", "Thị Châu",
           "Thị Ếm", "Thị Hằng", "Thị Khánh", "Thị Mai", "Thị Oanh",
           "Thị Quế", "Thị Sen", "Thị Thủy", "Thị Trang", "Thị Vân",
           "Thị Xuân", "Thị Ánh", "Thị Cúc", "Thị Dịu", "Thị Giang",
           "Thị Hiền", "Thị Hương", "Thị Linh", "Thị Ly", "Thị Nga",
           "Thị Nhung", "Thị Nụ", "Thị Phương", "Thị Quyên", "Thị Ry",
           "Thị Sim", "Thị Thi", "Thị Thu", "Thị Tú", "Thị Tuyết",
           "Thị Vui", "Thị Xanh", "Thị Yến", "Thị Yêu", "Thị Bông",
           "Thị Dào", "Thị Đào", "Thị Đông", "Thị Đường"]

DEPT_IDS = [1, 2, 3, 4, 5]
POS_IDS  = [1, 2, 3, 4, 5]

# Lương cơ bản theo PositionID
BASE_SALARY = {1: 35_000_000, 2: 22_000_000, 3: 13_000_000, 4: 7_000_000, 5: 18_000_000}

# 12 tháng seed
MONTHS = [
    (5, 2025), (6, 2025), (7, 2025), (8, 2025),
    (9, 2025), (10, 2025), (11, 2025), (12, 2025),
    (1, 2026), (2, 2026), (3, 2026), (4, 2026),
]

def make_name(gender, used_names):
    """Sinh tên không trùng"""
    for _ in range(200):
        ho = random.choice(HO)
        ten = random.choice(TEN_NAM if gender == "Male" else TEN_NU)
        name = f"{ho} {ten}"
        if name not in used_names:
            used_names.add(name)
            return name
    return f"Nhân Viên {random.randint(1000,9999)}"

def make_email(name, used_emails, idx):
    """Sinh email ASCII không trùng"""
    import unicodedata, re
    nfkd = unicodedata.normalize('NFKD', name.lower())
    ascii_name = ''.join(c for c in nfkd if not unicodedata.combining(c))
    ascii_name = re.sub(r'[^a-z0-9]', '', ascii_name.replace(' ', ''))
    email = f"{ascii_name}{idx}@company.vn"
    if email in used_emails:
        email = f"{ascii_name}{idx}_{random.randint(10,99)}@company.vn"
    used_emails.add(email)
    return email

def make_phone(idx):
    return f"090{idx:07d}"

def make_dob():
    year  = random.randint(1975, 2000)
    month = random.randint(1, 12)
    day   = random.randint(1, 28)
    return f"{year}-{month:02d}-{day:02d}"

def make_hire_date(dob_str):
    dob_year = int(dob_str[:4])
    hire_year = max(dob_year + 22, random.randint(2018, 2023))
    hire_month = random.randint(1, 12)
    hire_day   = random.randint(1, 28)
    return f"{hire_year}-{hire_month:02d}-{hire_day:02d}"

# ============================================================
# BƯỚC 1: THÊM 100 NHÂN VIÊN QUA API
# ============================================================

def seed_employees(n=100):
    print(f"\n{'='*55}")
    print(f"  BƯỚC 1: Thêm {n} nhân viên qua API POST /api/employees")
    print(f"{'='*55}")

    used_names  = set()
    used_emails = set()
    inserted    = []
    failed      = []

    # Phân bổ: 20 người/phòng, PositionID xoay vòng 1-5
    assignments = []
    statuses = (["Active"] * 16 + ["OnLeave"] * 2 + ["Inactive"] * 2)
    for dept in DEPT_IDS:
        random.shuffle(statuses)
        for i, pos in enumerate([1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5]):
            assignments.append((dept, pos, statuses[i % len(statuses)]))

    random.shuffle(assignments)

    for idx, (dept_id, pos_id, status) in enumerate(assignments[:n], start=1):
        gender = random.choice(["Male", "Female"])
        name   = make_name(gender, used_names)
        email  = make_email(name, used_emails, idx)
        phone  = make_phone(idx)
        dob    = make_dob()
        hire   = make_hire_date(dob)

        payload = {
            "FullName":     name,
            "DateOfBirth":  dob,
            "Gender":       gender,
            "PhoneNumber":  phone,
            "Email":        email,
            "HireDate":     hire,
            "DepartmentID": dept_id,
            "PositionID":   pos_id,
            "Status":       status,
        }

        try:
            r = requests.post(f"{API}/api/employees", json=payload, timeout=10)
            data = r.json()
            if data.get("status") == "success":
                emp_id = data["EmployeeID"]
                inserted.append({"EmployeeID": emp_id, "PositionID": pos_id,
                                  "Status": status, "DepartmentID": dept_id})
                print(f"  [{idx:3d}/100] ✓ ID={emp_id:4d}  {name[:25]:<25}  Dept={dept_id}  Pos={pos_id}  {status}")
            else:
                failed.append((idx, name, data.get("msg")))
                print(f"  [{idx:3d}/100] ✗ {name} — {data.get('msg')}")
        except Exception as e:
            failed.append((idx, name, str(e)))
            print(f"  [{idx:3d}/100] ✗ {name} — Lỗi kết nối: {e}")

        time.sleep(0.05)  # tránh quá tải server

    print(f"\n  Kết quả: {len(inserted)} thành công / {len(failed)} thất bại")
    if failed:
        print("  Thất bại:")
        for f in failed:
            print(f"    #{f[0]} {f[1]}: {f[2]}")

    return inserted

# ============================================================
# BƯỚC 2: INSERT LƯƠNG 12 THÁNG QUA API PUT /api/salary
# (Dùng endpoint tạo mới nếu có, hoặc insert trực tiếp MySQL)
# ============================================================

def seed_salaries_attendance(employees):
    """
    Insert lương + chấm công 12 tháng cho danh sách nhân viên vừa tạo.
    Gọi endpoint POST /api/payroll/seed (sẽ tạo ở backend).
    """
    print(f"\n{'='*55}")
    print(f"  BƯỚC 2: Seed lương + chấm công 12 tháng")
    print(f"{'='*55}")

    # Anomaly: 8% lương tăng đột biến, 5% vắng nhiều
    anomaly_salary = set(random.sample([e["EmployeeID"] for e in employees],
                                        max(1, len(employees) // 12)))
    anomaly_absent = set(random.sample([e["EmployeeID"] for e in employees],
                                        max(1, len(employees) // 18)))

    batch = []
    for emp in employees:
        emp_id = emp["EmployeeID"]
        pos_id = emp["PositionID"]
        status = emp["Status"]
        base   = BASE_SALARY.get(pos_id, 13_000_000)

        for m, y in MONTHS:
            # Inactive: dừng lương sau tháng 10/2025
            if status == "Inactive" and (y == 2026 or (y == 2025 and m > 10)):
                continue

            # Tính lương
            base_s = base + random.randint(-500_000, 500_000)

            # OnLeave từ 1/2026: giảm 30%
            if status == "OnLeave" and y == 2026:
                base_s = int(base_s * 0.7)

            # Anomaly lương tăng đột biến tháng 8/2025
            if emp_id in anomaly_salary and m == 8 and y == 2025:
                base_s = int(base_s * 2.5)

            bonus      = random.randint(0, int(base * 0.2))
            deductions = random.randint(int(base * 0.02), int(base * 0.08))

            # Anomaly khấu trừ > lương tháng 11/2025
            if emp_id in anomaly_absent and m == 11 and y == 2025:
                deductions = int(base_s * 1.1)

            # Chấm công
            if status == "OnLeave" and y == 2026:
                absent    = 0
                leave_d   = random.randint(10, 22)
                work_d    = max(0, 22 - leave_d)
            elif emp_id in anomaly_absent and m == 11 and y == 2025:
                absent    = random.randint(8, 12)
                leave_d   = 0
                work_d    = max(0, 22 - absent)
            else:
                absent    = random.randint(0, 2)
                leave_d   = random.randint(0, 2)
                work_d    = max(0, 22 - absent - leave_d)

            overtime = round(random.uniform(0, 16), 1)

            batch.append({
                "EmployeeID":      emp_id,
                "SalaryMonth":     f"{y}-{m:02d}-01",  # DATE format YYYY-MM-DD
                "AttendanceMonth": m,
                "AttendanceYear":  y,
                "BaseSalary":      base_s,
                "Bonus":           bonus,
                "Deductions":      deductions,
                "WorkDays":        work_d,
                "LeaveDays":       leave_d,
                "AbsentDays":      absent,
                "OvertimeHours":   overtime,
            })

    print(f"  Tổng bản ghi cần insert: {len(batch)} (lương + chấm công)")

    # Gọi endpoint batch seed
    try:
        r = requests.post(
            f"{API}/api/seed/payroll-attendance",
            json={"records": batch},
            timeout=120
        )
        data = r.json()
        if data.get("status") == "success":
            print(f"  ✓ Insert thành công: {data.get('inserted_salary')} lương, "
                  f"{data.get('inserted_attendance')} chấm công")
            print(f"  ✓ Anomaly lương: {len(anomaly_salary)} NV | Anomaly vắng: {len(anomaly_absent)} NV")
        else:
            print(f"  ✗ Lỗi: {data.get('msg')}")
    except Exception as e:
        print(f"  ✗ Lỗi kết nối: {e}")
        print("  → Hãy đảm bảo backend đang chạy và endpoint /api/seed/payroll-attendance tồn tại")

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  SEED DATA VIA API")
    print("  Backend:", API)
    print("="*55)

    # Kiểm tra backend có chạy không
    try:
        r = requests.get(f"{API}/api/departments", timeout=5)
        print(f"\n  ✓ Backend đang chạy (departments: {len(r.json())} phòng ban)")
    except Exception as e:
        print(f"\n  ✗ Không kết nối được backend: {e}")
        print("  → Hãy chạy backend trước: python main.py")
        sys.exit(1)

    # Bước 1: Thêm nhân viên
    employees = seed_employees(100)

    if not employees:
        print("\n  Không có nhân viên nào được thêm. Dừng lại.")
        sys.exit(1)

    # Bước 2: Seed lương + chấm công
    seed_salaries_attendance(employees)

    print("\n" + "="*55)
    print("  HOÀN TẤT SEED DATA")
    print(f"  {len(employees)} nhân viên đã được thêm vào cả 2 DB")
    print("="*55 + "\n")
