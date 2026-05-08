// eslint-disable-next-line unicode-bom
import { useEffect, useState, useCallback } from "react";
import {
  Building2, Award, Users, DollarSign,
  RefreshCw, Search, ChevronRight, AlertCircle,
  X, Mail, Phone, Calendar, Briefcase,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const fmtShort = (n) => {
  if (!n) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  return new Intl.NumberFormat("vi-VN").format(n);
};

const DEPT_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", icon: "#2563eb", accent: "#3b82f6" },
  { bg: "#f0fdf4", border: "#bbf7d0", icon: "#16a34a", accent: "#22c55e" },
  { bg: "#fffbeb", border: "#fde68a", icon: "#d97706", accent: "#f59e0b" },
  { bg: "#fdf4ff", border: "#e9d5ff", icon: "#9333ea", accent: "#a855f7" },
  { bg: "#fff1f2", border: "#fecdd3", icon: "#e11d48", accent: "#f43f5e" },
  { bg: "#f0fdfa", border: "#99f6e4", icon: "#0d9488", accent: "#14b8a6" },
];

/* ── Skeleton ─────────────────────────────────────────── */
function Skeleton({ h = 20, w = "100%", radius = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: radius,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

/* ── Department Card ──────────────────────────────────── */
function DeptCard({ dept, idx, totalEmp, onViewEmployees }) {
  const c   = DEPT_COLORS[idx % DEPT_COLORS.length];
  const pct = totalEmp > 0 ? Math.round((dept.TotalEmployees / totalEmp) * 100) : 0;

  return (
    <div style={{
      background: "#fff", border: `1px solid ${c.border}`,
      borderRadius: 16, padding: 24, position: "relative",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s, transform 0.2s",
      display: "flex", flexDirection: "column", gap: 0,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon + tên */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: c.bg, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
          border: `1px solid ${c.border}`,
        }}>
          <Building2 size={22} color={c.icon} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h5 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700,
                       color: "#1e2a3a", lineHeight: 1.3 }}>
            {dept.DepartmentName}
          </h5>
          <p style={{ margin: 0, fontSize: 12, color: "#8a94a6", lineHeight: 1.4 }}>
            {dept.Description || "Chưa có mô tả"}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f0f4f8", margin: "0 0 14px" }} />

      {/* Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Trưởng phòng */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: c.bg, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <Users size={13} color={c.icon} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#8a94a6", fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Trưởng phòng
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2a3a" }}>
              {dept.Manager}
            </div>
          </div>
        </div>

        {/* Nhân viên + lương TB */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            flex: 1, background: c.bg, borderRadius: 10,
            padding: "10px 12px", border: `1px solid ${c.border}`,
          }}>
            <div style={{ fontSize: 10, color: "#8a94a6", fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>
              Nhân viên
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.icon }}>
              {dept.TotalEmployees}
            </div>
          </div>
          <div style={{
            flex: 1, background: "#f8fafc", borderRadius: 10,
            padding: "10px 12px", border: "1px solid #e8ecf0",
          }}>
            <div style={{ fontSize: 10, color: "#8a94a6", fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>
              Lương TB
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2a3a" }}>
              {dept.AvgSalary > 0 ? fmtShort(dept.AvgSalary) : "—"}
            </div>
          </div>
        </div>

        {/* Progress bar tỷ lệ nhân sự */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between",
                        marginBottom: 5, fontSize: 11, color: "#8a94a6" }}>
            <span>Tỷ lệ nhân sự</span>
            <span style={{ fontWeight: 700, color: c.icon }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "#f0f4f8", borderRadius: 4 }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: `linear-gradient(90deg, ${c.icon}, ${c.accent})`,
              borderRadius: 4, transition: "width 0.8s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Nút xem nhân viên */}
      <button
        onClick={() => onViewEmployees(dept)}
        style={{
          marginTop: 16, width: "100%",
          background: c.bg, border: `1px solid ${c.border}`,
          borderRadius: 10, padding: "9px 0",
          color: c.icon, fontWeight: 700, fontSize: 13,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = c.border; }}
        onMouseLeave={e => { e.currentTarget.style.background = c.bg; }}
      >
        <Users size={14} />
        Xem {dept.TotalEmployees} nhân viên
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ── Position Level Badge ─────────────────────────────── */
const LEVEL_MAP = {
  1: { label: "Cấp 1 – Giám đốc",        color: "#9333ea", bg: "#fdf4ff" },
  2: { label: "Cấp 2 – Trưởng phòng",    color: "#2563eb", bg: "#eff6ff" },
  3: { label: "Cấp 3 – Nhân viên",        color: "#16a34a", bg: "#f0fdf4" },
  4: { label: "Cấp 4 – Thực tập sinh",   color: "#d97706", bg: "#fffbeb" },
  5: { label: "Cấp 5 – Kỹ sư",           color: "#0d9488", bg: "#f0fdfa" },
};

function LevelBadge({ level }) {
  const l = LEVEL_MAP[level] || { label: `Cấp ${level}`, color: "#5a6478", bg: "#f4f6fb" };
  return (
    <span style={{
      background: l.bg, color: l.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      border: `1px solid ${l.color}30`,
    }}>
      {l.label}
    </span>
  );
}

/* ── Dept Employees Drawer ────────────────────────────── */
function DeptDrawer({ dept, colorIdx, onClose }) {
  const [emps,    setEmps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const c = DEPT_COLORS[colorIdx % DEPT_COLORS.length];

  useEffect(() => {
    if (!dept) return;
    setLoading(true);
    setSearch("");
    fetch(`http://localhost:5000/api/departments/${dept.DepartmentID}/employees`)
      .then(r => r.json())
      .then(res => { setEmps(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dept]);

  const filtered = emps.filter(e =>
    e.FullName.toLowerCase().includes(search.toLowerCase()) ||
    e.PositionName.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => s === "Active"
    ? { bg: "#dcfce7", color: "#16a34a" }
    : { bg: "#fee2e2", color: "#dc2626" };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          zIndex: 200, animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(520px, 95vw)",
        background: "#fff", zIndex: 201,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.25s ease",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #e8ecf0",
          background: c.bg, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "#fff", border: `1px solid ${c.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Building2 size={20} color={c.icon} />
              </div>
              <div>
                <h5 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a", fontSize: 16 }}>
                  {dept.DepartmentName}
                </h5>
                <p style={{ margin: 0, fontSize: 12, color: "#8a94a6" }}>
                  {loading ? "Đang tải..." : `${emps.length} nhân viên`}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              border: "none", background: "rgba(0,0,0,0.06)",
              borderRadius: 8, padding: 8, cursor: "pointer", color: "#5a6478",
              display: "flex", alignItems: "center",
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Stats mini */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Trưởng phòng", value: dept.Manager },
              { label: "Lương TB",     value: dept.AvgSalary > 0 ? fmtShort(dept.AvgSalary) : "—" },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: "#fff", borderRadius: 8,
                padding: "8px 12px", border: `1px solid ${c.border}`,
              }}>
                <div style={{ fontSize: 10, color: "#8a94a6", fontWeight: 600,
                              textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2a3a", marginTop: 2 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #f0f4f8", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#f4f6fb", border: "1px solid #e8ecf0",
            borderRadius: 8, padding: "8px 12px",
          }}>
            <Search size={14} color="#8a94a6" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, chức vụ..."
              style={{ border: "none", background: "transparent", outline: "none",
                       fontSize: 13, color: "#1e2a3a", flex: 1 }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ border: "none", background: "none", cursor: "pointer",
                         color: "#8a94a6", padding: 0, display: "flex" }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Employee list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  background: "#f8fafc", borderRadius: 12, padding: 16,
                  display: "flex", gap: 12, alignItems: "center",
                }}>
                  <Skeleton h={40} w={40} radius="50%" />
                  <div style={{ flex: 1 }}>
                    <Skeleton h={14} w="60%" />
                    <Skeleton h={11} w="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
              {search ? "Không tìm thấy nhân viên" : "Phòng ban chưa có nhân viên"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((emp, i) => {
                const sc = statusColor(emp.Status);
                const initials = emp.FullName.split(" ").slice(-2)
                  .map(w => w[0]).join("").toUpperCase();
                return (
                  <div key={emp.EmployeeID} style={{
                    background: "#f8fafc", border: "1px solid #e8ecf0",
                    borderRadius: 12, padding: "14px 16px",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = c.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c.icon}, ${c.accent})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 13, fontWeight: 800, flexShrink: 0,
                    }}>
                      {initials}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center",
                                    justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e2a3a" }}>
                          {emp.FullName}
                        </span>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          padding: "2px 8px", borderRadius: 20,
                          fontSize: 10, fontWeight: 700,
                        }}>
                          {emp.Status === "Active" ? "Đang làm" : emp.Status}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6,
                                    marginBottom: 6 }}>
                        <Briefcase size={11} color="#8a94a6" />
                        <span style={{ fontSize: 12, color: "#5a6478" }}>
                          {emp.PositionName}
                        </span>
                        <span style={{ color: "#d1d5db" }}>·</span>
                        <span style={{ fontSize: 12, color: "#8a94a6" }}>
                          {emp.Gender || "—"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                        {emp.Email && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Mail size={11} color="#8a94a6" />
                            <span style={{ fontSize: 11, color: "#8a94a6" }}>{emp.Email}</span>
                          </div>
                        )}
                        {emp.PhoneNumber && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={11} color="#8a94a6" />
                            <span style={{ fontSize: 11, color: "#8a94a6" }}>{emp.PhoneNumber}</span>
                          </div>
                        )}
                        {emp.HireDate && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Calendar size={11} color="#8a94a6" />
                            <span style={{ fontSize: 11, color: "#8a94a6" }}>
                              {new Date(emp.HireDate).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lương */}
                      {emp.NetSalary > 0 && (
                        <div style={{
                          marginTop: 8, background: "#fff",
                          border: `1px solid ${c.border}`, borderRadius: 8,
                          padding: "6px 10px", display: "inline-flex",
                          alignItems: "center", gap: 6,
                        }}>
                          <DollarSign size={11} color={c.icon} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.icon }}>
                            {fmt(emp.NetSalary)}
                          </span>
                          <span style={{ fontSize: 10, color: "#8a94a6" }}>/ tháng</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px", borderTop: "1px solid #e8ecf0",
          flexShrink: 0, fontSize: 12, color: "#8a94a6",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>
            {loading ? "Đang tải..." : `Hiển thị ${filtered.length}/${emps.length} nhân viên`}
          </span>
          <button onClick={onClose} className="btn btn-sm"
            style={{ background: "#f4f6fb", border: "1px solid #e8ecf0",
                     color: "#5a6478", borderRadius: 8, fontWeight: 600 }}>
            Đóng
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function Departments() {
  const [activeTab,  setActiveTab]  = useState("dept");
  const [depts,      setDepts]      = useState([]);
  const [positions,  setPositions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [selectedDept, setSelectedDept] = useState(null);  // drawer state

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, pRes] = await Promise.all([
        fetch("http://localhost:5000/api/departments/stats").then(r => r.json()),
        fetch("http://localhost:5000/api/positions/stats").then(r => r.json()),
      ]);
      if (dRes.status === "success") setDepts(dRes.data);
      if (pRes.status === "success") setPositions(pRes.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalEmp = depts.reduce((s, d) => s + d.TotalEmployees, 0);

  const filteredDepts = depts.filter(d =>
    d.DepartmentName.toLowerCase().includes(search.toLowerCase()) ||
    (d.Manager || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredPos = positions.filter(p =>
    p.PositionName.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Summary stats ── */
  const summaryDept = [
    { label: "Phòng ban",    value: depts.length,    icon: Building2, bg: "#eff6ff", color: "#2563eb" },
    { label: "Tổng nhân viên", value: totalEmp,      icon: Users,     bg: "#f0fdf4", color: "#16a34a" },
    { label: "Chức vụ",      value: positions.length, icon: Award,    bg: "#fdf4ff", color: "#9333ea" },
    {
      label: "Lương TB toàn cty",
      value: fmtShort(
        depts.length > 0
          ? depts.reduce((s, d) => s + d.AvgSalary * d.TotalEmployees, 0) / (totalEmp || 1)
          : 0
      ),
      icon: DollarSign, bg: "#fffbeb", color: "#d97706",
    },
  ];

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", minHeight: 400, gap: 16 }}>
      <AlertCircle size={48} color="#ef4444" />
      <p style={{ color: "#ef4444", fontWeight: 600 }}>{error}</p>
      <button className="btn btn-primary btn-sm" onClick={load}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Phòng ban &amp; Chức vụ</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Cơ cấu tổ chức từ hệ thống HUMAN_2025
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#f4f6fb", border: "1px solid #e8ecf0",
            borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#8a94a6",
          }}>
            <Search size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === "dept" ? "Tìm phòng ban..." : "Tìm chức vụ..."}
              style={{ border: "none", background: "transparent", outline: "none",
                       fontSize: 13, color: "#1e2a3a", width: 180 }}
            />
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
      </div>

      {/* ── Summary cards ── */}
      <div className="row g-3">
        {summaryDept.map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600,
                               textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>
                    {c.label}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
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

      {/* ── Tab bar ── */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{
          display: "flex", borderBottom: "1px solid #e8ecf0",
          padding: "0 20px",
        }}>
          {[
            { id: "dept", label: "Phòng ban", icon: Building2, count: depts.length },
            { id: "pos",  label: "Chức vụ",   icon: Award,     count: positions.length },
          ].map(tab => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 16px", background: "none", border: "none",
                  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                  color: active ? "#2563eb" : "#5a6478",
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  cursor: "pointer", marginBottom: -1,
                  transition: "all 0.15s",
                }}>
                <Icon size={16} />
                {tab.label}
                <span style={{
                  background: active ? "#eff6ff" : "#f4f6fb",
                  color: active ? "#2563eb" : "#8a94a6",
                  padding: "1px 8px", borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab: Phòng ban ── */}
        {activeTab === "dept" && (
          <div style={{ padding: 24 }}>
            {loading ? (
              <div className="row g-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="col-12 col-md-6 col-xl-4">
                    <div style={{ background: "#fff", border: "1px solid #e8ecf0",
                                  borderRadius: 16, padding: 24 }}>
                      <Skeleton h={48} w={48} radius={14} />
                      <div style={{ marginTop: 14 }}>
                        <Skeleton h={18} w="60%" />
                        <Skeleton h={12} w="80%" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDepts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
                Không tìm thấy phòng ban
              </div>
            ) : (
              <div className="row g-3">
                {filteredDepts.map((dept, i) => (
                  <div key={dept.DepartmentID} className="col-12 col-md-6 col-xl-4">
                    <DeptCard
                      dept={dept} idx={i} totalEmp={totalEmp}
                      onViewEmployees={(d) => setSelectedDept({ dept: d, idx: i })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Chức vụ ── */}
        {activeTab === "pos" && (
          <div style={{ overflowX: "auto" }}>
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Chức vụ</th>
                  <th>Cấp bậc</th>
                  <th className="text-center">Số NV</th>
                  <th className="text-end">Lương TB</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(5)].map((_, j) => (
                          <td key={j}><Skeleton h={14} /></td>
                        ))}
                      </tr>
                    ))
                  : filteredPos.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center",
                                                  padding: "48px 0", color: "#8a94a6" }}>
                          Không tìm thấy chức vụ
                        </td>
                      </tr>
                    )
                    : filteredPos.map((pos) => (
                        <tr key={pos.PositionID}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: LEVEL_MAP[pos.Level]?.bg || "#f4f6fb",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <Award size={15}
                                  color={LEVEL_MAP[pos.Level]?.color || "#5a6478"} />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 14, color: "#1e2a3a" }}>
                                {pos.PositionName}
                              </span>
                            </div>
                          </td>
                          <td>
                            <LevelBadge level={pos.Level} />
                          </td>
                          <td className="text-center">
                            <span style={{
                              background: "#eff6ff", color: "#2563eb",
                              padding: "2px 10px", borderRadius: 20,
                              fontSize: 12, fontWeight: 700,
                            }}>
                              {pos.TotalEmployees} người
                            </span>
                          </td>
                          <td className="text-end">
                            <span style={{ fontSize: 13, fontWeight: 700,
                                           color: pos.AvgSalary > 0 ? "#16a34a" : "#8a94a6" }}>
                              {pos.AvgSalary > 0 ? fmtShort(pos.AvgSalary) : "—"}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: "#5a6478", maxWidth: 260 }}>
                            {pos.Description || (
                              <span style={{ color: "#d1d5db", fontStyle: "italic" }}>
                                Chưa có mô tả
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Ghi chú nguồn dữ liệu ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "#8a94a6",
        background: "#f8fafc", border: "1px solid #e8ecf0",
        borderRadius: 10, padding: "10px 16px",
      }}>
        <ChevronRight size={13} />
        Dữ liệu phòng ban &amp; chức vụ đồng bộ từ <strong style={{ color: "#2563eb" }}>HUMAN_2025</strong> (SQL Server).
        Lương trung bình lấy từ <strong style={{ color: "#16a34a" }}>payroll_2026</strong> (MySQL) — tháng gần nhất.
        Trưởng phòng là nhân viên có chức vụ <em>Trưởng phòng</em> trong phòng đó.
      </div>

      {/* ── Drawer nhân viên phòng ban ── */}
      {selectedDept && (
        <DeptDrawer
          dept={selectedDept.dept}
          colorIdx={selectedDept.idx}
          onClose={() => setSelectedDept(null)}
        />
      )}

    </div>
  );
}

