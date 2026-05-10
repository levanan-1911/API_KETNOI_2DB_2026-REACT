/**
 * exportUtils.js
 * Tiện ích xuất Excel (.xlsx) và PDF cho bảng lương, chấm công, nhân sự.
 */
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ── Định dạng số tiền VNĐ ── */
const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n ?? 0)) + " đ";

/* ══════════════════════════════════════════════════════
   EXCEL EXPORT
   ══════════════════════════════════════════════════════ */

/**
 * Xuất bảng lương ra Excel
 * @param {Array}  rows     - Dữ liệu bảng lương
 * @param {string} month    - Tháng dạng "YYYY-MM"
 */
export function exportPayrollExcel(rows, month) {
  const title = `Bảng lương tháng ${month}`;

  const data = rows.map((r, i) => ({
    "STT":          i + 1,
    "Mã NV":        r.EmployeeID,
    "Họ và tên":    r.FullName,
    "Phòng ban":    r.DepartmentName || "",
    "Chức vụ":      r.PositionName   || "",
    "Lương CB (đ)": Number(r.BaseSalary  || 0),
    "Thưởng (đ)":   Number(r.Bonus       || 0),
    "Khấu trừ (đ)": Number(r.Deductions  || 0),
    "Thực nhận (đ)":Number(r.NetSalary   || 0),
  }));

  // Dòng tổng
  data.push({
    "STT":          "",
    "Mã NV":        "",
    "Họ và tên":    "TỔNG CỘNG",
    "Phòng ban":    "",
    "Chức vụ":      "",
    "Lương CB (đ)": rows.reduce((s, r) => s + Number(r.BaseSalary  || 0), 0),
    "Thưởng (đ)":   rows.reduce((s, r) => s + Number(r.Bonus       || 0), 0),
    "Khấu trừ (đ)": rows.reduce((s, r) => s + Number(r.Deductions  || 0), 0),
    "Thực nhận (đ)":rows.reduce((s, r) => s + Number(r.NetSalary   || 0), 0),
  });

  const ws = XLSX.utils.json_to_sheet(data);

  // Độ rộng cột
  ws["!cols"] = [
    { wch: 5 }, { wch: 8 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bảng lương");
  XLSX.writeFile(wb, `bang-luong-${month}.xlsx`);
}

/**
 * Xuất chấm công ra Excel
 */
export function exportAttendanceExcel(rows, month) {
  const data = rows.map((r, i) => ({
    "STT":            i + 1,
    "Mã NV":          r.EmployeeID,
    "Họ và tên":      r.FullName,
    "Phòng ban":      r.DepartmentName || "",
    "Ngày làm":       r.WorkDays,
    "Ngày nghỉ phép": r.LeaveDays,
    "Ngày vắng":      r.AbsentDays,
    "Giờ OT":         r.OvertimeHours,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 5 }, { wch: 8 }, { wch: 22 }, { wch: 18 },
    { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chấm công");
  XLSX.writeFile(wb, `cham-cong-${month}.xlsx`);
}

/**
 * Xuất danh sách nhân viên ra Excel
 */
export function exportEmployeesExcel(rows) {
  const data = rows.map((r, i) => ({
    "STT":        i + 1,
    "Mã NV":      r.EmployeeID,
    "Họ và tên":  r.FullName,
    "Giới tính":  r.Gender === "Male" ? "Nam" : r.Gender === "Female" ? "Nữ" : r.Gender || "",
    "Email":      r.Email,
    "Điện thoại": r.PhoneNumber || "",
    "Phòng ban":  r.Department  || "",
    "Chức vụ":    r.Position    || "",
    "Ngày vào":   r.HireDate    || "",
    "Trạng thái": r.Status      || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 5 }, { wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 28 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nhân viên");
  XLSX.writeFile(wb, `danh-sach-nhan-vien.xlsx`);
}

/* ══════════════════════════════════════════════════════
   PDF EXPORT
   ══════════════════════════════════════════════════════ */

/** Tạo header chung cho PDF */
function pdfHeader(doc, title, subtitle) {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(subtitle, 14, 25);
  doc.text(`Xuất lúc: ${new Date().toLocaleString("vi-VN")}`, 14, 31);
  doc.setTextColor(0);
}

/**
 * Xuất bảng lương ra PDF
 */
export function exportPayrollPDF(rows, month) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  pdfHeader(
    doc,
    `BANG LUONG THANG ${month}`,
    `Tong so: ${rows.length} nhan vien`
  );

  const totalNet = rows.reduce((s, r) => s + Number(r.NetSalary || 0), 0);

  const body = rows.map((r, i) => [
    i + 1,
    r.EmployeeID,
    r.FullName,
    r.DepartmentName || "—",
    r.PositionName   || "—",
    fmtVND(r.BaseSalary),
    fmtVND(r.Bonus),
    fmtVND(r.Deductions),
    fmtVND(r.NetSalary),
  ]);

  // Dòng tổng
  body.push([
    "", "", "TONG CONG", "", "",
    fmtVND(rows.reduce((s, r) => s + Number(r.BaseSalary  || 0), 0)),
    fmtVND(rows.reduce((s, r) => s + Number(r.Bonus       || 0), 0)),
    fmtVND(rows.reduce((s, r) => s + Number(r.Deductions  || 0), 0)),
    fmtVND(totalNet),
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["STT", "Ma NV", "Ho va ten", "Phong ban", "Chuc vu",
            "Luong CB", "Thuong", "Khau tru", "Thuc nhan"]],
    body,
    styles:     { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 14, halign: "center" },
      2: { cellWidth: 38 },
      3: { cellWidth: 30 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 24, halign: "right" },
      7: { cellWidth: 24, halign: "right" },
      8: { cellWidth: 28, halign: "right" },
    },
    didDrawRow: (data) => {
      // Tô màu dòng tổng
      if (data.row.index === body.length - 1) {
        doc.setFillColor(239, 246, 255);
      }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`bang-luong-${month}.pdf`);
}

/**
 * Xuất chấm công ra PDF
 */
export function exportAttendancePDF(rows, month) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  pdfHeader(
    doc,
    `CHAM CONG THANG ${month}`,
    `Tong so: ${rows.length} nhan vien`
  );

  const body = rows.map((r, i) => [
    i + 1,
    r.EmployeeID,
    r.FullName,
    r.DepartmentName || "—",
    r.WorkDays,
    r.LeaveDays,
    r.AbsentDays,
    r.OvertimeHours,
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["STT", "Ma NV", "Ho va ten", "Phong ban",
            "Ngay lam", "Nghi phep", "Vang mat", "Gio OT"]],
    body,
    styles:     { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: 22, halign: "center" },
      7: { cellWidth: 20, halign: "center" },
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });

  doc.save(`cham-cong-${month}.pdf`);
}

/**
 * Xuất danh sách nhân viên ra PDF
 */
export function exportEmployeesPDF(rows) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  pdfHeader(
    doc,
    "DANH SACH NHAN VIEN",
    `Tong so: ${rows.length} nhan vien`
  );

  const body = rows.map((r, i) => [
    i + 1,
    r.EmployeeID,
    r.FullName,
    r.Gender === "Male" ? "Nam" : r.Gender === "Female" ? "Nu" : r.Gender || "",
    r.Department  || "—",
    r.Position    || "—",
    r.HireDate    || "—",
    r.Status      || "—",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["STT", "Ma NV", "Ho va ten", "GT", "Phong ban", "Chuc vu", "Ngay vao", "Trang thai"]],
    body,
    styles:     { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [147, 51, 234], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 50 },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 38 },
      5: { cellWidth: 38 },
      6: { cellWidth: 24, halign: "center" },
      7: { cellWidth: 22, halign: "center" },
    },
    alternateRowStyles: { fillColor: [253, 244, 255] },
  });

  doc.save("danh-sach-nhan-vien.pdf");
}
