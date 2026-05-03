import { useEffect, useState } from "react";
import api from "../services/api";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMusic, 
  faUsers, 
  faHeadphones, 
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

interface Track {
  _id: string;
  title: string;
  artistId: {
    displayName: string;
    avatarUrl: string;
  };
  coverUrl: string;
  playCount: number;
}

export default function AdminPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    totalTracks: 0,
    totalPlays: 0,
    growth: "0%"
  });

  const fetchTracks = async () => {
    try {
      const response = await api.get(`/catalog/tracks?limit=5`);
      if (response.data.success) {
        setTracks(response.data.data.tracks);
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const response = await api.get("/history/global-stats");
      if (response.data.success) {
        setGlobalStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching global stats:", error);
    }
  };

  useEffect(() => {
    fetchTracks();
    fetchGlobalStats();

    // Kết nối Socket.io để nhận dữ liệu Realtime
    const socket = io(SOCKET_URL);
    
    socket.on("connect", () => {
      console.log("[Admin] Connected to socket server");
      socket.emit("join_admin_room");
    });

    socket.on("track_played", (data: any) => {
      console.log("[Realtime]: Một bài hát vừa được phát!", data);
      // Refresh lại danh sách nhạc để thấy lượt nghe nhảy số ngay lập tức
      fetchTracks();
      fetchGlobalStats();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = [
    { label: "Tổng số nhạc", value: globalStats.totalTracks.toLocaleString(), icon: faMusic, growth: "+12%", desc: "Dữ liệu âm nhạc" },
    { label: "Người dùng", value: globalStats.totalUsers.toLocaleString(), icon: faUsers, growth: "+8.2%", desc: "Tổng cộng" },
    { label: "Tổng lượt phát", value: (globalStats.totalPlays >= 1000 ? (globalStats.totalPlays / 1000).toFixed(1) + "K" : globalStats.totalPlays.toString()), icon: faHeadphones, growth: globalStats.growth, desc: "Phát trực tiếp" },
    { label: "Tỉ lệ tăng trưởng", value: "15.3%", icon: faArrowTrendUp, growth: "+4.1%", desc: "Tháng này" },
  ];

  const topArtists = [
    { name: "IU", tracks: 45, plays: "12.5M", avatar: "A" },
    { name: "BTS", tracks: 78, plays: "98.7M", avatar: "B" },
    { name: "NewJeans", tracks: 12, plays: "45.2M", avatar: "N" },
    { name: "LE SSERAFIM", tracks: 18, plays: "23.4M", avatar: "L" },
  ];

  return (
    <div className="flex flex-col font-inter antialiased bg-[#050505]">
      {/* 1. Page Header Section - Synchronized with BlackPink Theme */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
          <div>
            <h1 className="text-white text-[18px] font-bold tracking-tight leading-none">Tổng quan</h1>
            <p className="text-zinc-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-70">Chào mừng bạn trở lại hệ thống quản trị CMusic</p>
          </div>
        </div>
      </div>



      {/* 2. Main Dashboard Content */}
      <div className="p-10 space-y-8">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#080808] p-6 rounded-xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 group cursor-default">
              <div className="flex justify-between items-start mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 group-hover:text-white transition-all duration-300">
                  <FontAwesomeIcon 
                    icon={stat.icon} 
                    className="text-[11px] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" 
                  />
                </div>

                <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full tracking-tight">
                   {stat.growth}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[24px] font-bold text-white tracking-tighter leading-none">{stat.value}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-[9px] text-zinc-700">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Columns - Matching the Korean Sample */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recently Popular Tracks Block */}
          <div className="lg:col-span-2 bg-[#080808] rounded-xl border border-white/[0.08] flex flex-col">
            <div className="px-8 py-5 border-b border-white/[0.08]">
              <h2 className="text-white text-[13px] font-bold">Nhạc phổ biến gần đây</h2>
            </div>


            <div className="p-4 flex flex-col">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/[0.02] animate-pulse rounded mb-2" />
                ))
              ) : tracks.map((track, i) => (
                <div 
                  key={track._id} 
                  className={`flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] px-4 py-3 rounded-lg transition-all ${
                    i !== tracks.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-zinc-600 text-[11px] w-4">{i + 1}</span>
                    <div className="w-10 h-10 bg-[#111111] rounded overflow-hidden border border-white/[0.05]">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faMusic} className="text-zinc-800 text-[10px]" />
                        </div>
                      )}
                    </div>
                    <div className="-space-y-0.5">
                      <p className="text-white text-[13px] font-bold">{track.title}</p>
                      <p className="text-zinc-500 text-[11px]">{track.artistId?.displayName || "Artist"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <FontAwesomeIcon icon={faHeadphones} className="text-[10px] opacity-40" />
                    <span className="text-[11px] font-medium tracking-tight">{(track.playCount / 1000).toFixed(1)}M</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Artists Block */}
          <div className="bg-[#080808] rounded-xl border border-white/[0.08] flex flex-col">
            <div className="px-8 py-5 border-b border-white/[0.08]">
              <h2 className="text-white text-[13px] font-bold">Nghệ sĩ phổ biến</h2>
            </div>

            <div className="p-4 flex flex-col">
              {topArtists.map((artist, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between group cursor-pointer px-4 py-3 hover:bg-white/[0.02] rounded-lg transition-all ${
                    i !== topArtists.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-[#111111] rounded-full flex items-center justify-center text-zinc-500 font-bold text-[11px] border border-white/[0.08]">
                      {artist.avatar}
                    </div>
                    <div className="-space-y-0.5">
                      <p className="text-white text-[13px] font-bold">{artist.name}</p>
                      <p className="text-zinc-500 text-[11px]">{artist.tracks} bài hát</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-[12px] font-bold">{artist.plays}</p>
                    <p className="text-zinc-600 text-[10px]">Phát</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
