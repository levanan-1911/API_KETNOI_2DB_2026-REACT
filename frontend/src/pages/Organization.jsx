import { useState, useEffect } from "react";
import { FiRefreshCw, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { getOrganization, syncOrganization, updateDepartment, updatePosition } from "../services/api";

export default function Organization() {
    const [data, setData] = useState({ departments: [], positions: [] });
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [editing, setEditing] = useState(null); // { type: 'dept'|'pos', id, value }

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await getOrganization();
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await syncOrganization();
            alert("Đồng bộ tổ chức thành công!");
            loadData();
        } catch (e) {
            alert("Lỗi khi đồng bộ");
        } finally {
            setSyncing(false);
        }
    };

    const saveEdit = async () => {
        if (!editing) return;
        try {
            if (editing.type === 'dept') {
                await updateDepartment(editing.id, editing.value);
            } else {
                await updatePosition(editing.id, editing.value);
            }
            setEditing(null);
            loadData();
        } catch (e) {
            alert("Lỗi khi cập nhật");
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Quản lý Cơ cấu Tổ chức</h2>
                <button className="btn btn-primary" onClick={handleSync} disabled={syncing || loading}>
                    <FiRefreshCw className={syncing ? "spin" : ""} /> {syncing ? "Đang đồng bộ..." : "Đồng bộ Tổ chức"}
                </button>
            </div>

            <div className="org-grid">
                {/* Departments */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                    <h3 style={{ marginBottom: "20px", borderBottom: "1px solid var(--panel-border)", paddingBottom: "12px" }}>Phòng ban</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {data.departments.map(dept => (
                            <div key={dept.DepartmentID} className="org-item">
                                {editing?.type === 'dept' && editing.id === dept.DepartmentID ? (
                                    <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                                        <input 
                                            value={editing.value} 
                                            onChange={e => setEditing({...editing, value: e.target.value})}
                                            style={{ flex: 1, padding: "8px" }}
                                            autoFocus
                                        />
                                        <button className="btn btn-success" onClick={saveEdit} style={{ padding: "8px" }}><FiCheck /></button>
                                        <button className="btn btn-danger" onClick={() => setEditing(null)} style={{ padding: "8px" }}><FiX /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontWeight: "500" }}>{dept.DepartmentName}</span>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>ID: {dept.DepartmentID} &bull; {dept.isSynced ? <span style={{ color: "var(--success-color)" }}>Đã đồng bộ</span> : <span style={{ color: "var(--danger-color)" }}>Chưa đồng bộ</span>}</span>
                                        </div>
                                        <button className="btn" style={{ padding: "8px", background: "transparent", color: "var(--accent-color)" }} onClick={() => setEditing({ type: 'dept', id: dept.DepartmentID, value: dept.DepartmentName })}>
                                            <FiEdit2 />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        {data.departments.length === 0 && !loading && <p style={{ color: "var(--text-secondary)" }}>Không có dữ liệu</p>}
                    </div>
                </div>

                {/* Positions */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                    <h3 style={{ marginBottom: "20px", borderBottom: "1px solid var(--panel-border)", paddingBottom: "12px" }}>Vị trí / Chức vụ</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {data.positions.map(pos => (
                            <div key={pos.PositionID} className="org-item">
                                {editing?.type === 'pos' && editing.id === pos.PositionID ? (
                                    <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                                        <input 
                                            value={editing.value} 
                                            onChange={e => setEditing({...editing, value: e.target.value})}
                                            style={{ flex: 1, padding: "8px" }}
                                            autoFocus
                                        />
                                        <button className="btn btn-success" onClick={saveEdit} style={{ padding: "8px" }}><FiCheck /></button>
                                        <button className="btn btn-danger" onClick={() => setEditing(null)} style={{ padding: "8px" }}><FiX /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontWeight: "500" }}>{pos.PositionName}</span>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>ID: {pos.PositionID} &bull; {pos.isSynced ? <span style={{ color: "var(--success-color)" }}>Đã đồng bộ</span> : <span style={{ color: "var(--danger-color)" }}>Chưa đồng bộ</span>}</span>
                                        </div>
                                        <button className="btn" style={{ padding: "8px", background: "transparent", color: "var(--accent-color)" }} onClick={() => setEditing({ type: 'pos', id: pos.PositionID, value: pos.PositionName })}>
                                            <FiEdit2 />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        {data.positions.length === 0 && !loading && <p style={{ color: "var(--text-secondary)" }}>Không có dữ liệu</p>}
                    </div>
                </div>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
