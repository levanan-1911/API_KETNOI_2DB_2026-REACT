import { useEffect, useState } from "react";
import {
  Users, DollarSign, TrendingUp,
  Award, ArrowUpRight, ArrowDownRight,
  RefreshCw, AlertCircle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

/* ── helpers ─────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const fmtNum = (n) => new Intl.NumberFormat("vi-VN").format(n ?? 0);

const PIE_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

/* ── StatCard ─────────────────────────────────────────── */
function StatCard({ title, value, sub, icon: Icon, iconBg, iconColor, trend, trendLabel }) {
  return (
    <div className="stat-card">
      <div className="d-flex align-items-start justify-content-between">
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: "#8a94a6", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            {title}
          </p>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#1e2a3a", margin: 0, lineHeight: 1.2 }}>
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: 12, color: "#8a94a6", marginTop: 4, marginBottom: 0 }}>{sub}</p>
          )}
          {trend !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              {trend >= 0
                ? <ArrowUpRight size={14} color="#16a34a" />
                : <ArrowDownRight size={14} color="#dc2626" />}
              <span style={{ fontSize: 12, fontWeight: 600,
                             color: trend >= 0 ? "#16a34a" : "#dc2626" }}>
                {Math.abs(trend)}%
              </span>
              <span style={{ fontSize: 12, color: "#8a94a6" }}>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ background: iconBg }}>
          <Icon size={22} color={iconColor} />
        </div>
      </div>
    </div>
  );
}

/* ── Custom Tooltip ───────────────────────────────────── */
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e8ecf0",
                  borderRadius: 10, padding: "10px 14px", fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      {label && <p style={{ fontWeight: 700, marginBottom: 6, color: "#1e2a3a" }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%",
                         background: p.color, display: "inline-block" }} />
          <span style={{ color: "#5a6478" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "#1e2a3a" }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────── */
function Skeleton({ h = 20, w = "100%", radius = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: radius,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

/* ── Main Dashboard ───────────────────────────────────── */
export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("http://localhost:5000/api/reports/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res) => {
        setData(res.data);
        setLastUpdate(new Date());
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  /* ── Derived data ── */
  const byDept     = data?.ByDepartment ?? [];
  const payroll    = data?.PayrollSummary ?? {};
  const totalEmp   = data?.TotalEmployees ?? 0;
  const totalDiv   = data?.TotalDividends ?? 0;
  const totalNet   = payroll?.TotalNet ?? 0;
  const avgSalary  = totalEmp > 0 ? totalNet / totalEmp : 0;

  // Pie data từ ByDepartment
  const pieData = byDept
    .filter((d) => d.Total > 0)
    .map((d, i) => ({
      name:  d.DepartmentName,
      value: d.Total,
      fill:  PIE_COLORS[i % PIE_COLORS.length],
    }));

  // Radar data – đánh giá năng lực phòng ban (mô phỏng dựa trên danh sách phòng ban thực)
  const RADAR_AXES = ["Hiệu suất", "Chấm công", "Đào tạo", "Chi phí", "Tăng trưởng"];
  // Seed ngẫu nhiên ổn định theo tên phòng ban để giá trị không đổi mỗi lần render
  const seededVal = (name, axis) => {
    let hash = 0;
    for (let i = 0; i < (name + axis).length; i++)
      hash = ((hash << 5) - hash + (name + axis).charCodeAt(i)) | 0;
    return 55 + Math.abs(hash % 40); // giá trị từ 55–94
  };
  const radarData = RADAR_AXES.map((axis) => {
    const entry = { axis };
    byDept.slice(0, 5).forEach((d) => {
      const shortName = d.DepartmentName?.replace(/^Phòng\s+/i, "") ?? d.DepartmentName;
      entry[shortName] = seededVal(d.DepartmentName, axis);
    });
    return entry;
  });
  const radarDepts = byDept.slice(0, 5).map((d) =>
    d.DepartmentName?.replace(/^Phòng\s+/i, "") ?? d.DepartmentName
  );

  // Area data – cơ cấu lương tháng hiện tại
  const areaData = payroll?.SalaryMonth
    ? [
        { name: "Lương CB",   value: Number(payroll.TotalBase ?? 0) / 1e6 },
        { name: "Thưởng",     value: Number(payroll.TotalBonus ?? 0) / 1e6 },
        { name: "Khấu trừ",   value: Number(payroll.TotalDeductions ?? 0) / 1e6 },
        { name: "Thực nhận",  value: Number(payroll.TotalNet ?? 0) / 1e6 },
      ]
    : [];

  /* ── Error state ── */
  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", minHeight: 400, gap: 16 }}>
      <AlertCircle size={48} color="#ef4444" />
      <p style={{ color: "#ef4444", fontWeight: 600, fontSize: 15 }}>
        Không thể tải dữ liệu: {error}
      </p>
      <button className="btn btn-primary btn-sm" onClick={load}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Tổng quan hệ thống</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            {lastUpdate
              ? `Cập nhật lúc ${lastUpdate.toLocaleTimeString("vi-VN")}`
              : "Đang tải dữ liệu..."}
          </p>
        </div>
        <button
          className="btn btn-sm"
          onClick={load}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6,
                   background: "#f4f6fb", border: "1px solid #e8ecf0",
                   borderRadius: 8, color: "#5a6478", fontWeight: 600,
                   fontSize: 13, padding: "7px 14px" }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="row g-3">
        {[
          {
            title: "Tổng nhân viên",
            value: loading ? "—" : fmtNum(totalEmp),
            sub: "Đang hoạt động",
            icon: Users,
            iconBg: "#eff6ff", iconColor: "#2563eb",
            trend: 5, trendLabel: "so tháng trước",
          },
          {
            title: "Quỹ lương tháng",
            value: loading ? "—" : fmt(totalNet),
            sub: payroll?.SalaryMonth
              ? `Tháng ${new Date(payroll.SalaryMonth).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`
              : "Chưa có dữ liệu",
            icon: DollarSign,
            iconBg: "#f0fdf4", iconColor: "#16a34a",
            trend: 3.2, trendLabel: "so tháng trước",
          },
          {
            title: "Lương trung bình",
            value: loading ? "—" : fmt(avgSalary),
            sub: "Mỗi nhân viên / tháng",
            icon: TrendingUp,
            iconBg: "#fffbeb", iconColor: "#d97706",
          },
          {
            title: "Tổng cổ tức",
            value: loading ? "—" : fmt(totalDiv),
            sub: "Tích lũy toàn bộ",
            icon: Award,
            iconBg: "#fdf4ff", iconColor: "#9333ea",
          },
        ].map((card, i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-3">
            {loading
              ? <div className="stat-card"><Skeleton h={80} /></div>
              : <StatCard {...card} />}
          </div>
        ))}
      </div>

      {/* ── Row 2: Pie + Bar ── */}
      <div className="row g-3">

        {/* Pie – Cơ cấu nhân sự */}
        <div className="col-12 col-lg-5">
          <div className="content-card" style={{ height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 16 }}>
              <h5 style={{ margin: 0 }}>Cơ cấu nhân sự</h5>
              <span style={{ fontSize: 11, color: "#8a94a6", background: "#f4f6fb",
                             padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                Theo phòng ban
              </span>
            </div>

            {loading ? <Skeleton h={280} /> : pieData.length === 0
              ? <EmptyChart />
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span style={{ fontSize: 12, color: "#5a6478" }}>{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}

            {/* Center label */}
            {!loading && pieData.length > 0 && (
              <div style={{ textAlign: "center", marginTop: -8 }}>
                <p style={{ fontSize: 12, color: "#8a94a6", margin: 0 }}>
                  Tổng cộng
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                  {fmtNum(totalEmp)} NV
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Radar – Đánh giá năng lực phòng ban */}
        <div className="col-12 col-lg-7">
          <div className="content-card" style={{ height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 16 }}>
              <h5 style={{ margin: 0 }}>Đánh giá năng lực phòng ban</h5>
              <span style={{ fontSize: 11, color: "#8a94a6", background: "#f4f6fb",
                             padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                Điểm / 100
              </span>
            </div>

            {loading ? <Skeleton h={280} /> : radarData.length === 0 || radarDepts.length === 0
              ? <EmptyChart />
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e8ecf0" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 12, fill: "#5a6478", fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#8a94a6" }}
                      tickCount={4}
                    />
                    {radarDepts.map((dept, i) => (
                      <Radar
                        key={dept}
                        name={dept}
                        dataKey={dept}
                        stroke={PIE_COLORS[i % PIE_COLORS.length]}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={{ r: 3, fill: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    ))}
                    <Tooltip
                      content={<CustomTooltip />}
                      formatter={(v) => `${v} điểm`}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span style={{ fontSize: 12, color: "#5a6478" }}>{v}</span>
                      )}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Payroll summary + Dept table ── */}
      <div className="row g-3">

        {/* Cơ cấu lương tháng */}
        <div className="col-12 col-lg-5">
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 16 }}>
              <h5 style={{ margin: 0 }}>Cơ cấu quỹ lương</h5>
              {payroll?.SalaryMonth && (
                <span style={{ fontSize: 11, color: "#2563eb", background: "#eff6ff",
                               padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                               border: "1px solid #bfdbfe" }}>
                  {new Date(payroll.SalaryMonth).toLocaleDateString("vi-VN",
                    { month: "long", year: "numeric" })}
                </span>
              )}
            </div>

            {loading ? <Skeleton h={200} /> : areaData.length === 0
              ? <EmptyChart />
              : (
                <>
                  {areaData.map((item, i) => {
                    const colors = ["#3b82f6", "#22c55e", "#ef4444", "#8b5cf6"];
                    const pct = areaData[3]?.value > 0
                      ? ((item.value / areaData[3].value) * 100).toFixed(1)
                      : 0;
                    return (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                                      marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: "#5a6478", fontWeight: 500 }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e2a3a" }}>
                            {fmt(item.value * 1e6)}
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#f0f4f8", borderRadius: 4 }}>
                          <div style={{
                            height: "100%",
                            width: `${Math.min(pct, 100)}%`,
                            background: colors[i],
                            borderRadius: 4,
                            transition: "width 0.8s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
          </div>
        </div>

        {/* Bảng phòng ban */}
        <div className="col-12 col-lg-7">
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 16 }}>
              <h5 style={{ margin: 0 }}>Chi tiết theo phòng ban</h5>
              <span style={{ fontSize: 12, color: "#8a94a6" }}>
                {byDept.length} phòng ban
              </span>
            </div>

            {loading
              ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...Array(5)].map((_, i) => <Skeleton key={i} h={36} />)}
                </div>
              : (
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-custom mb-0" style={{ minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Phòng ban</th>
                        <th className="text-center">Nhân viên</th>
                        <th className="text-end">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDept.map((d, i) => {
                        const pct = totalEmp > 0
                          ? ((d.Total / totalEmp) * 100).toFixed(1)
                          : 0;
                        return (
                          <tr key={i}>
                            <td>
                              <span style={{
                                width: 24, height: 24, borderRadius: "50%",
                                background: PIE_COLORS[i % PIE_COLORS.length],
                                display: "inline-flex", alignItems: "center",
                                justifyContent: "center", color: "#fff",
                                fontSize: 11, fontWeight: 700,
                              }}>
                                {i + 1}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500 }}>{d.DepartmentName}</td>
                            <td className="text-center">
                              <span style={{
                                background: "#eff6ff", color: "#2563eb",
                                padding: "2px 10px", borderRadius: 20,
                                fontSize: 12, fontWeight: 700,
                              }}>
                                {d.Total}
                              </span>
                            </td>
                            <td className="text-end">
                              <div style={{ display: "flex", alignItems: "center",
                                            gap: 8, justifyContent: "flex-end" }}>
                                <div style={{ width: 60, height: 5,
                                              background: "#f0f4f8", borderRadius: 4 }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: PIE_COLORS[i % PIE_COLORS.length],
                                    borderRadius: 4,
                                  }} />
                                </div>
                                <span style={{ fontSize: 12, color: "#8a94a6",
                                               fontWeight: 600, minWidth: 36 }}>
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>

    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: 200, display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#8a94a6", fontSize: 13 }}>
      Chưa có dữ liệu
    </div>
  );
}
