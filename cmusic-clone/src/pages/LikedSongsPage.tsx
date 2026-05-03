import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, faPause, faClock, faHeart, faMusic
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";

export default function LikedSongsPage() {
  const navigate = useNavigate();
  const ctx = useContext(PlayerContext);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLikedTracks = async () => {
    try {
      const res = await api.get("/likes/tracks");
      if (res.data.success) {
        setTracks(res.data.data);
      }
    } catch (err) {
      console.error("Fetch liked tracks error:", err);
      toast.error("Không thể tải danh sách bài hát đã thích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedTracks();

    const handleLikeChange = () => {
      fetchLikedTracks();
    };
    window.addEventListener('like-change', handleLikeChange);
    return () => window.removeEventListener('like-change', handleLikeChange);
  }, []);

  // Cập nhật queue nếu đang phát từ danh sách này
  useEffect(() => {
    if (tracks.length > 0 && ctx?.track) {
      const isCurrentTrackInList = tracks.some((t: any) => t._id === ctx.track._id);
      if (isCurrentTrackInList) {
        // Có thể update queue ở đây nếu muốn
      }
    }
  }, [tracks]);

  if (loading) return <div className="p-8 text-white opacity-50 font-outfit">Đang tải danh sách bài hát...</div>;

  const isPlayingAny = ctx?.track && tracks.some((t: any) => t._id === ctx.track?._id) && ctx.playStatus;

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#121212] select-none">
      {/* Header Section */}
      <div className="relative h-[340px] px-8 flex items-end pb-8">
        {/* Pink Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-pink-900/40 to-pink-600/60" />
        
        <div className="relative z-10 flex items-end gap-6 w-full">
          {/* Cover Image */}
          <div className="w-48 h-48 lg:w-60 lg:h-60 shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-md bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 flex items-center justify-center overflow-hidden border border-white/5">
            <FontAwesomeIcon icon={faHeart} className="text-white text-7xl lg:text-9xl drop-shadow-2xl" />
          </div>

          <div className="flex flex-col gap-1 lg:gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white">Playlist</p>
            <h1 className="text-4xl lg:text-8xl font-black text-white tracking-tighter mb-2 leading-tight">
              Bài hát đã thích
            </h1>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="hover:underline cursor-pointer">
                {JSON.parse(localStorage.getItem("user") || "{}").displayName || "Người dùng"}
              </span>
              <span className="opacity-70">•</span>
              <span className="opacity-70 font-medium">{tracks.length} bài hát</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-6 flex items-center gap-8">
        <button
          onClick={() => tracks.length > 0 && ctx?.playWithId(tracks[0]._id, tracks)}
          className="w-14 h-14 bg-pink-500 hover:bg-pink-400 text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95"
          title={isPlayingAny ? "Tạm dừng" : "Phát tất cả"}
        >
          <FontAwesomeIcon icon={isPlayingAny ? faPause : faPlay} className="text-xl ml-0.5" />
        </button>
      </div>

      {/* Tracks List */}
      <div className="px-8">
        <div className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Album</span>
          <div className="flex justify-end"><FontAwesomeIcon icon={faClock} /></div>
        </div>

        {tracks.length > 0 ? (
          <div className="space-y-0.5">
            {tracks.map((track: any, index: number) => (
              <div
                key={track._id}
                onClick={() => ctx?.playWithId(track._id, tracks)}
                className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] items-center gap-4 px-4 py-2 rounded-md hover:bg-white/10 group transition-colors cursor-pointer"
              >
                <span className={`text-sm ${ctx?.track?._id === track._id ? "text-pink-500" : "text-zinc-400"}`}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={track.coverUrl} className="w-10 h-10 rounded shadow-lg" alt="" />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${ctx?.track?._id === track._id ? "text-pink-500" : "text-white"}`}>
                      {track.title}
                    </p>
                    <p className="text-zinc-400 text-xs truncate font-medium group-hover:text-white transition-colors">
                      {track.artist || "Nghệ sĩ"}
                    </p>
                  </div>
                </div>
                <span className="text-zinc-400 text-sm truncate">{track.album || "Đơn ca"}</span>
                <div className="flex justify-end text-zinc-400 text-xs font-medium">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faMusic} className="text-zinc-600 text-3xl" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-2">Các bài hát bạn thích sẽ xuất hiện ở đây</h3>
              <p className="text-zinc-400 text-sm">Tìm kiếm thêm bài hát để thêm vào danh sách yêu thích của bạn.</p>
            </div>
            <button 
              onClick={() => navigate("/search")}
              className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all"
            >
              Tìm bài hát
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
