import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faSearch,
  faBookmark,
  faPlus,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-[280px] h-full flex flex-col shrink-0 select-none overflow-hidden border-r border-white/5 bg-[#09090b]">
      {/* Logo */}
      <div className="px-7 pt-7 pb-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shrink-0 transform group-hover:rotate-6 transition-transform duration-300">
            <span className="text-white font-bold text-lg leading-none">C</span>
          </div>
          <span className="text-white font-semibold text-[22px] tracking-tight font-outfit">CMusic</span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="px-4 flex flex-col gap-1.5">
        <Link
          to="/"
          className={`flex items-center gap-4 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all duration-300 ${
            location.pathname === "/"
              ? "bg-white/5 text-white shadow-sm"
              : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <FontAwesomeIcon
            icon={faHome}
            className={`w-4 h-4 ${location.pathname === "/" ? "text-purple-400" : ""}`}
          />
          Trang chủ
        </Link>

        <Link
          to="/search"
          className={`flex items-center gap-4 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all duration-300 ${
            location.pathname === "/search"
              ? "bg-white/5 text-white shadow-sm"
              : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <FontAwesomeIcon
            icon={faSearch}
            className={`w-4 h-4 ${location.pathname === "/search" ? "text-purple-400" : ""}`}
          />
          Tìm kiếm
        </Link>

        <Link
          to="/library"
          className={`flex items-center gap-4 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all duration-300 ${
            location.pathname === "/library"
              ? "bg-white/5 text-white shadow-sm"
              : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <FontAwesomeIcon
            icon={faBookmark}
            className={`w-4 h-4 ${location.pathname === "/library" ? "text-purple-400" : ""}`}
          />
          Thư viện
        </Link>
      </nav>

      {/* Library Section */}
      <div className="flex-1 mt-6 flex flex-col overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-7 py-2 group">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.1em] whitespace-nowrap">
            Thư viện của bạn
          </span>
          <div className="flex items-center gap-1 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title="Thêm playlist"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 hover:text-white transition-all"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            </button>
            <button
              title="Xem thêm"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 hover:text-white transition-all"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 mt-3 custom-scrollbar">
          {/* Card 1 - Tạo playlist */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/40 transition-all duration-300 group">
            <p className="text-white font-medium text-[14px] mb-1.5 tracking-tight">Tạo playlist đầu tiên</p>
            <p className="text-zinc-500 text-[12px] mb-5 leading-relaxed font-light">
              Chúng tôi có hàng triệu bài hát dành cho bạn.
            </p>
            <Link
              to="/playlists"
              className="inline-block bg-white text-black text-[12px] font-semibold px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
            >
              Tạo playlist
            </Link>
          </div>

          {/* Card 2 - Podcast */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/40 transition-all duration-300 group">
            <p className="text-white font-medium text-[14px] mb-1.5 tracking-tight">Khám phá Podcast</p>
            <p className="text-zinc-500 text-[12px] mb-5 leading-relaxed font-light">
              Cập nhật podcast hot nhất mỗi ngày.
            </p>
            <button className="bg-white text-black text-[12px] font-semibold px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg">
              Duyệt podcast
            </button>
          </div>
        </div>

        {/* Footer links */}
        <div className="px-8 pb-6 pt-2 flex flex-wrap gap-x-4 gap-y-2 opacity-30 hover:opacity-100 transition-opacity">
          {["Điều khoản", "Quyền riêng tư", "Cookie"].map((link) => (
            <a key={link} href="#" className="text-[11px] text-zinc-400 font-light hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
