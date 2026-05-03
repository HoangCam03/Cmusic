import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, 
  faPause,
  faEllipsisH,
  faClock,
  faHeart
} from "@fortawesome/free-solid-svg-icons";
import { PlayerContext } from "../context/PlayerContext";

interface Album {
  _id: string;
  title: string;
  coverUrl: string;
  artistId: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  releaseDate: string;
  genre: string[];
  trackIds: any[];
  isSingle: boolean;
}

const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerCtx = useContext(PlayerContext);
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/catalog/albums/${id}`);
        if (res.data.success) {
          setAlbum(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching album details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAlbumData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#121212]">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] text-zinc-500">
        <h2 className="text-xl font-bold mb-4">Không tìm thấy Album</h2>
        <button onClick={() => navigate("/")} className="text-white hover:underline uppercase text-xs font-black tracking-widest">Quay lại trang chủ</button>
      </div>
    );
  }

  const isCurrentAlbumPlaying = album.trackIds.some(t => t._id === playerCtx?.track?._id) && playerCtx?.playStatus;

  return (
    <div className="flex-1 bg-[#121212] overflow-y-auto custom-scrollbar relative">
      
      {/* 1. Album Header Section */}
      <div className="relative p-8 pb-10 flex flex-col md:flex-row items-end gap-8 bg-gradient-to-b from-purple-900/40 via-purple-900/10 to-[#121212]">
        {/* Album Artwork */}
        <div className="w-52 h-52 md:w-64 md:h-64 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden shrink-0 group relative">
          <img 
            src={album.coverUrl} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            alt={album.title} 
          />
        </div>

        {/* Album Meta Info */}
        <div className="flex-1 space-y-4">
          <p className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-70">Album</p>
          <h1 className="text-white text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl uppercase truncate">
            {album.title}
          </h1>
          <div className="flex items-center flex-wrap gap-2 text-white/90 text-[13px] font-bold tracking-tight">
            <Link to={`/artist/${album.artistId._id}`} className="hover:underline flex items-center gap-2">
              <img src={album.artistId.avatarUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=50"} className="w-6 h-6 rounded-full object-cover" alt="" />
              <span>{album.artistId.displayName}</span>
            </Link>
            <span className="opacity-40">•</span>
            <span>{new Date(album.releaseDate).getFullYear()}</span>
            <span className="opacity-40">•</span>
            <span>{album.trackIds.length} bài hát</span>
          </div>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="px-8 flex items-center gap-8 mb-8 sticky top-0 bg-[#121212]/80 backdrop-blur-md py-4 z-10 border-b border-white/5 mx-2 rounded-xl">
        <button 
           onClick={() => album.trackIds[0] && playerCtx?.playWithId(album.trackIds[0]._id, album.trackIds)}
           className="w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all group"
        >
          <FontAwesomeIcon icon={isCurrentAlbumPlaying ? faPause : faPlay} className="text-xl ml-1" />
        </button>

        <button className="text-zinc-400 hover:text-white transition-colors text-2xl">
          <FontAwesomeIcon icon={faHeart} />
        </button>
        
        <button className="text-zinc-400 hover:text-white transition-colors text-xl">
          <FontAwesomeIcon icon={faEllipsisH} />
        </button>
      </div>

      {/* 3. Track List Table */}
      <div className="px-8 pb-12">
        <div className="grid grid-cols-[40px_1fr_120px_80px] px-4 py-2 text-zinc-500 text-[11px] font-black uppercase tracking-widest border-b border-white/5 mb-4 opacity-50">
          <div className="text-center">#</div>
          <div>Tiêu đề</div>
          <div>Thành tích</div>
          <div className="text-right">
            <FontAwesomeIcon icon={faClock} />
          </div>
        </div>

        <div className="flex flex-col">
          {album.trackIds.map((track, index) => {
            const isPlaying = playerCtx?.track?._id === track._id;
            
            return (
              <div 
                key={track._id}
                onDoubleClick={() => playerCtx?.playWithId(track._id, album.trackIds)}
                className={`grid grid-cols-[40px_1fr_120px_80px] px-4 py-3 rounded-xl items-center group hover:bg-white/5 transition-all cursor-pointer ${isPlaying ? 'bg-purple-600/10' : ''}`}
              >
                <div className="text-center">
                  <span className={`text-sm font-bold opacity-60 group-hover:hidden ${isPlaying ? 'text-purple-400' : 'text-zinc-500'}`}>
                    {index + 1}
                  </span>
                  <FontAwesomeIcon 
                    icon={isPlaying && playerCtx?.playStatus ? faPause : faPlay} 
                    className={`hidden group-hover:block text-[10px] mx-auto ${isPlaying ? 'text-purple-400' : 'text-white'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      playerCtx?.playWithId(track._id, album.trackIds);
                    }}
                  />
                </div>
                <div className="min-w-0 pr-4">
                  <p className={`font-bold text-[15px] tracking-tight truncate ${isPlaying ? 'text-purple-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-[12px] font-bold text-zinc-500 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
                <div className="text-[13px] font-bold text-zinc-500 opacity-60">
                  {track.playCount?.toLocaleString() || "0"}
                </div>
                <div className="text-right text-[13px] font-bold text-zinc-500 opacity-60">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetailPage;
