import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const CMusicLogo = () => (
  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
    <span className="text-white font-black text-lg italic leading-none">C</span>
  </div>
);

export function Header() {
  return (
    <header className="h-[72px] bg-[#18181b] rounded-2xl flex items-center justify-between px-6 shrink-0 border border-white/5 shadow-lg">
      <div className="flex items-center gap-5">
        <Link to="/" title="CMusic">
          <CMusicLogo />
        </Link>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center bg-[#27272a] rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition-all duration-300 shadow-inner">
            <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-[#27272a] rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition-all duration-300 shadow-inner">
            <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-[400px] mx-6">
        <div className="relative group">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-purple-400 transition-colors w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ..."
            className="w-full bg-[#27272a] text-white text-[13px] font-medium pl-11 pr-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-purple-500/50 border border-transparent transition-all duration-300 placeholder:text-[#71717a]"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <a href="#" className="hidden lg:block text-[#a1a1aa] text-[13px] font-bold hover:text-white transition">
          Premium
        </a>
        <div className="w-px h-4 bg-white/10 hidden lg:block" />
        <Link to="/signup" className="text-[#a1a1aa] hover:text-white text-[13px] font-bold transition">
          Đăng ký
        </Link>
        <Link to="/login" className="bg-white text-black text-[13px] font-bold px-6 py-2 rounded-full hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition">
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}
