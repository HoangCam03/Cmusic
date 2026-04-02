import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChartLine, 
  faMusic, 
  faUsers, 
  faCog, 
  faArrowLeft,
  faCloudUploadAlt
} from "@fortawesome/free-solid-svg-icons";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const menuItems = [
    { name: "Tổng quan", icon: faChartLine, path: "/admin" },
    { name: "Tải nhạc lên", icon: faCloudUploadAlt, path: "/admin/upload" },
    { name: "Quản lý bài hát", icon: faMusic, path: "/admin/tracks" },
    { name: "Người dùng", icon: faUsers, path: "/admin/users" },
    { name: "Cài đặt", icon: faCog, path: "/admin/settings" },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-[#a1a1aa] overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#18181b] border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
           <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-white font-black text-sm italic leading-none">C</span>
          </div>
          <h1 className="text-white font-black text-lg tracking-tight uppercase">CMusic <span className="text-[10px] text-purple-400">Admin</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-[13px] transition-all duration-300 ${
                location.pathname === item.path 
                ? "bg-white/5 text-white shadow-inner border border-white/5" 
                : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className={`w-4 h-4 ${location.pathname === item.path ? "text-purple-400" : ""}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <Link to="/" className="flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-[13px] text-[#71717a] hover:text-white transition">
            <FontAwesomeIcon icon={faArrowLeft} />
            Về CMusic Player
          </Link>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
         {/* Background soft glow */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] pointer-events-none" />
         <div className="relative z-10">
            {children}
         </div>
      </main>
    </div>
  );
}
