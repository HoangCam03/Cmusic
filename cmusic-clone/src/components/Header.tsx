import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight, 
  faCog, 
  faUser, 
  faStar, 
  faSignOutAlt,
  faMicrophone 
} from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch } from "../store/store";
import { clearPlaylists } from "../store/slices/playlistSlice";
import NotificationBell from "./NotificationBell";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    dispatch(clearPlaylists());
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <header className="h-[72px] bg-transparent flex items-center justify-between px-6 lg:px-8 shrink-0 relative z-50 border-b border-white/5">
      {/* Left: Nav Arrows */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] rounded-full text-[#a1a1aa] hover:text-white transition-colors">
          <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] rounded-full text-[#a1a1aa] hover:text-white transition-colors">
          <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-[460px] mx-6">
        <div className="relative group">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] group-focus-within:text-white transition-colors w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ..."
            className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.08] text-white text-[13px] font-medium pl-11 pr-4 py-3 rounded-full outline-none border border-transparent focus:border-white/10 transition-all duration-200 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Right: Nav Links + Login */}
      <div className="flex items-center gap-6">
        {isLoggedIn && (user.role === "admin" || user.role === "artist") && (
          <Link
            to={user.role === "admin" ? "/admin" : "/admin/studio"}
            className="hidden lg:flex items-center gap-2 bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-purple-500/30 px-4 py-2 rounded-full text-[#a1a1aa] hover:text-white text-[13px] font-medium transition-all duration-300"
          >
            <FontAwesomeIcon 
              icon={user.role === "admin" ? faCog : faMicrophone} 
              className={`w-3.5 h-3.5 ${user.role === "admin" ? "text-purple-500" : "text-[#ff2d55]"}`} 
            />
            <span>{user.role === "admin" ? "Quản trị hệ thống" : "Artist Studio"}</span>
          </Link>
        )}



        {isLoggedIn && <NotificationBell />}

        <a
          href="#"
          className="hidden lg:block text-[#a855f7] hover:text-[#c084fc] text-[13px] font-medium transition-colors"
        >
          Premium
        </a>

        {!isLoggedIn ? (
          <>
            <Link
              to="/signup"
              className="text-[#a1a1aa] hover:text-white text-[13px] font-medium transition-colors"
            >
              Đăng ký
            </Link>

            <Link
              to="/login"
              className="bg-white text-black text-[13px] font-semibold px-7 py-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
            >
              Đăng nhập
            </Link>
          </>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium shadow-lg border-2 border-white/10 hover:scale-105 transition-all cursor-pointer overflow-hidden"
            >
            {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.displayName?.charAt(0).toUpperCase() || "U"
              )}

            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-[#09090b] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 z-[100] animate-in fade-in zoom-in duration-200">
                <div className="px-5 py-4 border-b border-white/5 mb-1">
                  <p className="text-[10px] font-bold text-purple-500 tracking-[0.2em] uppercase mb-2">Tài khoản</p>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[15px] font-bold text-white truncate tracking-tight">{user.displayName || "Người dùng CMusic"}</p>
                    <p className="text-[12px] text-zinc-400 truncate font-medium">{user.email}</p>
                  </div>
                </div>

                
                <button className="w-full flex items-center justify-between px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all text-[13px] font-normal group">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
                    Hồ sơ
                  </div>
                </button>

                {user.role === "artist" && (
                  <button 
                    onClick={() => { navigate("/admin/studio"); setShowDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all text-[13px] font-normal group"
                  >
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faMicrophone} className="w-3.5 h-3.5 text-[#ff2d55]" />
                      Artist Studio
                    </div>
                  </button>
                )}

                <button className="w-full flex items-center justify-between px-4 py-2.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/5 transition-all text-[13px] font-medium group">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5" />
                    Nâng cấp Premium
                  </div>
                </button>

                <button className="w-full flex items-center justify-between px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all text-[13px] font-normal group">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCog} className="w-3.5 h-3.5" />
                    Cài đặt
                  </div>
                </button>

                <div className="h-px bg-white/5 my-1" />

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500/80 hover:text-red-400 hover:bg-red-500/5 transition-all text-[13px] font-normal"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
