import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, faPause, faClock, faMusic, faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export function GenreDetailPage() {
  const { genreName } = useParams<{ genreName: string }>();
  const navigate = useNavigate();
  const ctx = useContext(PlayerContext);
  const { items: allSongs } = useSelector((state: RootState) => state.songs);

  const [filteredSongs, setFilteredSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup");
      return;
    }

    if (genreName && allSongs.length > 0) {
      const searchGenre = genreName.toLowerCase();
      const filtered = allSongs.filter((s: any) => {
        const songGenre = Array.isArray(s.genre) ? s.genre.join(" ") : (s.genre || "");
        const songCategory = Array.isArray(s.category) ? s.category.join(" ") : (s.category || "");
        return songGenre.toLowerCase().includes(searchGenre) || 
               songCategory.toLowerCase().includes(searchGenre);
      });
      setFilteredSongs(filtered);
      setLoading(false);
    } else if (allSongs.length > 0) {
        setLoading(false);
    }
  }, [genreName, allSongs]);

  if (loading) return <div className="p-8 text-white opacity-50 font-outfit">Đang tải danh sách bài hát...</div>;

  const isPlaying = ctx?.track && filteredSongs.some((t: any) => t._id === ctx.track?._id) && ctx.playStatus;

  // Tính tổng thời lượng
  const totalSeconds = filteredSongs.reduce((acc: number, track: any) => acc + (track.duration || 0), 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const durationString = `${totalMinutes} phút ${totalSeconds % 60} giây`;

  // Chọn ảnh bìa đại diện là bài đầu tiên
  const coverImage = filteredSongs[0]?.image || filteredSongs[0]?.coverUrl || "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500";

  // Màu sắc theo thể loại (để tạo điểm nhấn)
  const genreColors: Record<string, string> = {
    "V-Pop": "from-pink-600 to-rose-900",
    "K-Pop": "from-purple-600 to-indigo-900",
    "US-UK": "from-blue-600 to-cyan-900",
    "Lo-Fi": "from-orange-600 to-amber-900",
    "Rap": "from-red-600 to-zinc-900",
    "Top": "from-emerald-600 to-teal-900"
  };
  const bgGradient = genreColors[genreName || ""] || "from-purple-800 to-zinc-900";

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#121212] font-outfit select-none">
      {/* Header Section */}
      <div className="relative h-[340px] px-8 flex items-end pb-8 group">
        {/* Dynamic Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-t ${bgGradient} opacity-60 group-hover:opacity-80 transition-opacity duration-1000`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/20" />
        
        <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all z-20"
        >
            <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <div className="relative z-10 flex items-end gap-8 w-full">
          {/* Cover Image */}
          <div className="w-48 h-48 lg:w-60 lg:h-60 shrink-0 shadow-[0_12px_48px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden border border-white/10">
            <img src={coverImage} className="w-full h-full object-cover" alt={genreName} />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/90">
              Tuyển tập thông minh
            </p>
            <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter mb-4 leading-none">
              {genreName}
            </h1>
            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] shadow-lg">
                    C
                </div>
                <span className="hover:underline cursor-pointer tracking-tight">CMusic Editor</span>
              </div>
              <span className="opacity-60">•</span>
              <span className="opacity-80 font-medium">{filteredSongs.length} bài hát, khoảng {durationString}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-8 flex items-center gap-8 sticky top-0 bg-[#121212]/80 backdrop-blur-md z-30 border-b border-white/5 mx-2 rounded-t-2xl mt-[-10px]">
        <button
          onClick={() => filteredSongs.length > 0 && ctx?.playWithId(filteredSongs[0]._id, filteredSongs)}
          className="w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(147,51,234,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xl ml-0.5" />
        </button>
      </div>

      {/* Tracks List */}
      <div className="px-8 mt-4">
        <div className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/5 text-zinc-500 text-[11px] font-black uppercase tracking-[0.1em] mb-4">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Album</span>
          <div className="flex justify-end"><FontAwesomeIcon icon={faClock} /></div>
        </div>

        <div className="space-y-1">
          {filteredSongs.map((track: any, index: number) => (
            <div
              key={track._id}
              onClick={() => ctx?.playWithId(track._id, filteredSongs)}
              className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.04] group transition-all cursor-pointer border border-transparent hover:border-white/5"
            >
              <span className={`text-[13px] font-bold ${ctx?.track?._id === track._id ? "text-purple-400" : "text-zinc-500"}`}>
                {index + 1}
              </span>
              <div className="flex items-center gap-4 min-w-0">
                <img src={track.coverUrl || track.image} className="w-11 h-11 rounded-lg shadow-lg group-hover:scale-105 transition-transform" alt="" />
                <div className="min-w-0">
                  <p className={`text-[15px] font-bold truncate tracking-tight ${ctx?.track?._id === track._id ? "text-purple-400" : "text-white"}`}>
                    {track.title}
                  </p>
                  <p className="text-zinc-500 text-xs truncate font-bold mt-0.5 group-hover:text-zinc-300 transition-colors">
                    {track.artist}
                  </p>
                </div>
              </div>
              <span className="text-zinc-500 text-sm truncate font-medium">
                {track.albumId?.name || "Single"}
              </span>
              <div className="flex justify-end text-zinc-500 text-sm font-bold tracking-tight">
                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          ))}

          {filteredSongs.length === 0 && (
            <div className="py-20 text-center">
                <FontAwesomeIcon icon={faMusic} className="text-zinc-800 text-6xl mb-4" />
                <p className="text-zinc-500 font-bold">Chưa có bài hát nào trong thể loại này</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
