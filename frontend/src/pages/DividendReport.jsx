import { useEffect, useState } from "react";
import { Award, RefreshCw, TrendingUp, Users, DollarSign } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const fmtShort = (n) => {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  return new Intl.NumberFormat("vi-VN").format(n);
};

const COLORS = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];

export default function DividendReport() {
  const currentYear = new Date().getFullYear();
  const [year,    setYear]    = useState(String(currentYear));
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/reports/dividend?year=${year}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data || []);
        setTotal(res.GrandTotal || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [year]);

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  const maxAmt = data.length > 0 ? Math.max(...data.map((d) => d.TotalAmount)) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Báo cáo cổ tức</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Thống kê cổ tức nhân viên theo năm
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            className="form-select"
            style={{ width: "auto", fontSize: 13, borderRadius: 8 }}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
          <button onClick={load} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6,
                     background: "#f4f6fb", border: "1px solid #e8ecf0",
                     borderRadius: 8, color: "#5a6478", fontWeight: 600,
                     fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3">
        {[
          { label: "Tổng cổ tức",     value: loading ? "—" : fmtShort(total),      icon: DollarSign, bg: "#fdf4ff", color: "#9333ea" },
          { label: "Số nhân viên",     value: loading ? "—" : data.length + " NV",  icon: Users,      bg: "#eff6ff", color: "#2563eb" },
          { label: "TB mỗi nhân viên", value: loading || !data.length ? "—"
              : fmtShort(total / data.length),                                        icon: TrendingUp, bg: "#f0fdf4", color: "#16a34a" },
          { label: "Cao nhất",         value: loading || !data.length ? "—"
              : fmtShort(data[0]?.TotalAmount),                                       icon: Award,      bg: "#fffbeb", color: "#d97706" },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600,
                               textTransform: "uppercase", letterSpacing: "0.5px",
                               margin: "0 0 4px" }}>{c.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                    {c.value}
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

      {/* Table + Bar */}
      <div className="row g-3">

        {/* Bảng */}
        <div className="col-12 col-lg-7">
          <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0",
                          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h5 style={{ margin: 0 }}>Danh sách nhân viên nhận cổ tức</h5>
              <span style={{ fontSize: 12, color: "#8a94a6" }}>Năm {year}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Họ tên</th>
                    <th>Phòng ban</th>
                    <th>Chức vụ</th>
                    <th className="text-center">Số lần</th>
                    <th className="text-end">Tổng cổ tức</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(6)].map((_, j) => (
                            <td key={j}>
                              <div style={{ height: 14, background: "#f0f4f8", borderRadius: 4 }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: "center",
                                                      padding: "48px 0", color: "#8a94a6" }}>
                          Không có dữ liệu cổ tức năm {year}
                        </td></tr>
                      : data.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <span style={{
                                width: 24, height: 24, borderRadius: "50%",
                                background: COLORS[i % COLORS.length],
                                display: "inline-flex", alignItems: "center",
                                justifyContent: "center", color: "#fff",
                                fontSize: 11, fontWeight: 700,
                              }}>
                                {i + 1}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: "#1e2a3a" }}>
                              {row.FullName}
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: "#5a6478",
                                             background: "#f4f6fb", padding: "2px 8px",
                                             borderRadius: 6 }}>
                                {row.DepartmentName || "—"}
                              </span>
                            </td>
                            <td style={{ fontSize: 13, color: "#5a6478" }}>
                              {row.PositionName || "—"}
                            </td>
                            <td className="text-center">
                              <span style={{ background: "#eff6ff", color: "#2563eb",
                                             padding: "2px 10px", borderRadius: 20,
                                             fontSize: 12, fontWeight: 700 }}>
                                {row.TotalRecords}
                              </span>
                            </td>
                            <td className="text-end">
                              <span style={{ fontWeight: 700, fontSize: 13, color: "#9333ea" }}>
                                {fmt(row.TotalAmount)}
                              </span>
                            </td>
                          </tr>
                        ))}
                </tbody>
                {!loading && data.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc" }}>
                      <td colSpan={5} style={{ padding: "12px 16px",
                                               fontWeight: 700, color: "#5a6478", fontSize: 13 }}>
                        Tổng cộng
                      </td>
                      <td className="text-end" style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#fdf4ff", color: "#9333ea",
                                       padding: "4px 12px", borderRadius: 20,
                                       fontSize: 13, fontWeight: 800 }}>
                          {fmt(total)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Bar chart dạng horizontal */}
        <div className="col-12 col-lg-5">
          <div className="content-card">
            <h5 style={{ marginBottom: 16 }}>Top nhân viên nhận cổ tức</h5>
            {loading
              ? [...Array(5)].map((_, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ height: 12, background: "#f0f4f8", borderRadius: 4,
                                  marginBottom: 6, width: "60%" }} />
                    <div style={{ height: 20, background: "#f0f4f8", borderRadius: 6 }} />
                  </div>
                ))
              : data.slice(0, 8).map((row, i) => {
                  const pct = maxAmt > 0 ? (row.TotalAmount / maxAmt) * 100 : 0;
                  return (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                                    marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                          {row.FullName}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#9333ea" }}>
                          {fmtShort(row.TotalAmount)}
                        </span>
                      </div>
                      <div style={{ height: 8, background: "#f0f4f8", borderRadius: 4 }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: COLORS[i % COLORS.length],
                          borderRadius: 4,
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

      </div>
    </div>
  );
}
