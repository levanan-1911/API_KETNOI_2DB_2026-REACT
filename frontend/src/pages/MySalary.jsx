/**
 * MySalary.jsx — Trang xem lương của chính mình (dành cho Employee)
 * Tự động lấy EmployeeID từ AuthContext, không cần truyền qua URL
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, TrendingUp, TrendingDown, Award,
  RefreshCw, AlertCircle, Building2, Briefcase, User,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";

const API = "http://localhost:5000";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

function InfoRow({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "10px 0",
                  borderBottom: "1px solid #f0f4f8" }}>
      <span style={{ fontSize: 13, color: "#8a94a6" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500,
                     color: bold ? "#1e2a3a" : "#374151" }}>{value || "—"}</span>
    </div>
  );
}

function SalaryRow({ label, value, color, prefix = "", size = 14, borderTop }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 0",
      borderTop: borderTop ? "2px solid #e8ecf0" : "1px solid #f0f4f8",
    }}>
      <span style={{ fontSize: 13, color: "#5a6478" }}>{label}</span>
      <span style={{ fontSize: size, fontWeight: borderTop ? 800 : 600, color }}>
        {prefix}{fmt(value)}
      </span>
    </div>
  );
}

function Skeleton({ h = 16, w = "100%" }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

export default function MySalary() {
  const { user } = useAuth();
  const nav = useNavigate();

  // EmployeeID được lưu trong user object khi đăng nhập
  // Nếu chưa có (tài khoản chưa liên kết nhân viên) thì hiện thông báo
  const empId = user?.employeeId || user?.employee_id || user?.EmployeeID;

  const [detail,  setDetail]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = () => {
    if (!empId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/api/salary/${empId}/details`).then(r => r.json()),
      fetch(`${API}/api/salary/${empId}/history`).then(r => r.json()),
    ])
      .then(([det, hist]) => {
        if (det.status === "success") setDetail(det.data);
        else setError(det.msg || "Không tìm thấy dữ liệu lương");
        setHistory(Array.isArray(hist) ? hist : []);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [empId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Chart data */
  const chartData = [...history].reverse().map(h => ({
    month: h.SalaryMonthStr
      ? new Date(h.SalaryMonthStr + "-01").toLocaleDateString("vi-VN", { month: "short", year: "2-digit" })
      : "—",
    base:  Number(h.BaseSalary || 0) / 1e6,
    net:   Number(h.NetSalary  || 0) / 1e6,
  }));

  /* Không có EmployeeID liên kết */
  if (!loading && !empId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", minHeight: 400, gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>💼</div>
        <h4 style={{ color: "#1e2a3a", fontWeight: 700, margin: 0 }}>
          Tài khoản chưa liên kết nhân viên
        </h4>
        <p style={{ color: "#8a94a6", fontSize: 13, margin: 0, maxWidth: 320 }}>
          Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên.
          Vui lòng liên hệ quản trị viên để được hỗ trợ.
        </p>
      </div>
    );
  }

  /* Lỗi */
  if (!loading && error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", minHeight: 400, gap: 16 }}>
        <AlertCircle size={48} color="#ef4444" />
        <p style={{ color: "#ef4444", fontWeight: 600 }}>{error}</p>
        <button className="btn btn-primary btn-sm" onClick={load}>Thử lại</button>
      </div>
    );
  }

  const d = detail || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Lương của tôi</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Thông tin lương và lịch sử thanh toán của bạn
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6,
                   background: "#f4f6fb", border: "1px solid #e8ecf0",
                   borderRadius: 8, color: "#5a6478", fontWeight: 600,
                   fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          Làm mới
        </button>
      </div>

      <div className="row g-3">

        {/* Cột trái */}
        <div className="col-12 col-lg-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Thông tin nhân viên */}
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 18, fontWeight: 800, flexShrink: 0,
              }}>
                {(user?.fullName || "?")[0]}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1e2a3a" }}>
                  {user?.fullName || "—"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#8a94a6" }}>
                  Mã NV #{empId}
                </p>
              </div>
            </div>
            {loading
              ? [...Array(3)].map((_, i) => <div key={i} style={{ height: 16, background: "#f0f4f8", borderRadius: 4, marginBottom: 10 }} />)
              : (
                <>
                  <InfoRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><Building2 size={13} />Phòng ban</span>} value={d.DepartmentName} />
                  <InfoRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><Briefcase size={13} />Chức vụ</span>} value={d.PositionName} />
                  <InfoRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><User size={13} />Tháng lương</span>}
                    value={d.SalaryMonthStr
                      ? new Date(d.SalaryMonthStr + "-01").toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
                      : "—"} bold />
                </>
              )}
          </div>

          {/* Chi tiết lương tháng */}
          <div className="content-card">
            <h5 style={{ margin: "0 0 4px" }}>Chi tiết lương tháng này</h5>
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} style={{ height: 16, background: "#f0f4f8", borderRadius: 4, marginBottom: 10 }} />)
              : (
                <>
                  <SalaryRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><DollarSign size={13} />Lương cơ bản</span>}
                    value={d.BaseSalary} color="#1e2a3a" />
                  <SalaryRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><TrendingUp size={13} />Thưởng</span>}
                    value={d.Bonus} color="#16a34a" prefix="+" />
                  <SalaryRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><TrendingDown size={13} />Khấu trừ</span>}
                    value={d.Deductions} color="#dc2626" prefix="-" />
                  <SalaryRow label="Thực nhận" value={d.NetSalary}
                    color="#2563eb" size={16} borderTop />
                </>
              )}
          </div>

          {/* Cổ tức */}
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h5 style={{ margin: 0 }}>Cổ tức</h5>
              {!loading && (
                <span style={{ background: "#fdf4ff", color: "#9333ea",
                               padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {fmt(d.TotalDividends)}
                </span>
              )}
            </div>
            {loading
              ? <div style={{ height: 60, background: "#f0f4f8", borderRadius: 8 }} />
              : !d.Dividends?.length
                ? <p style={{ color: "#8a94a6", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Chưa có cổ tức</p>
                : d.Dividends.map((dv, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between",
                                          alignItems: "center", padding: "8px 0",
                                          borderBottom: i < d.Dividends.length - 1 ? "1px solid #f0f4f8" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Award size={14} color="#9333ea" />
                        <span style={{ fontSize: 12, color: "#5a6478" }}>{dv.DividendDate || "—"}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#9333ea" }}>
                        {fmt(dv.DividendAmount)}
                      </span>
                    </div>
                  ))}
          </div>
        </div>

        {/* Cột phải */}
        <div className="col-12 col-lg-8" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Biểu đồ */}
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h5 style={{ margin: 0 }}>Biến động lương</h5>
              <span style={{ fontSize: 11, color: "#8a94a6", background: "#f4f6fb",
                             padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                Triệu VNĐ
              </span>
            </div>
            {loading || chartData.length === 0
              ? <div style={{ height: 220, background: "#f8fafc", borderRadius: 10,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#8a94a6", fontSize: 13 }}>
                  {loading ? "Đang tải..." : "Chưa có lịch sử"}
                </div>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8a94a6" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#8a94a6" }} />
                    <Tooltip
                      formatter={(v, name) => [`${v.toFixed(1)} tr`, name === "net" ? "Thực nhận" : "Lương CB"]}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e8ecf0", fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="base" name="base"
                      stroke="#22c55e" fill="url(#gBase)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="net" name="net"
                      stroke="#3b82f6" fill="url(#gNet)" strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
          </div>

          {/* Lịch sử lương */}
          <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0" }}>
              <h5 style={{ margin: 0 }}>Lịch sử lương</h5>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th className="text-end">Lương CB</th>
                    <th className="text-end">Thưởng</th>
                    <th className="text-end">Khấu trừ</th>
                    <th className="text-end">Thực nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(4)].map((_, i) => (
                        <tr key={i}>{[...Array(5)].map((_, j) => (
                          <td key={j}><Skeleton h={14} /></td>
                        ))}</tr>
                      ))
                    : history.length === 0
                      ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "#8a94a6" }}>
                          Chưa có lịch sử lương
                        </td></tr>
                      : history.map((h, i) => (
                          <tr key={i} style={{ background: i === 0 ? "#fafbff" : "transparent" }}>
                            <td>
                              <span style={{ fontWeight: i === 0 ? 700 : 500,
                                             color: i === 0 ? "#2563eb" : "#374151", fontSize: 13 }}>
                                {h.SalaryMonthStr
                                  ? new Date(h.SalaryMonthStr + "-01").toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
                                  : "—"}
                              </span>
                              {i === 0 && (
                                <span style={{ marginLeft: 6, fontSize: 10, background: "#eff6ff",
                                               color: "#2563eb", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
                                  Mới nhất
                                </span>
                              )}
                            </td>
                            <td className="text-end" style={{ fontSize: 13 }}>{fmt(h.BaseSalary)}</td>
                            <td className="text-end">
                              <span style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>+{fmt(h.Bonus)}</span>
                            </td>
                            <td className="text-end">
                              <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>-{fmt(h.Deductions)}</span>
                            </td>
                            <td className="text-end">
                              <span style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? "#2563eb" : "#1e2a3a" }}>
                                {fmt(h.NetSalary)}
                              </span>
                            </td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
