import { useEffect, useState, useCallback } from "react";
import {
  Shield, Users, Key, FileText, Settings, RefreshCw,
  Plus, Edit3, Trash2, X, Check, AlertCircle, CheckCircle,
  Search, Eye, EyeOff, Lock, Unlock, Activity,
  ChevronRight, User, Mail,
} from "lucide-react";

const API = "http://localhost:5000";
const token = () => localStorage.getItem("hr_token") || "";

function Skeleton({ h = 14, w = "100%" }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

const ROLE_COLOR = {
  Admin:            { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  HR_Manager:       { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Payroll_Manager:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Employee:         { bg: "#f8fafc", color: "#5a6478", border: "#e2e8f0" },
};

function RoleBadge({ role }) {
  const s = ROLE_COLOR[role] || ROLE_COLOR.Employee;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>{role}</span>
  );
}

const ACTION_COLOR = {
  LOGIN_SUCCESS: { color: "#16a34a", bg: "#f0fdf4" },
  LOGOUT:        { color: "#5a6478", bg: "#f8fafc" },
  CREATE:        { color: "#2563eb", bg: "#eff6ff" },
  UPDATE:        { color: "#d97706", bg: "#fffbeb" },
  DELETE:        { color: "#dc2626", bg: "#fef2f2" },
  VIEW:          { color: "#0891b2", bg: "#ecfeff" },
  SUBMIT:        { color: "#7c3aed", bg: "#fdf4ff" },
};

function ActionBadge({ action }) {
  const s = ACTION_COLOR[action] || { color: "#5a6478", bg: "#f8fafc" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>{action}</span>
  );
}

/* ── Modal User ── */
function UserModal({ user, roles, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    FullName: user?.FullName || "",
    Email:    user?.Email    || "",
    Username: user?.Username || "",
    Password: "",
    IsActive: user?.IsActive ?? true,
    RoleIDs:  [],
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const toggleRole = (id) => {
    setForm(f => ({
      ...f,
      RoleIDs: f.RoleIDs.includes(id)
        ? f.RoleIDs.filter(r => r !== id)
        : [...f.RoleIDs, id],
    }));
  };

  const handleSave = async () => {
    if (!form.FullName || !form.Email) { setErr("Vui lòng điền đầy đủ thông tin"); return; }
    if (!isEdit && !form.Password)     { setErr("Mật khẩu là bắt buộc khi tạo mới"); return; }
    setSaving(true); setErr("");
    try {
      const url    = isEdit ? `${API}/api/admin/users/${user.UserID}` : `${API}/api/admin/users`;
      const method = isEdit ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      }).then(r => r.json());
      if (r.status === "success") { onSaved(); onClose(); }
      else setErr(r.msg || "Lỗi không xác định");
    } catch { setErr("Không thể kết nối server"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
                  display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:480,
                    boxShadow:"0 20px 60px rgba(0,0,0,0.2)",overflow:"hidden" }}>
        <div style={{ padding:"20px 24px 16px",borderBottom:"1px solid #e8ecf0",
                      display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <h5 style={{ margin:0,fontWeight:700,color:"#1e2a3a" }}>
            {isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </h5>
          <button onClick={onClose} style={{ border:"none",background:"#f4f6fb",
            borderRadius:8,padding:6,cursor:"pointer",color:"#5a6478" }}><X size={18}/></button>
        </div>
        <div style={{ padding:"20px 24px",maxHeight:"70vh",overflowY:"auto" }}>
          {err && (
            <div style={{ background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,
                          padding:"10px 14px",marginBottom:14,color:"#dc2626",fontSize:13,
                          display:"flex",alignItems:"center",gap:8 }}>
              <AlertCircle size={14}/> {err}
            </div>
          )}
          <div className="row g-3">
            <div className="col-12">
              <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>
                Họ và tên <span style={{ color:"#dc2626" }}>*</span>
              </label>
              <input className="form-control" style={{ fontSize:13 }}
                value={form.FullName} onChange={e => setForm({...form,FullName:e.target.value})}
                placeholder="Nhập họ và tên..." />
            </div>
            <div className="col-6">
              <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>
                Email <span style={{ color:"#dc2626" }}>*</span>
              </label>
              <input className="form-control" style={{ fontSize:13 }} type="email"
                value={form.Email} onChange={e => setForm({...form,Email:e.target.value})}
                placeholder="email@company.com" />
            </div>
            {!isEdit && (
              <div className="col-6">
                <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>
                  Username <span style={{ color:"#dc2626" }}>*</span>
                </label>
                <input className="form-control" style={{ fontSize:13 }}
                  value={form.Username} onChange={e => setForm({...form,Username:e.target.value})}
                  placeholder="username" />
              </div>
            )}
            {!isEdit && (
              <div className="col-12">
                <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>
                  Mật khẩu <span style={{ color:"#dc2626" }}>*</span>
                </label>
                <div style={{ position:"relative" }}>
                  <input className="form-control" style={{ fontSize:13,paddingRight:40 }}
                    type={showPw ? "text" : "password"}
                    value={form.Password} onChange={e => setForm({...form,Password:e.target.value})}
                    placeholder="Tối thiểu 6 ký tự" />
                  <button onClick={() => setShowPw(!showPw)}
                    style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                             border:"none",background:"none",cursor:"pointer",color:"#8a94a6" }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
            )}
            <div className="col-12">
              <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:8 }}>
                Vai trò
              </label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {roles.map(r => {
                  const active = form.RoleIDs.includes(r.RoleID);
                  const s = ROLE_COLOR[r.RoleName] || ROLE_COLOR.Employee;
                  return (
                    <button key={r.RoleID} type="button" onClick={() => toggleRole(r.RoleID)}
                      style={{
                        border: `1px solid ${active ? s.color : "#e8ecf0"}`,
                        background: active ? s.bg : "#f8fafc",
                        color: active ? s.color : "#5a6478",
                        borderRadius:8,padding:"6px 14px",cursor:"pointer",
                        fontSize:12,fontWeight:600,transition:"all 0.15s",
                        display:"flex",alignItems:"center",gap:5,
                      }}>
                      {active && <Check size={12}/>} {r.RoleName}
                    </button>
                  );
                })}
              </div>
            </div>
            {isEdit && (
              <div className="col-12">
                <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:8 }}>
                  Trạng thái
                </label>
                <div style={{ display:"flex",gap:8 }}>
                  {[{v:true,l:"Hoạt động"},{v:false,l:"Vô hiệu hóa"}].map(opt => (
                    <button key={String(opt.v)} type="button"
                      onClick={() => setForm({...form,IsActive:opt.v})}
                      style={{
                        border:`1px solid ${form.IsActive===opt.v ? (opt.v?"#16a34a":"#dc2626") : "#e8ecf0"}`,
                        background: form.IsActive===opt.v ? (opt.v?"#f0fdf4":"#fef2f2") : "#f8fafc",
                        color: form.IsActive===opt.v ? (opt.v?"#16a34a":"#dc2626") : "#5a6478",
                        borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600,
                      }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding:"0 24px 20px",display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button onClick={onClose} className="btn btn-sm"
            style={{ background:"#f4f6fb",border:"1px solid #e8ecf0",
                     color:"#5a6478",borderRadius:8,fontWeight:600,padding:"8px 18px" }}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm"
            style={{ display:"flex",alignItems:"center",gap:6 }}>
            {saving ? <RefreshCw size={14} className="spin"/> : <Check size={14}/>}
            {saving ? "Đang lưu..." : (isEdit ? "Lưu thay đổi" : "Tạo người dùng")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Users ── */
function TabUsers({ toast }) {
  const [users,   setUsers]   = useState([]);
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(null); // null | "new" | user_obj
  const [delId,   setDelId]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        fetch(`${API}/api/admin/users`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
        fetch(`${API}/api/admin/roles`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
      ]);
      setUsers(u.data || []);
      setRoles(r.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await fetch(`${API}/api/admin/users/${id}`, {
      method:"DELETE", headers:{ Authorization:`Bearer ${token()}` }
    });
    toast("Đã xóa người dùng");
    setDelId(null); load();
  };

  const filtered = users.filter(u =>
    u.FullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.Username?.toLowerCase().includes(search.toLowerCase()) ||
    u.Email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,background:"#f4f6fb",
                      border:"1px solid #e8ecf0",borderRadius:8,padding:"7px 12px",flex:"1 1 200px" }}>
          <Search size={13} color="#8a94a6"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Tìm theo tên, username, email..."
            style={{ border:"none",background:"transparent",outline:"none",fontSize:13,width:"100%" }}/>
        </div>
        <button onClick={() => setModal("new")} className="btn btn-primary btn-sm"
          style={{ display:"flex",alignItems:"center",gap:6 }}>
          <Plus size={14}/> Thêm người dùng
        </button>
        <button onClick={load} disabled={loading}
          style={{ display:"flex",alignItems:"center",gap:6,background:"#f4f6fb",
                   border:"1px solid #e8ecf0",borderRadius:8,color:"#5a6478",
                   fontWeight:600,fontSize:13,padding:"7px 14px",cursor:"pointer" }}>
          <RefreshCw size={14} className={loading?"spin":""}/>
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table className="table table-custom mb-0" style={{ minWidth:700 }}>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th className="text-center">Trạng thái</th>
              <th>Đăng nhập cuối</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(4)].map((_,i) => (
              <tr key={i}>{[...Array(6)].map((_,j) => <td key={j}><Skeleton/></td>)}</tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:"center",padding:"48px 0",color:"#8a94a6" }}>
                Không có người dùng nào
              </td></tr>
            ) : filtered.map(u => (
              <tr key={u.UserID}>
                <td>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:34,height:34,borderRadius:"50%",background:"#eff6ff",
                                  display:"flex",alignItems:"center",justifyContent:"center",
                                  color:"#2563eb",fontWeight:700,fontSize:13,flexShrink:0 }}>
                      {(u.FullName||"?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600,fontSize:13,color:"#1e2a3a" }}>{u.FullName}</div>
                      <div style={{ fontSize:11,color:"#8a94a6" }}>@{u.Username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize:12,color:"#5a6478" }}>{u.Email}</td>
                <td>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                    {(u.Roles||"").split(", ").filter(Boolean).map(r => (
                      <RoleBadge key={r} role={r}/>
                    ))}
                  </div>
                </td>
                <td className="text-center">
                  <span style={{
                    background: u.IsActive?"#f0fdf4":"#fef2f2",
                    color: u.IsActive?"#16a34a":"#dc2626",
                    border:`1px solid ${u.IsActive?"#bbf7d0":"#fecaca"}`,
                    padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                    display:"inline-flex",alignItems:"center",gap:4,
                  }}>
                    {u.IsActive ? <><Unlock size={10}/> Hoạt động</> : <><Lock size={10}/> Vô hiệu</>}
                  </span>
                </td>
                <td style={{ fontSize:12,color:"#8a94a6" }}>
                  {u.LastLogin ? new Date(u.LastLogin).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                </td>
                <td className="text-center">
                  <div style={{ display:"flex",gap:6,justifyContent:"center" }}>
                    <button onClick={() => setModal(u)}
                      style={{ border:"none",background:"#fffbeb",color:"#d97706",
                               borderRadius:7,padding:"5px 10px",cursor:"pointer",
                               display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600 }}>
                      <Edit3 size={13}/> Sửa
                    </button>
                    <button onClick={() => setDelId(u.UserID)}
                      style={{ border:"none",background:"#fef2f2",color:"#dc2626",
                               borderRadius:7,padding:"5px 10px",cursor:"pointer",
                               display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600 }}>
                      <Trash2 size={13}/> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {(modal === "new" || (modal && modal !== "new")) && (
        <UserModal
          user={modal === "new" ? null : modal}
          roles={roles}
          onClose={() => setModal(null)}
          onSaved={() => { toast("Lưu thành công"); load(); }}
        />
      )}
      {delId && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
                      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000 }}>
          <div style={{ background:"#fff",borderRadius:16,padding:28,maxWidth:380,width:"100%",
                        boxShadow:"0 20px 60px rgba(0,0,0,0.2)",textAlign:"center" }}>
            <div style={{ width:52,height:52,borderRadius:"50%",background:"#fef2f2",
                          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px" }}>
              <Trash2 size={22} color="#dc2626"/>
            </div>
            <h5 style={{ margin:"0 0 8px",fontWeight:700,color:"#1e2a3a" }}>Xác nhận xóa</h5>
            <p style={{ fontSize:13,color:"#5a6478",margin:"0 0 20px" }}>
              Hành động này không thể hoàn tác.
            </p>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <button onClick={() => setDelId(null)}
                style={{ background:"#f4f6fb",border:"1px solid #e8ecf0",color:"#5a6478",
                         borderRadius:8,fontWeight:600,fontSize:13,padding:"9px 22px",cursor:"pointer" }}>
                Huỷ
              </button>
              <button onClick={() => handleDelete(delId)}
                style={{ background:"#dc2626",border:"none",borderRadius:8,color:"#fff",
                         fontWeight:700,fontSize:13,padding:"9px 22px",cursor:"pointer" }}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Roles ── */
function TabRoles() {
  const [roles,   setRoles]   = useState([]);
  const [selRole, setSelRole] = useState(null);
  const [perms,   setPerms]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/roles`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.json()).then(r=>{ setRoles(r.data||[]); if(r.data?.length) setSelRole(r.data[0]); })
      .finally(()=>setLoading(false));
  }, []);

  useEffect(() => {
    if (!selRole) return;
    fetch(`${API}/api/admin/roles/${selRole.RoleID}/permissions`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.json()).then(r=>setPerms(r.data||[]));
  }, [selRole]);

  const grouped = perms.reduce((acc, p) => {
    if (!acc[p.Resource]) acc[p.Resource] = [];
    acc[p.Resource].push(p);
    return acc;
  }, {});

  const RESOURCE_LABEL = {
    employee:"Nhân viên", payroll:"Tiền lương", attendance:"Chấm công",
    organization:"Tổ chức", report:"Báo cáo", alert:"Cảnh báo",
    user:"Người dùng", role:"Vai trò", permission:"Quyền hạn", audit:"Nhật ký",
  };

  return (
    <div style={{ display:"flex",gap:16 }}>
      {/* Role list */}
      <div style={{ width:220,flexShrink:0 }}>
        {loading ? [...Array(4)].map((_,i)=>(
          <div key={i} style={{ marginBottom:8 }}><Skeleton h={52}/></div>
        )) : roles.map(r => {
          const s = ROLE_COLOR[r.RoleName] || ROLE_COLOR.Employee;
          const active = selRole?.RoleID === r.RoleID;
          return (
            <div key={r.RoleID} onClick={() => setSelRole(r)}
              style={{
                padding:"12px 14px",borderRadius:10,marginBottom:8,cursor:"pointer",
                border:`1px solid ${active ? s.color : "#e8ecf0"}`,
                background: active ? s.bg : "#fff",
                transition:"all 0.15s",
              }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:13,color: active?s.color:"#1e2a3a" }}>
                    {r.RoleName}
                  </div>
                  <div style={{ fontSize:11,color:"#8a94a6",marginTop:2 }}>
                    {r.UserCount} người dùng
                  </div>
                </div>
                {active && <ChevronRight size={14} color={s.color}/>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions detail */}
      <div style={{ flex:1 }}>
        {selRole && (
          <>
            <div style={{ marginBottom:14 }}>
              <h6 style={{ margin:"0 0 4px",fontWeight:700,color:"#1e2a3a" }}>
                Quyền hạn của: {selRole.RoleName}
              </h6>
              <p style={{ margin:0,fontSize:12,color:"#8a94a6" }}>{selRole.Description}</p>
            </div>
            {Object.keys(grouped).length === 0 ? (
              <div style={{ textAlign:"center",padding:"32px 0",color:"#8a94a6",fontSize:13 }}>
                Không có quyền nào
              </div>
            ) : Object.entries(grouped).map(([resource, ps]) => (
              <div key={resource} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11,fontWeight:700,color:"#8a94a6",
                              textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6 }}>
                  {RESOURCE_LABEL[resource] || resource}
                </div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {ps.map(p => (
                    <span key={p.PermissionID} style={{
                      background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",
                      padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,
                      display:"inline-flex",alignItems:"center",gap:5,
                    }}>
                      <Check size={11}/> {p.Action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Tab: Audit Log ── */
function TabAuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/audit-log?page=${page}&limit=${LIMIT}`, {
        headers:{ Authorization:`Bearer ${token()}` }
      }).then(r=>r.json());
      setLogs(r.data||[]);
      setTotal(r.total||0);
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(l =>
    l.Username?.toLowerCase().includes(search.toLowerCase()) ||
    l.Action?.toLowerCase().includes(search.toLowerCase()) ||
    l.Resource?.toLowerCase().includes(search.toLowerCase()) ||
    l.Details?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display:"flex",gap:10,marginBottom:16,alignItems:"center" }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,background:"#f4f6fb",
                      border:"1px solid #e8ecf0",borderRadius:8,padding:"7px 12px",flex:"1 1 200px" }}>
          <Search size={13} color="#8a94a6"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Tìm theo user, action, resource..."
            style={{ border:"none",background:"transparent",outline:"none",fontSize:13,width:"100%" }}/>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display:"flex",alignItems:"center",gap:6,background:"#f4f6fb",
                   border:"1px solid #e8ecf0",borderRadius:8,color:"#5a6478",
                   fontWeight:600,fontSize:13,padding:"7px 14px",cursor:"pointer" }}>
          <RefreshCw size={14} className={loading?"spin":""}/>
        </button>
        <span style={{ fontSize:12,color:"#8a94a6" }}>{total} bản ghi</span>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table className="table table-custom mb-0" style={{ minWidth:700 }}>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th>Hành động</th>
              <th>Tài nguyên</th>
              <th>Chi tiết</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_,i)=>(
              <tr key={i}>{[...Array(6)].map((_,j)=><td key={j}><Skeleton/></td>)}</tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:"center",padding:"48px 0",color:"#8a94a6" }}>
                Không có dữ liệu
              </td></tr>
            ) : filtered.map(l => (
              <tr key={l.LogID}>
                <td style={{ fontSize:11,color:"#8a94a6",whiteSpace:"nowrap" }}>
                  {l.CreatedAt ? new Date(l.CreatedAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td>
                  <div style={{ fontWeight:600,fontSize:12,color:"#1e2a3a" }}>{l.Username}</div>
                  <div style={{ fontSize:10,color:"#8a94a6" }}>ID:{l.UserID}</div>
                </td>
                <td><ActionBadge action={l.Action}/></td>
                <td>
                  <span style={{ fontSize:12,color:"#5a6478",background:"#f4f6fb",
                                 padding:"2px 8px",borderRadius:6 }}>
                    {l.Resource}
                    {l.ResourceID && <span style={{ color:"#8a94a6" }}> #{l.ResourceID}</span>}
                  </span>
                </td>
                <td style={{ fontSize:12,color:"#5a6478",maxWidth:220 }}>
                  <span style={{ display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}
                    title={l.Details}>{l.Details||"—"}</span>
                </td>
                <td style={{ fontSize:11,color:"#8a94a6",fontFamily:"monospace" }}>{l.IPAddress||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex",justifyContent:"center",gap:6,marginTop:16 }}>
          {[...Array(totalPages)].map((_,i) => (
            <button key={i} onClick={() => setPage(i+1)}
              style={{
                width:32,height:32,borderRadius:8,border:"1px solid #e8ecf0",
                background: page===i+1 ? "#2563eb" : "#f4f6fb",
                color: page===i+1 ? "#fff" : "#5a6478",
                fontWeight:600,fontSize:13,cursor:"pointer",
              }}>{i+1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tab: System Stats ── */
function TabSystem() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/admin/stats`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.json()).then(r=>setStats(r.data||null))
      .finally(()=>setLoading(false));
  }, []);

  const cards = stats ? [
    { label:"Người dùng hoạt động", value:stats.TotalUsers,       icon:Users,    bg:"#eff6ff",color:"#2563eb" },
    { label:"Vai trò hệ thống",     value:stats.TotalRoles,       icon:Shield,   bg:"#fdf4ff",color:"#9333ea" },
    { label:"Quyền hạn",            value:stats.TotalPermissions, icon:Key,      bg:"#f0fdf4",color:"#16a34a" },
    { label:"Hoạt động (30 ngày)",  value:stats.RecentLogs,       icon:Activity, bg:"#fffbeb",color:"#d97706" },
  ] : [];

  const sysInfo = [
    { label:"Phiên bản hệ thống",  value:"HR & Payroll v2.0" },
    { label:"Backend",             value:"Flask 3.x + Python 3.12" },
    { label:"Frontend",            value:"React 19 + Bootstrap 5" },
    { label:"Database chính",      value:"SQL Server (HUMAN_2025)" },
    { label:"Database lương",      value:"MySQL (payroll_2026)" },
    { label:"Database xác thực",   value:"SQL Server (AuthDB)" },
    { label:"Xác thực",            value:"JWT (HS256, 8h)" },
    { label:"Phân quyền",          value:"RBAC (Role-Based Access Control)" },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      {/* Stats */}
      <div className="row g-3">
        {loading ? [...Array(4)].map((_,i)=>(
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card"><Skeleton h={60}/></div>
          </div>
        )) : cards.map((c,i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card">
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontSize:11,color:"#8a94a6",fontWeight:600,
                               textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 4px" }}>
                    {c.label}
                  </p>
                  <p style={{ fontSize:24,fontWeight:800,color:"#1e2a3a",margin:0 }}>{c.value}</p>
                </div>
                <div className="stat-icon" style={{ background:c.bg }}>
                  <c.icon size={20} color={c.color}/>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System info */}
      <div className="content-card" style={{ padding:0,overflow:"hidden" }}>
        <div style={{ padding:"16px 20px 14px",borderBottom:"1px solid #f0f4f8",
                      display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"#eff6ff",
                        display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Settings size={16} color="#2563eb"/>
          </div>
          <span style={{ fontWeight:700,fontSize:14,color:"#1e2a3a" }}>Thông tin hệ thống</span>
        </div>
        <div style={{ padding:"4px 0" }}>
          {sysInfo.map((item,i) => (
            <div key={i} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"11px 20px",borderBottom: i<sysInfo.length-1?"1px solid #f8fafc":"none",
            }}>
              <span style={{ fontSize:13,color:"#5a6478" }}>{item.label}</span>
              <span style={{ fontSize:13,fontWeight:600,color:"#1e2a3a" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints */}
      <div className="content-card" style={{ padding:0,overflow:"hidden" }}>
        <div style={{ padding:"16px 20px 14px",borderBottom:"1px solid #f0f4f8",
                      display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"#f0fdf4",
                        display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Activity size={16} color="#16a34a"/>
          </div>
          <span style={{ fontWeight:700,fontSize:14,color:"#1e2a3a" }}>Trạng thái API</span>
        </div>
        <div style={{ padding:"4px 0" }}>
          {[
            { method:"GET",    path:"/api/employees",         desc:"Danh sách nhân viên" },
            { method:"GET",    path:"/api/payroll",           desc:"Bảng lương" },
            { method:"GET",    path:"/api/attendance/detail", desc:"Chấm công" },
            { method:"GET",    path:"/api/leave-requests",    desc:"Nghỉ phép" },
            { method:"GET",    path:"/api/departments/stats", desc:"Phòng ban" },
            { method:"POST",   path:"/api/auth/login",        desc:"Đăng nhập" },
            { method:"GET",    path:"/api/admin/users",       desc:"Quản lý users" },
            { method:"GET",    path:"/api/admin/audit-log",   desc:"Nhật ký hệ thống" },
          ].map((ep,i,arr) => (
            <div key={i} style={{
              display:"flex",alignItems:"center",gap:12,padding:"10px 20px",
              borderBottom: i<arr.length-1?"1px solid #f8fafc":"none",
            }}>
              <span style={{
                fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:4,
                background: ep.method==="GET"?"#eff6ff":ep.method==="POST"?"#f0fdf4":"#fffbeb",
                color: ep.method==="GET"?"#2563eb":ep.method==="POST"?"#16a34a":"#d97706",
                minWidth:38,textAlign:"center",
              }}>{ep.method}</span>
              <code style={{ fontSize:12,color:"#5a6478",flex:1 }}>{ep.path}</code>
              <span style={{ fontSize:12,color:"#8a94a6" }}>{ep.desc}</span>
              <span style={{ width:8,height:8,borderRadius:"50%",background:"#16a34a",flexShrink:0 }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const TABS = [
    { id:"users",  label:"Người dùng",    icon:Users    },
    { id:"roles",  label:"Vai trò",       icon:Shield   },
    { id:"audit",  label:"Nhật ký",       icon:FileText },
    { id:"system", label:"Hệ thống",      icon:Settings },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",bottom:28,right:28,zIndex:9999,
          background: toast.type==="success"?"#16a34a":"#dc2626",
          color:"#fff",padding:"12px 20px",borderRadius:12,
          display:"flex",alignItems:"center",gap:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
          fontSize:14,fontWeight:600,animation:"slideUp 0.3s ease",
        }}>
          {toast.type==="success" ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="page-header" style={{ marginBottom:0 }}>
        <div>
          <h3>Quản trị hệ thống</h3>
          <p style={{ color:"#8a94a6",fontSize:13,margin:0 }}>
            Cấu hình người dùng, phân quyền và giám sát hệ thống
          </p>
        </div>
      </div>

      {/* Tab content card */}
      <div className="content-card" style={{ padding:0,overflow:"hidden" }}>
        {/* Tab bar */}
        <div style={{ display:"flex",borderBottom:"1px solid #e8ecf0",padding:"0 20px",
                      overflowX:"auto" }}>
          {TABS.map(tab => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display:"flex",alignItems:"center",gap:8,
                  padding:"14px 16px",background:"none",border:"none",
                  borderBottom: active?"2px solid #2563eb":"2px solid transparent",
                  color: active?"#2563eb":"#5a6478",
                  fontWeight: active?700:500,fontSize:14,
                  cursor:"pointer",marginBottom:-1,transition:"all 0.15s",
                  whiteSpace:"nowrap",
                }}>
                <Icon size={16}/>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab body */}
        <div style={{ padding:20 }}>
          {activeTab === "users"  && <TabUsers  toast={showToast}/>}
          {activeTab === "roles"  && <TabRoles/>}
          {activeTab === "audit"  && <TabAuditLog/>}
          {activeTab === "system" && <TabSystem/>}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

