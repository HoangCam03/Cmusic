import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTableCellsLarge, 
  faArrowUpFromBracket, 
  faMusic, 
  faUserGroup, 
  faGear, 
  faAngleLeft,
  faArrowLeft,
  faAngleRight,
  faShieldHalved,
  faMicrophone,
  faCompactDisc
} from "@fortawesome/free-solid-svg-icons";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const verifyDashboardAccess = async () => {
      try {
        if (!token) {
          navigate("/");
          return;
        }

        // Chặn người dùng thường (role === "user") truy cập khu vực quản trị/nghệ sĩ
        if (user?.role === "user") {
          navigate("/");
          return;
        }
        
        // Chỉ Admin mới gọi stats hệ thống
        if (user?.role === "admin") {
          await api.get(`/admin/stats`);
        }
        
        setIsCheckingAccess(false);
      } catch (error: any) {
        // Nếu trả về 403 Forbidden hoặc lỗi xác thực -> Đá ra
        navigate("/");
      }
    };
    verifyDashboardAccess();
  }, [navigate, token, user?.role]);

  const isAdmin = user?.role === "admin";

  const menuItems = [
    { 
      name: isAdmin ? "Tổng quan" : "Artist Studio", 
      icon: faTableCellsLarge, 
      path: isAdmin ? "/admin" : "/admin/studio" 
    },
    { name: "Tải nhạc lên", icon: faArrowUpFromBracket, path: "/admin/upload" },
    { name: "Quản lý bài hát", icon: faMusic, path: "/admin/tracks" },
    { name: "Quản lý Album", icon: faCompactDisc, path: "/admin/albums" },
    { name: "Quản lý Nghệ sĩ", icon: faMicrophone, path: "/admin/artists" },
    ...(isAdmin ? [
      { name: "Người dùng", icon: faUserGroup, path: "/admin/users" },
      { name: "Phân quyền", icon: faShieldHalved, path: "/admin/permissions" },
    ] : []),
    { name: "Cài đặt", icon: faGear, path: "/admin/settings" },
  ];

  if (isCheckingAccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
         <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080808] text-[#a1a1aa] overflow-hidden font-inter antialiased selection:bg-white selection:text-black">
      {/* Sidebar - Dynamically Sized */}
      <aside 
        className={`bg-[#080808] border-r border-white/[0.06] flex flex-col shadow-2xl relative z-20 transition-all duration-500 ease-in-out ${
          isCollapsed ? "w-20" : "w-56"
        }`}
      >
        {/* Logo Section */}
        <div className={`flex items-center gap-3 py-5 border-b border-white/[0.06] mb-4 overflow-hidden transition-all duration-500 ${
          isCollapsed ? "px-6" : "px-8"
        }`}>
           <div className="w-5 h-5 bg-white rounded flex-shrink-0 flex items-center justify-center">
            <FontAwesomeIcon icon={faMusic} className="text-black text-[9px]" />
          </div>
          {!isCollapsed && (
            <h1 className="text-white font-bold text-[11px] tracking-[0.2em] uppercase whitespace-nowrap overflow-hidden">
              CMUSIC <span className="text-zinc-600 font-medium ml-1">{isAdmin ? "ADMIN" : "STUDIO"}</span>
            </h1>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (isAdmin && item.path === "/admin" && location.pathname === "/admin/tracks");
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : ""}
                className={`flex items-center rounded-full transition-all duration-300 group ${
                  isCollapsed ? "justify-center px-0 py-3" : "gap-3.5 px-4 py-2.5"
                } ${
                  isActive 
                  ? "bg-[#e5e5e5] text-black" 
                  : "text-zinc-500 hover:text-white"
                }`}
              >
                <div className={`flex justify-center transition-colors ${
                  isCollapsed ? "w-full" : "w-5"
                } ${isActive ? 'text-black' : 'text-zinc-600 group-hover:text-white'}`}>
                  <FontAwesomeIcon icon={item.icon} className="text-[15px]" />
                </div>
                {!isCollapsed && (
                  <span className="text-[11px] font-bold tracking-tight whitespace-nowrap overflow-hidden">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`mt-auto border-t border-white/[0.06] space-y-2 py-6 transition-all duration-500 ${
           isCollapsed ? "px-0" : "px-6"
        }`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center text-[11px] font-bold text-zinc-600 hover:text-white transition group ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className={`flex justify-center ${isCollapsed ? "w-full" : "w-5"}`}>
              <FontAwesomeIcon 
                icon={isCollapsed ? faAngleRight : faAngleLeft} 
                className={`text-[13px] transition-transform ${!isCollapsed && "group-hover:-translate-x-1"}`} 
              />
            </div>
            {!isCollapsed && <span>Thu gọn</span>}
          </button>
          
          <Link 
            to="/" 
            title={isCollapsed ? "Trình phát nhạc" : ""}
            className={`w-full flex items-center text-[11px] font-bold text-zinc-600 hover:text-white transition group ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className={`flex justify-center ${isCollapsed ? "w-full" : "w-5"}`}>
              <FontAwesomeIcon icon={faArrowLeft} className={`text-[13px] transition-transform ${!isCollapsed && "group-hover:-translate-x-1"}`} />
            </div>
            {!isCollapsed && <span>Trình phát nhạc</span>}
          </Link>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
        <div className="max-w-[1600px] mx-auto min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
