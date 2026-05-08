import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Building2, Briefcase,
  DollarSign, TrendingUp, TrendingDown, Award,
  RefreshCw, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

function InfoRow({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "10px 0",
                  borderBottom: "1px solid #f0f4f8" }}>
      <span style={{ fontSize: 13, color: "#8a94a6" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500,
                     color: bold ? "#1e2a3a" : "#374151" }}>{value}</span>
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

export default function SalaryDetail() {
  const { id } = useParams();
  const nav    = useNavigate();

  const [detail,  setDetail]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`http://localhost:5000/api/salary/${id}/details`).then((r) => r.json()),
      fetch(`http://localhost:5000/api/salary/${id}/history`).then((r) => r.json()),
    ])
      .then(([det, hist]) => {
        if (det.status === "success") setDetail(det.data);
        else setError(det.msg || "Không tìm thấy dữ liệu");
        setHistory(Array.isArray(hist) ? hist : []);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  /* Chart data – lịch sử lương */
  const chartData = [...history]
    .reverse()
    .map((h) => ({
      month: h.SalaryMonthStr
        ? new Date(h.SalaryMonthStr + "-01").toLocaleDateString("vi-VN", { month: "short", year: "2-digit" })
        : "—",
      base:  Number(h.BaseSalary || 0) / 1e6,
      bonus: Number(h.Bonus      || 0) / 1e6,
      net:   Number(h.NetSalary  || 0) / 1e6,
    }));

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", minHeight: 400, gap: 16 }}>
      <AlertCircle size={48} color="#ef4444" />
      <p style={{ color: "#ef4444", fontWeight: 600 }}>{error}</p>
      <button className="btn btn-primary btn-sm" onClick={load}>Thử lại</button>
    </div>
  );

  const d = detail || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => nav("/payroll")}
          style={{ border: "none", background: "#f4f6fb", borderRadius: 10,
                   padding: "8px 14px", cursor: "pointer", color: "#5a6478",
                   display: "flex", alignItems: "center", gap: 6,
                   fontWeight: 600, fontSize: 13 }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e2a3a" }}>
            Chi tiết lương
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "#8a94a6" }}>
            {loading ? "Đang tải..." : d.FullName}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ marginLeft: "auto", border: "1px solid #e8ecf0", background: "#fff",
                   borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                   color: "#5a6478", display: "flex", alignItems: "center",
                   gap: 6, fontSize: 13, fontWeight: 600 }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Làm mới
        </button>
      </div>

      <div className="row g-3">

        {/* ── Cột trái: Thông tin + Chi tiết lương ── */}
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
                {loading ? "?" : (d.FullName?.[0] || "?")}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1e2a3a" }}>
                  {loading ? "—" : d.FullName}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#8a94a6" }}>
                  ID #{id}
                </p>
              </div>
            </div>

            {loading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} style={{ height: 16, background: "#f0f4f8",
                                        borderRadius: 4, marginBottom: 10 }} />
                ))
              : (
                <>
                  <InfoRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><Building2 size={13} />Phòng ban</span>} value={d.DepartmentName || "—"} />
                  <InfoRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><Briefcase size={13} />Chức vụ</span>}   value={d.PositionName  || "—"} />
                  <InfoRow label={<span style={{ display: "flex", gap: 6, alignItems: "center" }}><User size={13} />Tháng lương</span>}
                    value={d.SalaryMonthStr
                      ? new Date(d.SalaryMonthStr + "-01").toLocaleDateString("vi-VN",
                          { month: "long", year: "numeric" })
                      : "—"} bold />
                </>
              )}
          </div>

          {/* Chi tiết lương */}
          <div className="content-card">
            <h5 style={{ margin: "0 0 4px" }}>Chi tiết lương</h5>
            {loading
              ? [...Array(5)].map((_, i) => (
                  <div key={i} style={{ height: 16, background: "#f0f4f8",
                                        borderRadius: 4, marginBottom: 10 }} />
                ))
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
            <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 12 }}>
              <h5 style={{ margin: 0 }}>Cổ tức</h5>
              {!loading && (
                <span style={{ background: "#fdf4ff", color: "#9333ea",
                               padding: "3px 10px", borderRadius: 20,
                               fontSize: 12, fontWeight: 700 }}>
                  {fmt(d.TotalDividends)}
                </span>
              )}
            </div>

            {loading
              ? <div style={{ height: 60, background: "#f0f4f8", borderRadius: 8 }} />
              : !d.Dividends?.length
                ? <p style={{ color: "#8a94a6", fontSize: 13, textAlign: "center",
                               padding: "16px 0" }}>Chưa có cổ tức</p>
                : d.Dividends.map((dv, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "8px 0",
                      borderBottom: i < d.Dividends.length - 1 ? "1px solid #f0f4f8" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Award size={14} color="#9333ea" />
                        <span style={{ fontSize: 12, color: "#5a6478" }}>
                          {dv.DividendDate || "—"}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#9333ea" }}>
                        {fmt(dv.DividendAmount)}
                      </span>
                    </div>
                  ))}
          </div>
        </div>

        {/* ── Cột phải: Biểu đồ + Lịch sử ── */}
        <div className="col-12 col-lg-8" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Biểu đồ lịch sử lương */}
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 16 }}>
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
                      formatter={(v, name) => [
                        `${v.toFixed(1)} tr`,
                        name === "net" ? "Thực nhận" : name === "base" ? "Lương CB" : "Thưởng",
                      ]}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e8ecf0",
                                      fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
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

          {/* Bảng lịch sử */}
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
                        <tr key={i}>
                          {[...Array(5)].map((_, j) => (
                            <td key={j}>
                              <div style={{ height: 14, background: "#f0f4f8", borderRadius: 4 }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : history.length === 0
                      ? <tr><td colSpan={5} style={{ textAlign: "center",
                                                      padding: "32px 0", color: "#8a94a6" }}>
                          Chưa có lịch sử
                        </td></tr>
                      : history.map((h, i) => (
                          <tr key={i} style={{
                            background: i === 0 ? "#fafbff" : "transparent",
                          }}>
                            <td>
                              <span style={{ fontWeight: i === 0 ? 700 : 500,
                                             color: i === 0 ? "#2563eb" : "#374151",
                                             fontSize: 13 }}>
                                {h.SalaryMonthStr
                                  ? new Date(h.SalaryMonthStr + "-01").toLocaleDateString("vi-VN",
                                      { month: "long", year: "numeric" })
                                  : "—"}
                              </span>
                              {i === 0 && (
                                <span style={{ marginLeft: 6, fontSize: 10, background: "#eff6ff",
                                               color: "#2563eb", padding: "1px 6px",
                                               borderRadius: 10, fontWeight: 700 }}>
                                  Mới nhất
                                </span>
                              )}
                            </td>
                            <td className="text-end" style={{ fontSize: 13 }}>
                              {fmt(h.BaseSalary)}
                            </td>
                            <td className="text-end">
                              <span style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
                                +{fmt(h.Bonus)}
                              </span>
                            </td>
                            <td className="text-end">
                              <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
                                -{fmt(h.Deductions)}
                              </span>
                            </td>
                            <td className="text-end">
                              <span style={{ fontWeight: 700, fontSize: 13,
                                             color: i === 0 ? "#2563eb" : "#1e2a3a" }}>
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
    </div>
  );
}
