import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheckCircle, 
  faPlay, 
  faPause,
  faEllipsisH
} from "@fortawesome/free-solid-svg-icons";
import { PlayerContext } from "../context/PlayerContext";

interface Artist {
  _id: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  gallery: string[];
  stats: {
    monthlyListeners: number;
    followerCount: number;
    totalPlays?: number;
    totalTracks?: number;
  };
  socials: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  isVerified: boolean;
}

const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerCtx = useContext(PlayerContext);
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Artist Profile
        const artistRes = await api.get(`/catalog/artists/${id}`);
        if (artistRes.data.success) {
          setArtist(artistRes.data.data);
        }

        // 2. Fetch Artist Tracks (Popular)
        const tracksRes = await api.get(`/catalog/tracks/artist/${id}`);
        if (tracksRes.data.success) {
          setTracks(tracksRes.data.data);
        }

        // 3. Check Follow Status
        const followRes = await api.get(`/catalog/artists/${id}/follow/check`);
        if (followRes.data.success) {
          setIsFollowing(followRes.data.data.isFollowing);
        }
      } catch (error) {
        console.error("Error fetching artist details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchArtistData();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!artist) return;
    try {
      if (isFollowing) {
        await api.delete(`/catalog/artists/${id}/follow`);
        setIsFollowing(false);
        setArtist(prev => prev ? { 
          ...prev, 
          stats: { ...prev.stats, followerCount: Math.max(0, (prev.stats.followerCount || 1) - 1) } 
        } : null);
      } else {
        await api.post(`/catalog/artists/${id}/follow`);
        setIsFollowing(true);
        setArtist(prev => prev ? { 
          ...prev, 
          stats: { ...prev.stats, followerCount: (prev.stats.followerCount || 0) + 1 } 
        } : null);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#09090b]">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#09090b] text-zinc-500">
        <h2 className="text-xl font-bold mb-4">Không tìm thấy hồ sơ nghệ sĩ</h2>
        <button onClick={() => navigate("/")} className="text-white hover:underline uppercase text-xs font-black tracking-widest">Quay lại trang chủ</button>
      </div>
    );
  }

  const isCurrentArtistPlaying = tracks.some(t => t._id === playerCtx?.track?._id) && playerCtx?.playStatus;

  return (
    <div className="flex-1 bg-[#09090b] overflow-y-auto custom-scrollbar relative">
      
      {/* 1. Hero Banner */}
      <div className="relative h-[45vh] w-full min-h-[350px]">
        {/* Banner Image */}
        <div className="absolute inset-0">
          <img 
            src={artist.bannerUrl || artist.avatarUrl} 
            className="w-full h-full object-cover" 
            alt={artist.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-black/40 to-transparent" />
        </div>

        {/* Artist Header Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-4">
          <div className="flex items-center gap-2">
            {artist.isVerified && (
              <div className="flex items-center gap-1.5 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 px-3 py-1 rounded-full">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-400 text-sm" />
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Nghệ sĩ xác minh</span>
              </div>
            )}
          </div>
          
          <h1 className="text-white text-6xl md:text-8xl font-black tracking-tighter drop-shadow-2xl uppercase">
            {artist.name}
          </h1>

          <p className="text-white/90 text-sm font-bold tracking-tight drop-shadow-lg">
            {artist.stats?.monthlyListeners?.toLocaleString() || "1.234.567"} người nghe hằng tháng
          </p>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="p-8 md:px-12 flex items-center gap-8 bg-gradient-to-b from-black/20 to-transparent">
        <button 
           onClick={() => tracks[0] && playerCtx?.playWithId(tracks[0]._id, tracks)}
           className="w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all group"
        >
          <FontAwesomeIcon icon={isCurrentArtistPlaying ? faPause : faPlay} className="text-xl ml-1" />
        </button>

        <button 
          onClick={handleFollowToggle}
          className={`px-8 py-2.5 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${
            isFollowing 
            ? "bg-white text-black border-white" 
            : "bg-transparent text-white border-white/20 hover:border-white"
          }`}
        >
          {isFollowing ? "Đang theo dõi" : "Theo dõi"}
        </button>

        <button className="text-zinc-500 hover:text-white transition-colors text-xl">
          <FontAwesomeIcon icon={faEllipsisH} />
        </button>
      </div>

      {/* 3. Content Sections - Tối ưu 1 cột duy nhất */}
      <div className="p-8 md:px-12 max-w-5xl">
        
        {/* Popular Tracks */}
        <section className="mb-12">
          <h2 className="text-white text-xl font-bold mb-6">Phổ biến</h2>
          <div className="space-y-1">
            {tracks.slice(0, 5).map((t, idx) => (
              <div 
                key={t._id}
                onClick={() => playerCtx?.playWithId(t._id, tracks)}
                className={`flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 group transition-all cursor-pointer ${
                  playerCtx?.track?._id === t._id ? "bg-white/5" : ""
                }`}
              >
                <span className="w-4 text-zinc-600 font-bold text-sm text-center group-hover:hidden">
                  {idx + 1}
                </span>
                <div className="hidden group-hover:flex w-4 items-center justify-center">
                   <FontAwesomeIcon icon={faPlay} className="text-purple-500 text-[10px]" />
                </div>
                
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 shadow-lg">
                  <img src={t.coverUrl} className="w-full h-full object-cover" alt="" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${playerCtx?.track?._id === t._id ? "text-purple-400" : "text-white"}`}>
                    {t.title}
                  </p>
                  <p className="text-zinc-500 text-[11px] font-medium tracking-wide">
                    {(t.playCount || 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="text-zinc-500 text-xs font-medium w-12 text-right">
                  {Math.floor(t.duration / 60)}:{(t.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discography Grid */}
        <section>
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">Danh sách đĩa nhạc</h2>
              <button className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Hiện tất cả</button>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tracks.slice(0, 5).map(t => (
                <div key={t._id} className="bg-zinc-900/20 hover:bg-zinc-900/60 p-4 rounded-2xl border border-white/5 transition-all group cursor-pointer">
                   <div className="aspect-square rounded-xl overflow-hidden shadow-2xl mb-4 relative">
                      <img src={t.coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform">
                            <FontAwesomeIcon icon={faPlay} className="text-white ml-1" />
                         </div>
                      </div>
                   </div>
                   <p className="text-white text-sm font-bold truncate mb-1">{t.title}</p>
                   <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-black">2024 • Đĩa đơn</p>
                </div>
              ))}
           </div>
        </section>

      </div>

      <div className="h-32 w-full" />
    </div>
  );
};

export default ArtistDetailPage;
