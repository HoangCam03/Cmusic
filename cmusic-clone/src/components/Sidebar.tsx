import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faSearch,
  faBookmark,
  faPlus,
  faMusic,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch, useAppSelector } from "../store/store";
import { createNewPlaylist } from "../store/slices/playlistSlice";
import toast from "react-hot-toast";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: playlists } = useAppSelector((state) => state.playlists.items);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const handleCreatePlaylist = async () => {
    setShowPlusMenu(false);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tạo playlist");
      navigate("/signup");
      return;
    }

    try {
      console.log("Đang tạo playlist...");
      const resultAction = await dispatch(createNewPlaylist());
      
      if (createNewPlaylist.fulfilled.match(resultAction)) {
        // Log để anh kiểm tra trong Console (F12)
        console.log("Tạo playlist thành công:", resultAction.payload);
        
        // Lấy ID từ payload (hỗ trợ cả 2 cấu trúc data hoặc trực tiếp)
        const newId = resultAction.payload._id || resultAction.payload.data?._id;
        
        if (newId) {
          toast.success("Đã tạo playlist mới!");
          navigate(`/playlist/${newId}`);
        } else {
          console.error("Không tìm thấy ID trong dữ liệu trả về:", resultAction.payload);
          toast.error("Lỗi dữ liệu từ máy chủ");
        }
      } else {
        console.error("Tạo playlist thất bại:", resultAction.payload);
        toast.error("Không thể tạo playlist lúc này");
      }
    } catch (error) {
      console.error("Lỗi khi gọi dispatch:", error);
      toast.error("Đã xảy ra lỗi hệ thống");
    }
  };

  return (
    <div className="w-[300px] h-full flex flex-col shrink-0 select-none bg-transparent gap-2">

      {/* Top Panel: Logo & Nav Links */}
      <div className="bg-[#121212] rounded-xl flex flex-col pt-4 pb-3">
        {/* Logo */}
        <div className="px-5 pt-4 pb-5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shrink-0 transform group-hover:rotate-6 transition-transform duration-300">
              <span className="text-white font-bold text-base leading-none">C</span>
            </div>
            <span className="text-white font-bold text-[18px] tracking-tight font-outfit">CMusic</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          <Link
            to="/"
            className={`flex items-center gap-5 px-4 py-3 rounded-lg font-bold text-[14px] transition-all duration-300 ${location.pathname === "/"
                ? "text-white"
                : "text-zinc-400 hover:text-white"
              }`}
          >
            <FontAwesomeIcon
              icon={faHome}
              className="w-5 h-5"
            />
            Trang chủ
          </Link>

          <Link
            to="/search"
            className={`flex items-center gap-5 px-4 py-3 rounded-lg font-bold text-[14px] transition-all duration-300 ${location.pathname === "/search"
                ? "text-white"
                : "text-zinc-400 hover:text-white"
              }`}
          >
            <FontAwesomeIcon
              icon={faSearch}
              className="w-5 h-5"
            />
            Tìm kiếm
          </Link>

          <Link
            to="/premium"
            className={`flex items-center gap-5 px-4 py-3 rounded-lg font-bold text-[14px] transition-all duration-300 mt-2 bg-gradient-to-r from-purple-600/20 to-pink-500/20 border border-purple-500/10 hover:border-purple-500/30 ${location.pathname === "/premium"
                ? "text-purple-400"
                : "text-zinc-300 hover:text-white"
              }`}
          >
            <FontAwesomeIcon
              icon={faMusic}
              className="w-5 h-5 text-purple-500"
            />
            Nâng cấp Premium
          </Link>
        </nav>
      </div>

      {/* Bottom Panel: Library Section */}
      <div className="flex-1 bg-[#121212] rounded-xl flex flex-col overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors cursor-pointer group">
            <FontAwesomeIcon icon={faBookmark} className="w-5 h-5 group-hover:scale-105 transition-transform" />
            <span className="text-[14px] font-bold">Thư viện</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              title="Thêm playlist"
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${showPlusMenu ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            </button>

            {showPlusMenu && (
              <div className="absolute top-10 right-0 w-64 bg-[#282828] rounded shadow-[0_16px_24px_rgba(0,0,0,0.5),0_6px_8px_rgba(0,0,0,0.2)] py-1 z-[100] origin-top-right border border-white/5">
                <button 
                  onClick={handleCreatePlaylist}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-white/10 transition-colors group/item"
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faMusic} className="text-zinc-400 text-sm group-hover/item:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium">Tạo danh sách phát mới</p>
                    <p className="text-zinc-400 text-[11px] leading-tight">Tạo danh sách phát gồm các bài hát hoặc tập podcast</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Liked Songs Shortcut */}
        <div className="px-2 mb-2">
          <Link
            to="/collection/tracks"
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group ${
              location.pathname === "/collection/tracks" ? "bg-white/10" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shrink-0">
              <FontAwesomeIcon icon={faHeart} className="text-white text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-[14px] font-bold truncate tracking-tight">Bài hát đã thích</p>
              <p className="text-zinc-500 text-[12px] font-medium tracking-tight">Danh sách phát cá nhân</p>
            </div>
          </Link>
        </div>

        {/* Scrollable Library Cards & Playlists */}
        <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1 custom-scrollbar">
          {playlists.length > 0 ? (
            playlists.map((playlist: any) => (
              <Link
                key={playlist._id}
                to={`/playlist/${playlist._id}`}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group ${
                  location.pathname === `/playlist/${playlist._id}` ? "bg-white/10" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                  {playlist.thumbnail ? (
                    <img src={playlist.thumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <FontAwesomeIcon icon={faMusic} className="text-zinc-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-[14px] font-bold truncate tracking-tight">{playlist.name}</p>
                  <p className="text-zinc-500 text-[12px] font-medium tracking-tight">Playlist • {playlist.tracks?.length || 0} bài hát</p>
                </div>
              </Link>
            ))
          ) : (
            <>
              {/* Card 1 - Tạo playlist (Chỉ hiện khi chưa có playlist nào) */}
              <div className="m-2 p-5 rounded-xl bg-[#242424] flex flex-col gap-4 shadow-lg border border-white/[0.02]">
                <div className="space-y-1">
                  <p className="text-white font-bold text-[15px] tracking-tight">Tạo playlist đầu tiên</p>
                  <p className="text-zinc-300 text-[12px] leading-relaxed font-medium opacity-90">
                    Chúng tôi sẽ giúp bạn một tay.
                  </p>
                </div>
                <button
                  onClick={handleCreatePlaylist}
                  className="w-fit bg-white text-black text-[13px] font-bold px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Tạo danh sách phát
                </button>
              </div>

              {/* Card 2 - Podcast */}
              <div className="m-2 p-5 rounded-xl bg-[#242424] flex flex-col gap-4 shadow-lg border border-white/[0.02]">
                <div className="space-y-1">
                  <p className="text-white font-bold text-[15px] tracking-tight">Thêm nội dung yêu thích</p>
                  <p className="text-zinc-300 text-[12px] leading-relaxed font-medium opacity-90">
                    Theo dõi các nghệ sĩ để cập nhật bài hát.
                  </p>
                </div>
                <button className="w-fit bg-white text-black text-[13px] font-bold px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-all duration-200">
                  Duyệt ngay
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="px-6 pb-6 pt-4 flex flex-wrap gap-x-4 gap-y-2 opacity-50 hover:opacity-100 transition-opacity">
          {["Điều khoản", "Quyền riêng tư", "Cookie"].map((link) => (
            <a key={link} href="#" className="text-[11px] text-zinc-400 font-medium hover:underline">
              {link}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
