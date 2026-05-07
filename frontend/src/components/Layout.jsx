import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar cố định bên trái */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      {/* Header cố định trên cùng */}
      <Header collapsed={collapsed} />

      {/* Nội dung chính */}
      <main className={`app-main ${collapsed ? "collapsed" : ""}`}>
        {children}
      </main>
    </div>
  );
}
