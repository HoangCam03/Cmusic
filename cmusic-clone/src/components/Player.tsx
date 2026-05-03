import { useContext, useEffect, useState } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  faPlay,
  faPause,
  faStepForward,
  faStepBackward,
  faShuffle,
  faRepeat,
  faVolumeHigh,
  faExpand,
  faHeart,
  faMicrophone,
  faListUl,
} from "@fortawesome/free-solid-svg-icons";

export function Player() {
  const ctx = useContext(PlayerContext);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!ctx?.track?._id) return;
      
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLiked(false);
        return;
      }

      try {
        const res = await api.get(`/likes/tracks/${ctx.track._id}/check`);
        if (res.data.success) {
          setIsLiked(res.data.data.liked);
        }
      } catch (err) {
        console.error("Player like check error:", err);
      }
    };

    checkLikeStatus();

    // Listen for like changes from other components
    const handleLikeChange = (e: any) => {
      if (e.detail.trackId === ctx?.track?._id) {
        setIsLiked(e.detail.isLiked);
      }
    };
    window.addEventListener('like-change', handleLikeChange);
    return () => window.removeEventListener('like-change', handleLikeChange);
  }, [ctx?.track?._id]);

  const toggleLike = async () => {
    if (!ctx?.track?._id) return;
    
    const id = ctx.track._id;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thích bài hát");
      return;
    }

    try {
      const newStatus = !isLiked;
      if (isLiked) {
        await api.delete(`/likes/tracks/${id}`);
        setIsLiked(false);
        toast.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        await api.post(`/likes/tracks/${id}`);
        setIsLiked(true);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
      // Dispatch custom event for synchronization
      window.dispatchEvent(new CustomEvent('like-change', { detail: { trackId: id, isLiked: newStatus } }));
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái yêu thích");
    }
  };

  const formatTime = (min: number, sec: number) =>
    `${min}:${sec.toString().padStart(2, "0")}`;

  return (
    <div className="h-[90px] bg-[#121212] border-t border-white/5 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-[100] w-full">
      {/* Left: Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-0">
        <div className="w-14 h-14 rounded-md flex items-center justify-center shrink-0 shadow-2xl overflow-hidden bg-zinc-800">
          {ctx?.track?.image ? (
            <img src={ctx.track.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-6 h-6 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3H12z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white text-[14px] font-medium hover:underline cursor-pointer truncate tracking-tight">
            {ctx?.track?.title || "Chưa có bài hát"}
          </p>
          <p className="text-zinc-400 text-[11px] hover:underline hover:text-white cursor-pointer truncate mt-0.5 tracking-wide">
            {ctx?.track?.artist || "Nghệ sĩ CMusic"}
          </p>
        </div>
        <button 
          onClick={toggleLike}
          className={`transition-all ml-4 shrink-0 hover:scale-110 active:scale-90 ${isLiked ? "text-pink-500" : "text-zinc-500 hover:text-white"}`}
        >
          <FontAwesomeIcon icon={faHeart} className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Controls & Seek */}
      <div className="flex flex-col items-center gap-2 w-[40%] max-w-[722px]">
        <div className="flex items-center gap-6">
          <button onClick={ctx?.toggleShuffle} className={`${ctx?.isShuffle ? "text-purple-500" : "text-zinc-500"} hover:text-white transition-colors text-xs`}>
            <FontAwesomeIcon icon={faShuffle} />
          </button>
          <button onClick={ctx?.previous} className="text-zinc-400 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faStepBackward} className="w-4 h-4" />
          </button>
          <button
            onClick={ctx?.playStatus ? ctx.pause : ctx?.play}
            className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-xs"
          >
            <FontAwesomeIcon icon={ctx?.playStatus ? faPause : faPlay} className="ml-0.5" />
          </button>
          <button onClick={ctx?.next} className="text-zinc-400 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faStepForward} className="w-4 h-4" />
          </button>
          <button onClick={ctx?.toggleRepeat} className={`${ctx?.isRepeat ? "text-purple-500" : "text-zinc-500"} hover:text-white transition-colors text-xs`}>
            <FontAwesomeIcon icon={faRepeat} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full group">
          <span className="text-zinc-500 text-[11px] min-w-[32px] text-right">
            {ctx?.time ? formatTime(ctx.time.currentTime.minute, ctx.time.currentTime.second) : "0:00"}
          </span>
          <div
            ref={ctx?.seekBg}
            onClick={ctx?.seekSong}
            className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative"
          >
            <div
              ref={ctx?.seekBar}
              className="h-full bg-white group-hover:bg-purple-500 rounded-full transition-colors relative"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-zinc-500 text-[11px] min-w-[32px]">
            {ctx?.time ? formatTime(ctx.time.totalTime.minute, ctx.time.totalTime.second) : "0:00"}
          </span>
        </div>
      </div>

      {/* Right: Tools & Volume */}
      <div className="flex items-center gap-4 w-[30%] justify-end">
        <button className="text-zinc-500 hover:text-white transition-colors">
          <FontAwesomeIcon icon={faMicrophone} className="text-xs" />
        </button>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <FontAwesomeIcon icon={faListUl} className="text-xs" />
        </button>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <FontAwesomeIcon icon={faVolumeHigh} className="text-sm" />
        </button>
        <div className="w-[100px] h-1 bg-white/20 rounded-full relative group">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ctx?.volume}
            onChange={ctx?.changeVolume}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            style={{ width: `${(ctx?.volume || 0) * 100}%` }}
            className="h-full bg-zinc-300 group-hover:bg-purple-500 rounded-full transition-colors"
          />
        </div>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <FontAwesomeIcon icon={faExpand} className="text-sm" />
        </button>
      </div>
    </div>
  );
}
