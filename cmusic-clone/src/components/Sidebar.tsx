import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faSearch,
  faBookmark,
  faPlus,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-[300px] h-full flex flex-col gap-3 shrink-0">
      {/* Nav Block - Glassmorphism */}
      <div className="bg-[#18181b] rounded-2xl px-5 py-4 flex flex-col gap-5 border border-white/5 shadow-lg">
        <Link
          to="/"
          className={`flex items-center gap-4 font-bold text-sm transition-all duration-300 ${
            location.pathname === "/" ? "text-white translate-x-1" : "text-[#a1a1aa] hover:text-white"
          }`}
        >
          <FontAwesomeIcon icon={faHome} className="w-5 h-5 text-purple-400" />
          Trang chủ
        </Link>
        <Link
          to="/search"
          className={`flex items-center gap-4 font-bold text-sm transition-all duration-300 ${
            location.pathname === "/search" ? "text-white translate-x-1" : "text-[#a1a1aa] hover:text-white"
          }`}
        >
          <FontAwesomeIcon icon={faSearch} className="w-5 h-5 text-pink-400" />
          Tìm kiếm
        </Link>
      </div>

      {/* Library Block - Glassmorphism */}
      <div className="bg-[#18181b] rounded-2xl p-5 flex-1 flex flex-col overflow-hidden border border-white/5 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <Link
            to="/playlists"
            className="flex items-center gap-4 font-bold text-sm text-[#a1a1aa] hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faBookmark} className="w-5 h-5" />
            Thư viện
          </Link>
          <div className="flex items-center gap-2 text-[#a1a1aa]">
            <button title="Thêm playlist" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-all duration-300">
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            </button>
            <button title="Xem thêm" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-all duration-300">
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <p className="text-white font-bold text-[15px] mb-1.5">Tạo playlist đầu tiên</p>
            <p className="text-[#a1a1aa] text-xs mb-5 font-medium leading-relaxed">Chúng tôi có hàng triệu bài hát dành cho bạn.</p>
            <Link
              to="/playlists"
              className="inline-block bg-white text-black text-xs font-bold px-5 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-300"
            >
              Tạo playlist
            </Link>
          </div>

           <div className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <p className="text-white font-bold text-[15px] mb-1.5">Khám phá Podcast</p>
            <p className="text-[#a1a1aa] text-xs mb-5 font-medium leading-relaxed">Cập nhật podcast hot nhất mỗi ngày.</p>
            <button className="bg-white text-black text-xs font-bold px-5 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-300">
              Duyệt podcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
