/**
 * exportUtils.js
 * Tiện ích xuất Excel (.xlsx) và PDF cho bảng lương, chấm công, nhân sự.
 * PDF dùng html2canvas để giữ nguyên font tiếng Việt.
 */
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
   PDF EXPORT — dùng html2canvas để giữ font tiếng Việt
   ══════════════════════════════════════════════════════ */

/**
 * Tạo HTML table string từ headers + rows
 */
function buildHtmlTable(title, subtitle, headers, rows, footerRow = null) {
  const thStyle = `
    background:#2563eb; color:#fff; padding:8px 10px;
    font-size:12px; font-weight:700; text-align:left;
    border:1px solid #1d4ed8;
  `;
  const tdStyle = `
    padding:7px 10px; font-size:11px; color:#1e2a3a;
    border:1px solid #e8ecf0; vertical-align:middle;
  `;
  const tdAltStyle = tdStyle + "background:#f8fafc;";
  const tfStyle = `
    padding:8px 10px; font-size:12px; font-weight:700;
    color:#1e2a3a; border:1px solid #d1d5db;
    background:#eff6ff;
  `;

  const headerHtml = headers.map(h => `<th style="${thStyle}">${h}</th>`).join("");

  const bodyHtml = rows.map((row, ri) => {
    const style = ri % 2 === 0 ? tdStyle : tdAltStyle;
    const cells = row.map(cell => `<td style="${style}">${cell ?? ""}</td>`).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  const footerHtml = footerRow
    ? `<tfoot><tr>${footerRow.map(c => `<td style="${tfStyle}">${c ?? ""}</td>`).join("")}</tr></tfoot>`
    : "";

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif; padding:24px; background:#fff; min-width:900px;">
      <h2 style="margin:0 0 4px; font-size:18px; color:#1e2a3a;">${title}</h2>
      <p style="margin:0 0 2px; font-size:12px; color:#5a6478;">${subtitle}</p>
      <p style="margin:0 0 16px; font-size:11px; color:#8a94a6;">
        Xuất lúc: ${new Date().toLocaleString("vi-VN")}
      </p>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
        ${footerHtml}
      </table>
    </div>
  `;
}

/**
 * Render HTML string → canvas → PDF và tải về
 */
async function htmlToPDF(htmlStr, filename) {
  // Tạo container ẩn
  const container = document.createElement("div");
  container.style.cssText = `
    position:fixed; left:-9999px; top:0;
    width:1100px; background:#fff; z-index:-1;
  `;
  container.innerHTML = htmlStr;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgW    = canvas.width;
    const imgH    = canvas.height;

    // A4 landscape: 297 × 210 mm
    const pdfW = 297;
    const pdfH = Math.round((imgH / imgW) * pdfW);

    const pdf = new jsPDF({
      orientation: pdfH > pdfW ? "portrait" : "landscape",
      unit: "mm",
      format: pdfH > pdfW ? [210, pdfH] : [pdfW, pdfH],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Xuất bảng lương ra PDF
 */
export async function exportPayrollPDF(rows, month) {
  const fmtVND2 = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n ?? 0)) + " đ";
  const totalBase = rows.reduce((s, r) => s + Number(r.BaseSalary  || 0), 0);
  const totalBonus= rows.reduce((s, r) => s + Number(r.Bonus       || 0), 0);
  const totalDed  = rows.reduce((s, r) => s + Number(r.Deductions  || 0), 0);
  const totalNet  = rows.reduce((s, r) => s + Number(r.NetSalary   || 0), 0);

  const headers = ["STT", "Mã NV", "Họ và tên", "Phòng ban", "Chức vụ",
                   "Lương CB", "Thưởng", "Khấu trừ", "Thực nhận"];
  const body = rows.map((r, i) => [
    i + 1, r.EmployeeID, r.FullName, r.DepartmentName || "—", r.PositionName || "—",
    fmtVND2(r.BaseSalary), fmtVND2(r.Bonus), fmtVND2(r.Deductions), fmtVND2(r.NetSalary),
  ]);
  const footer = ["", "", "TỔNG CỘNG", "", "",
    fmtVND2(totalBase), fmtVND2(totalBonus), fmtVND2(totalDed), fmtVND2(totalNet)];

  const html = buildHtmlTable(
    `BẢNG LƯƠNG THÁNG ${month}`,
    `Tổng số: ${rows.length} nhân viên`,
    headers, body, footer
  );
  await htmlToPDF(html, `bang-luong-${month}.pdf`);
}

/**
 * Xuất chấm công ra PDF
 */
export async function exportAttendancePDF(rows, month) {
  const headers = ["STT", "Mã NV", "Họ và tên", "Phòng ban",
                   "Ngày làm", "Nghỉ phép", "Vắng mặt", "Giờ OT"];
  const body = rows.map((r, i) => [
    i + 1, r.EmployeeID, r.FullName, r.DepartmentName || "—",
    r.WorkDays, r.LeaveDays, r.AbsentDays, r.OvertimeHours,
  ]);
  const html = buildHtmlTable(
    `CHẤM CÔNG THÁNG ${month}`,
    `Tổng số: ${rows.length} nhân viên`,
    headers, body
  );
  await htmlToPDF(html, `cham-cong-${month}.pdf`);
}

/**
 * Xuất danh sách nhân viên ra PDF
 */
export async function exportEmployeesPDF(rows) {
  const headers = ["STT", "Mã NV", "Họ và tên", "GT", "Phòng ban",
                   "Chức vụ", "Ngày vào", "Trạng thái"];
  const statusLabel = (s) => {
    if (s === "Active")   return "Đang làm";
    if (s === "Inactive") return "Đã nghỉ";
    if (s === "OnLeave")  return "Nghỉ phép";
    return s || "—";
  };
  const body = rows.map((r, i) => [
    i + 1, r.EmployeeID, r.FullName,
    r.Gender === "Male" ? "Nam" : r.Gender === "Female" ? "Nữ" : r.Gender || "",
    r.Department || "—", r.Position || "—",
    r.HireDate || "—", statusLabel(r.Status),
  ]);
  const html = buildHtmlTable(
    "DANH SÁCH NHÂN VIÊN",
    `Tổng số: ${rows.length} nhân viên`,
    headers, body
  );
  await htmlToPDF(html, "danh-sach-nhan-vien.pdf");
}
