import { useEffect, useState, useCallback } from "react";
import {
  Calculator, Users, DollarSign, TrendingUp, TrendingDown,
  RefreshCw, Save, Eye, X, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Info, FileText,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   CONSTANTS – Quy định Bảo hiểm & Thuế TNCN
   ══════════════════════════════════════════════════════════ */
const INSURANCE_RATES = { BHXH: 0.08, BHYT: 0.015, BHTN: 0.01 };
const PERSONAL_DEDUCTION   = 11_000_000;
const DEPENDENT_DEDUCTION  =  4_400_000;
const STANDARD_WORK_DAYS   = 26;
const HOURS_PER_DAY        = 8;

const TAX_BRACKETS = [
  { limit:  5_000_000, rate: 0.05 },
  { limit: 10_000_000, rate: 0.10 },
  { limit: 18_000_000, rate: 0.15 },
  { limit: 32_000_000, rate: 0.20 },
  { limit: 52_000_000, rate: 0.25 },
  { limit: 80_000_000, rate: 0.30 },
  { limit: Infinity,   rate: 0.35 },
];

/* ── Helpers ─────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const fmtShort = (n) => {
  if (!n || n === 0) return "0 ₫";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + " tỷ";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  return fmt(n);
};

/* ── Hàm tính thuế TNCN lũy tiến ────────────────────────── */
function calcPIT(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of TAX_BRACKETS) {
    if (taxableIncome <= prev) break;
    const slice = Math.min(taxableIncome - prev, limit - prev);
    tax += slice * rate;
    prev = limit;
    if (taxableIncome <= limit) break;
  }
  return tax;
}

/* ── Hàm tính lương cho 1 nhân viên ─────────────────────── */
function calcSalary(emp) {
  const base       = Number(emp.baseSalary   || 0);
  const workDays   = Number(emp.workDays     || STANDARD_WORK_DAYS);
  const stdDays    = Number(emp.stdDays      || STANDARD_WORK_DAYS);
  const otHours    = Number(emp.otHours      || 0);
  const otRate     = Number(emp.otRate       || 1.5);
  const bonus      = Number(emp.bonus        || 0);
  const allowance  = Number(emp.allowance    || 0);
  const dependents = Number(emp.dependents   || 0);

  // 1. Lương theo ngày công
  const actualBase = stdDays > 0 ? (base * workDays) / stdDays : base;

  // 2. Lương tăng ca
  const hourlyRate = stdDays > 0 ? base / (stdDays * HOURS_PER_DAY) : 0;
  const otPay      = hourlyRate * otHours * otRate;

  // 3. Tổng thu nhập
  const grossSalary = actualBase + otPay + bonus + allowance;

  // 4. Bảo hiểm (tính trên lương CB)
  const bhxh = base * INSURANCE_RATES.BHXH;
  const bhyt = base * INSURANCE_RATES.BHYT;
  const bhtn = base * INSURANCE_RATES.BHTN;
  const totalInsurance = bhxh + bhyt + bhtn;

  // 5. Thu nhập chịu thuế
  const taxableIncome = Math.max(
    0,
    grossSalary - totalInsurance - PERSONAL_DEDUCTION - dependents * DEPENDENT_DEDUCTION
  );

  // 6. Thuế TNCN
  const pit = calcPIT(taxableIncome);

  // 7. Thực nhận
  const netSalary = grossSalary - totalInsurance - pit;

  return {
    actualBase, otPay, grossSalary,
    bhxh, bhyt, bhtn, totalInsurance,
    taxableIncome, pit, netSalary,
  };
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton({ h = 20, w = "100%" }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

/* ── Số tiền có màu ─────────────────────────────────────── */
function MoneyCell({ value, positive, size = 13 }) {
  const color = positive ? "#16a34a" : "#dc2626";
  const sign  = positive ? "+" : "-";
  return (
    <span style={{ color, fontWeight: 600, fontSize: size }}>
      {sign}{fmt(Math.abs(value))}
    </span>
  );
}

/* ── Modal xem chi tiết tính lương 1 NV ─────────────────── */
function DetailModal({ emp, onClose }) {
  const r = calcSalary(emp);
  const rows = [
    { label: "Lương cơ bản",          value: emp.baseSalary,   color: "#1e2a3a" },
    { label: `Ngày công (${emp.workDays}/${emp.stdDays} ngày)`, value: r.actualBase, color: "#1e2a3a" },
    { label: `Tăng ca (${emp.otHours}h × ${emp.otRate}x)`,     value: r.otPay,      color: "#16a34a", sign: "+" },
    { label: "Thưởng",                value: emp.bonus,        color: "#16a34a", sign: "+" },
    { label: "Phụ cấp",               value: emp.allowance,    color: "#16a34a", sign: "+" },
    { label: "Tổng thu nhập",         value: r.grossSalary,    color: "#2563eb", bold: true, border: true },
    { label: "BHXH (8%)",             value: r.bhxh,           color: "#dc2626", sign: "-" },
    { label: "BHYT (1.5%)",           value: r.bhyt,           color: "#dc2626", sign: "-" },
    { label: "BHTN (1%)",             value: r.bhtn,           color: "#dc2626", sign: "-" },
    { label: "Thu nhập chịu thuế",    value: r.taxableIncome,  color: "#d97706" },
    { label: "Thuế TNCN",             value: r.pit,            color: "#dc2626", sign: "-" },
    { label: "THỰC NHẬN",             value: r.netSalary,      color: "#16a34a", bold: true, border: true, large: true },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e8ecf0",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexShrink: 0 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>
              Chi tiết tính lương
            </h5>
            <p style={{ margin: 0, fontSize: 13, color: "#8a94a6" }}>
              {emp.FullName} · {emp.Department || "—"}
            </p>
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "#f4f6fb", borderRadius: 8,
            padding: 6, cursor: "pointer", color: "#5a6478",
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 24px", overflowY: "auto" }}>
          {rows.map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0",
              borderTop: row.border ? "2px solid #e8ecf0" : "1px solid #f0f4f8",
              marginTop: row.border ? 4 : 0,
            }}>
              <span style={{ fontSize: 13, color: "#5a6478", fontWeight: row.bold ? 600 : 400 }}>
                {row.label}
              </span>
              <span style={{
                fontSize: row.large ? 18 : 13,
                fontWeight: row.bold ? 800 : 600,
                color: row.color,
              }}>
                {row.sign === "-" ? "-" : row.sign === "+" ? "+" : ""}
                {fmt(Math.abs(row.value ?? 0))}
              </span>
            </div>
          ))}

          {/* Biểu thuế */}
          <div style={{ marginTop: 16, background: "#f8fafc", borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#5a6478",
                        textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>
              Biểu thuế TNCN áp dụng
            </p>
            {TAX_BRACKETS.slice(0, 5).map((b, i) => {
              const prev = i === 0 ? 0 : TAX_BRACKETS[i - 1].limit;
              const inBracket = r.taxableIncome > prev;
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 11, padding: "3px 0",
                  color: inBracket ? "#2563eb" : "#8a94a6",
                  fontWeight: inBracket ? 600 : 400,
                }}>
                  <span>Bậc {i + 1}: {i === 0 ? "≤" : ">"} {fmtShort(prev)}</span>
                  <span>{(b.rate * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid #e8ecf0", flexShrink: 0 }}>
          <button onClick={onClose} className="btn btn-primary btn-sm"
            style={{ width: "100%" }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal xác nhận lưu ─────────────────────────────────── */
function ConfirmModal({ month, year, count, totalNet, onConfirm, onClose, saving }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: 28,
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#eff6ff", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 12px",
          }}>
            <Save size={24} color="#2563eb" />
          </div>
          <h5 style={{ margin: "0 0 6px", fontWeight: 700, color: "#1e2a3a" }}>
            Xác nhận lưu bảng lương
          </h5>
          <p style={{ fontSize: 13, color: "#8a94a6", margin: 0 }}>
            Tháng {month}/{year} · {count} nhân viên
          </p>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#5a6478" }}>Tổng nhân viên</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{count} người</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#5a6478" }}>Tổng quỹ lương</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{fmt(totalNet)}</span>
          </div>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a",
                      borderRadius: 8, padding: "10px 14px", marginBottom: 20,
                      display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "#92400e" }}>
            Nếu tháng này đã có dữ liệu lương, hệ thống sẽ cập nhật đè lên bản cũ.
          </span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} className="btn btn-sm"
            style={{ flex: 1, background: "#f4f6fb", border: "1px solid #e8ecf0",
                     color: "#5a6478", borderRadius: 8, fontWeight: 600, padding: "10px" }}>
            Hủy
          </button>
          <button onClick={onConfirm} disabled={saving} className="btn btn-primary btn-sm"
            style={{ flex: 2, display: "flex", alignItems: "center",
                     justifyContent: "center", gap: 8, padding: "10px" }}>
            {saving
              ? <><RefreshCw size={14} className="spin" /> Đang lưu...</>
              : <><Save size={14} /> Xác nhận lưu</>}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

/* ── localStorage helpers ───────────────────────────────── */
const STORAGE_KEY = (month, year) => `payroll_calc_${year}_${month}`;
const STORAGE_CONFIG_KEY = "payroll_calc_config";

function saveToStorage(month, year, rows) {
  try {
    // Chỉ lưu các trường editable, không lưu FullName/Department (lấy lại từ API)
    const editableFields = ["EmployeeID", "baseSalary", "workDays", "stdDays",
                            "otHours", "otRate", "bonus", "allowance", "dependents"];
    const slim = rows.map(r => Object.fromEntries(
      editableFields.map(k => [k, r[k]])
    ));
    localStorage.setItem(STORAGE_KEY(month, year), JSON.stringify(slim));
  } catch {}
}

function loadFromStorage(month, year) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(month, year));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveConfigToStorage(config) {
  try { localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config)); } catch {}
}

function loadConfigFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function PayrollCalc() {
  const now = new Date();

  // Khôi phục config từ localStorage
  const savedConfig = loadConfigFromStorage();

  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [employees,  setEmployees]  = useState([]);
  const [calcRows,   setCalcRows]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [detailEmp,  setDetailEmp]  = useState(null);
  const [showConfirm,setShowConfirm]= useState(false);
  const [toast,      setToast]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [stdDays,    setStdDays]    = useState(savedConfig?.stdDays ?? STANDARD_WORK_DAYS);
  const [hasDraft,   setHasDraft]   = useState(false);  // có bản nháp chưa lưu DB

  /* ── Load nhân viên + chấm công ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        fetch("http://localhost:5000/api/employees").then(r => r.json()),
        fetch(`http://localhost:5000/api/attendance?month=${year}-${String(month).padStart(2,"0")}`).then(r => r.json()),
      ]);

      const attMap = {};
      if (Array.isArray(attRes)) {
        attRes.forEach(a => { attMap[a.EmployeeID] = a; });
      }

      // Lấy bản nháp đã lưu (nếu có)
      const draft = loadFromStorage(month, year);
      const draftMap = {};
      if (draft) {
        draft.forEach(d => { draftMap[d.EmployeeID] = d; });
        setHasDraft(true);
      } else {
        setHasDraft(false);
      }

      const rows = empRes.map(emp => {
        const att  = attMap[emp.EmployeeID];
        const saved = draftMap[emp.EmployeeID];
        return {
          EmployeeID: emp.EmployeeID,
          FullName:   emp.FullName,
          Department: emp.Department,
          Position:   emp.Position,
          // Ưu tiên: bản nháp localStorage > chấm công API > mặc định
          baseSalary: saved?.baseSalary  ?? 0,
          workDays:   saved?.workDays    ?? (att?.WorkDays      ?? stdDays),
          stdDays:    saved?.stdDays     ?? stdDays,
          otHours:    saved?.otHours     ?? (att?.OvertimeHours ?? 0),
          otRate:     saved?.otRate      ?? 1.5,
          bonus:      saved?.bonus       ?? 0,
          allowance:  saved?.allowance   ?? 0,
          dependents: saved?.dependents  ?? 0,
        };
      });
      setEmployees(empRes);
      setCalcRows(rows);
    } catch (e) {
      showToast("Lỗi tải dữ liệu: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [month, year, stdDays]);

  useEffect(() => { loadData(); }, [month, year]);

  /* ── Auto-save calcRows vào localStorage khi thay đổi ── */
  useEffect(() => {
    if (calcRows.length === 0) return;
    saveToStorage(month, year, calcRows);
    setHasDraft(true);
  }, [calcRows, month, year]);

  /* ── Lưu config khi stdDays thay đổi ── */
  useEffect(() => {
    saveConfigToStorage({ stdDays });
  }, [stdDays]);

  /* ── Cập nhật 1 ô trong bảng ── */
  const updateRow = (idx, field, value) => {
    setCalcRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  /* ── Lưu bảng lương vào DB ── */
  const handleSave = async () => {
    setSaving(true);
    const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;
    let ok = 0, fail = 0;

    for (const emp of filtered) {
      const r = calcSalary(emp);
      try {
        // Kiểm tra đã có SalaryID chưa
        const checkRes = await fetch(
          `http://localhost:5000/api/salary/${emp.EmployeeID}/details?month=${year}-${String(month).padStart(2,"0")}`
        ).then(r => r.json());

        if (checkRes.status === "success" && checkRes.data?.SalaryID) {
          // UPDATE
          await fetch(`http://localhost:5000/api/salary/${checkRes.data.SalaryID}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              BaseSalary: Math.round(r.actualBase),
              Bonus:      Math.round(emp.bonus + emp.allowance + r.otPay),
              Deductions: Math.round(r.totalInsurance + r.pit),
            }),
          });
        } else {
          // INSERT
          await fetch("http://localhost:5000/api/payroll/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              EmployeeID: emp.EmployeeID,
              SalaryMonth: monthStr,
              BaseSalary:  Math.round(r.actualBase),
              Bonus:       Math.round(emp.bonus + emp.allowance + r.otPay),
              Deductions:  Math.round(r.totalInsurance + r.pit),
              NetSalary:   Math.round(r.netSalary),
            }),
          });
        }
        ok++;
      } catch { fail++; }
    }

    setSaving(false);
    setShowConfirm(false);
    if (fail === 0) {
      // Xóa bản nháp sau khi lưu DB thành công
      localStorage.removeItem(STORAGE_KEY(month, year));
      setHasDraft(false);
    }
    showToast(
      fail === 0
        ? `Đã lưu thành công ${ok} bản ghi lương!`
        : `Lưu ${ok} thành công, ${fail} thất bại`,
      fail === 0 ? "success" : "error"
    );
  };

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Filter ── */
  const filtered = calcRows.filter(r =>
    r.FullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.Department?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Summary ── */
  const summary = filtered.reduce((acc, emp) => {
    const r = calcSalary(emp);
    acc.gross    += r.grossSalary;
    acc.insurance+= r.totalInsurance;
    acc.pit      += r.pit;
    acc.net      += r.netSalary;
    return acc;
  }, { gross: 0, insurance: 0, pit: 0, net: 0 });

  const years = [2024, 2025, 2026, 2027];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  /* ══ JSX ══ */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "success" ? "#16a34a" : "#dc2626",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          fontSize: 14, fontWeight: 600, animation: "slideUp 0.3s ease",
        }}>
          {toast.type === "success"
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Tính lương</h3>
            {hasDraft && (
              <span style={{
                background: "#fffbeb", color: "#d97706",
                border: "1px solid #fde68a",
                padding: "3px 10px", borderRadius: 20,
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                ● Có bản nháp chưa lưu DB
              </span>
            )}
          </div>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Tính toán lương theo ngày công, bảo hiểm và thuế TNCN
            {hasDraft && " · Dữ liệu đã nhập được khôi phục tự động"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Chọn tháng */}
          <select className="form-select" style={{ width: "auto", fontSize: 13 }}
            value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map(m => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          {/* Chọn năm */}
          <select className="form-select" style={{ width: "auto", fontSize: 13 }}
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Cấu hình */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{ display: "flex", alignItems: "center", gap: 6,
                     background: showConfig ? "#eff6ff" : "#f4f6fb",
                     border: `1px solid ${showConfig ? "#bfdbfe" : "#e8ecf0"}`,
                     borderRadius: 8, color: showConfig ? "#2563eb" : "#5a6478",
                     fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
            <Info size={14} />
            Cấu hình
            {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {/* Làm mới */}
          <button onClick={loadData} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6,
                     background: "#f4f6fb", border: "1px solid #e8ecf0",
                     borderRadius: 8, color: "#5a6478", fontWeight: 600,
                     fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Làm mới
          </button>
          {/* Xóa nháp */}
          {hasDraft && (
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY(month, year));
                setHasDraft(false);
                loadData();
              }}
              style={{ display: "flex", alignItems: "center", gap: 6,
                       background: "#fef2f2", border: "1px solid #fecaca",
                       borderRadius: 8, color: "#dc2626", fontWeight: 600,
                       fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
              <X size={14} /> Xóa nháp
            </button>
          )}
          {/* Lưu */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading || filtered.length === 0}
            className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px" }}>
            <Save size={14} /> Lưu bảng lương
          </button>
        </div>
      </div>

      {/* ── Cấu hình mở rộng ── */}
      {showConfig && (
        <div className="content-card" style={{ padding: 20 }}>
          <h5 style={{ margin: "0 0 16px", fontSize: 14 }}>
            Cấu hình tính lương tháng {month}/{year}
          </h5>
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <label className="form-label">Ngày công chuẩn</label>
              <input type="number" className="form-control" value={stdDays}
                onChange={e => setStdDays(Number(e.target.value))}
                min={20} max={31} />
            </div>
            <div className="col-12 col-md-9">
              <label className="form-label">Quy định bảo hiểm (cố định)</label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8 }}>
                {[
                  { label: "BHXH", value: "8%" },
                  { label: "BHYT", value: "1.5%" },
                  { label: "BHTN", value: "1%" },
                  { label: "Giảm trừ bản thân", value: "11 tr/tháng" },
                  { label: "Giảm trừ người phụ thuộc", value: "4.4 tr/người" },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: "#f4f6fb", border: "1px solid #e8ecf0",
                    borderRadius: 8, padding: "6px 12px", fontSize: 12,
                  }}>
                    <span style={{ color: "#8a94a6" }}>{item.label}: </span>
                    <span style={{ fontWeight: 700, color: "#2563eb" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="row g-3">
        {[
          { label: "Nhân viên",       value: filtered.length + " người", icon: Users,       bg: "#eff6ff", color: "#2563eb" },
          { label: "Tổng thu nhập",   value: fmtShort(summary.gross),    icon: TrendingUp,  bg: "#f0fdf4", color: "#16a34a" },
          { label: "Bảo hiểm + Thuế", value: fmtShort(summary.insurance + summary.pit), icon: TrendingDown, bg: "#fef2f2", color: "#dc2626" },
          { label: "Tổng thực nhận",  value: fmtShort(summary.net),      icon: DollarSign,  bg: "#fdf4ff", color: "#9333ea" },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600,
                               textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>
                    {c.label}
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                    {loading ? "—" : c.value}
                  </p>
                </div>
                <div className="stat-icon" style={{ background: c.bg }}>
                  <c.icon size={20} color={c.color} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bảng tính lương ── */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0",
                      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calculator size={16} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1e2a3a" }}>
              Bảng tính lương tháng {month}/{year}
            </span>
          </div>
          <input className="form-control"
            placeholder="Tìm theo tên, phòng ban..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 240, fontSize: 13, marginLeft: "auto" }} />
          <span style={{ fontSize: 13, color: "#8a94a6" }}>{filtered.length} nhân viên</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="table table-custom mb-0" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>Nhân viên</th>
                <th className="text-end" style={{ minWidth: 130 }}>Lương CB (VNĐ)</th>
                <th className="text-center" style={{ minWidth: 90 }}>Ngày công</th>
                <th className="text-center" style={{ minWidth: 80 }}>Tăng ca (h)</th>
                <th className="text-end" style={{ minWidth: 110 }}>Thưởng (VNĐ)</th>
                <th className="text-end" style={{ minWidth: 110 }}>Phụ cấp (VNĐ)</th>
                <th className="text-center" style={{ minWidth: 70 }}>Phụ thuộc</th>
                <th className="text-end" style={{ minWidth: 120 }}>Tổng thu nhập</th>
                <th className="text-end" style={{ minWidth: 110 }}>BH + Thuế</th>
                <th className="text-end" style={{ minWidth: 130 }}>Thực nhận</th>
                <th className="text-center" style={{ minWidth: 80 }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(11)].map((_, j) => (
                        <td key={j}><Skeleton h={14} /></td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "48px 0",
                                                color: "#8a94a6", fontSize: 14 }}>
                        Không có dữ liệu nhân viên
                      </td>
                    </tr>
                  )
                  : filtered.map((emp, idx) => {
                      const realIdx = calcRows.findIndex(r => r.EmployeeID === emp.EmployeeID);
                      const r = calcSalary(emp);
                      return (
                        <tr key={emp.EmployeeID}>
                          {/* Nhân viên */}
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1e2a3a" }}>
                              {emp.FullName}
                            </div>
                            <div style={{ fontSize: 11, color: "#8a94a6" }}>
                              {emp.Department || "—"}
                            </div>
                          </td>

                          {/* Lương CB */}
                          <td>
                            <input type="number" className="form-control"
                              value={emp.baseSalary}
                              onChange={e => updateRow(realIdx, "baseSalary", Number(e.target.value))}
                              style={{ textAlign: "right", fontSize: 12, padding: "4px 8px",
                                       minWidth: 110 }}
                              min={0} step={500000} />
                          </td>

                          {/* Ngày công */}
                          <td>
                            <input type="number" className="form-control"
                              value={emp.workDays}
                              onChange={e => updateRow(realIdx, "workDays", Number(e.target.value))}
                              style={{ textAlign: "center", fontSize: 12, padding: "4px 8px" }}
                              min={0} max={31} />
                          </td>

                          {/* Tăng ca */}
                          <td>
                            <input type="number" className="form-control"
                              value={emp.otHours}
                              onChange={e => updateRow(realIdx, "otHours", Number(e.target.value))}
                              style={{ textAlign: "center", fontSize: 12, padding: "4px 8px" }}
                              min={0} step={0.5} />
                          </td>

                          {/* Thưởng */}
                          <td>
                            <input type="number" className="form-control"
                              value={emp.bonus}
                              onChange={e => updateRow(realIdx, "bonus", Number(e.target.value))}
                              style={{ textAlign: "right", fontSize: 12, padding: "4px 8px" }}
                              min={0} step={100000} />
                          </td>

                          {/* Phụ cấp */}
                          <td>
                            <input type="number" className="form-control"
                              value={emp.allowance}
                              onChange={e => updateRow(realIdx, "allowance", Number(e.target.value))}
                              style={{ textAlign: "right", fontSize: 12, padding: "4px 8px" }}
                              min={0} step={100000} />
                          </td>

                          {/* Người phụ thuộc */}
                          <td>
                            <input type="number" className="form-control"
                              value={emp.dependents}
                              onChange={e => updateRow(realIdx, "dependents", Number(e.target.value))}
                              style={{ textAlign: "center", fontSize: 12, padding: "4px 8px" }}
                              min={0} max={10} />
                          </td>

                          {/* Tổng thu nhập (readonly) */}
                          <td className="text-end">
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>
                              {fmt(r.grossSalary)}
                            </span>
                          </td>

                          {/* BH + Thuế (readonly) */}
                          <td className="text-end">
                            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                              -{fmt(r.totalInsurance + r.pit)}
                            </span>
                          </td>

                          {/* Thực nhận (readonly) */}
                          <td className="text-end">
                            <span style={{
                              background: r.netSalary >= 15e6 ? "#f0fdf4" : r.netSalary >= 10e6 ? "#fffbeb" : "#fef2f2",
                              color:      r.netSalary >= 15e6 ? "#16a34a" : r.netSalary >= 10e6 ? "#d97706" : "#dc2626",
                              padding: "3px 10px", borderRadius: 20,
                              fontSize: 12, fontWeight: 800,
                            }}>
                              {fmt(r.netSalary)}
                            </span>
                          </td>

                          {/* Chi tiết */}
                          <td className="text-center">
                            <button
                              onClick={() => setDetailEmp(emp)}
                              style={{ border: "none", background: "#eff6ff", color: "#2563eb",
                                       borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                       display: "inline-flex", alignItems: "center", gap: 4,
                                       fontSize: 12, fontWeight: 600 }}>
                              <Eye size={13} /> Xem
                            </button>
                          </td>
                        </tr>
                      );
                    })}
            </tbody>

            {/* Footer tổng */}
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={7} style={{ padding: "12px 16px", color: "#5a6478",
                                           fontSize: 13, fontWeight: 700 }}>
                    Tổng cộng ({filtered.length} NV)
                  </td>
                  <td className="text-end" style={{ padding: "12px 16px", color: "#2563eb", fontSize: 13 }}>
                    {fmt(summary.gross)}
                  </td>
                  <td className="text-end" style={{ padding: "12px 16px", color: "#dc2626", fontSize: 13 }}>
                    -{fmt(summary.insurance + summary.pit)}
                  </td>
                  <td className="text-end" style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#eff6ff", color: "#2563eb",
                                   padding: "4px 12px", borderRadius: 20,
                                   fontSize: 13, fontWeight: 800 }}>
                      {fmt(summary.net)}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Ghi chú biểu thuế ── */}
      <div className="content-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <FileText size={16} color="#5a6478" />
          <h5 style={{ margin: 0, fontSize: 14 }}>Biểu thuế TNCN lũy tiến (2024)</h5>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TAX_BRACKETS.map((b, i) => {
            const prev = i === 0 ? 0 : TAX_BRACKETS[i - 1].limit;
            const label = b.limit === Infinity
              ? `> ${fmtShort(prev)}`
              : i === 0 ? `≤ ${fmtShort(b.limit)}`
              : `${fmtShort(prev)} – ${fmtShort(b.limit)}`;
            return (
              <div key={i} style={{
                background: "#f8fafc", border: "1px solid #e8ecf0",
                borderRadius: 8, padding: "8px 14px", textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#8a94a6", marginBottom: 2 }}>Bậc {i + 1}</div>
                <div style={{ fontSize: 11, color: "#5a6478", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2563eb" }}>
                  {(b.rate * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {detailEmp && (
        <DetailModal emp={detailEmp} onClose={() => setDetailEmp(null)} />
      )}
      {showConfirm && (
        <ConfirmModal
          month={month} year={year}
          count={filtered.length}
          totalNet={summary.net}
          onConfirm={handleSave}
          onClose={() => setShowConfirm(false)}
          saving={saving}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
