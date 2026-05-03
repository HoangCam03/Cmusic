import { useEffect, useState } from "react";
import api from "../services/api";
import { io } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMusic, 
  faUsers, 
  faHeadphones, 
  faArrowTrendUp,
  faEdit,
  faPlus,
  faCrown,
  faFire,
  faChartLine
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

interface Track {
  _id: string;
  title: string;
  coverUrl: string;
  playCount: number;
  duration: number;
  createdAt: string;
}

export default function ArtistStudioPage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [topFans, setTopFans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalPlays: 0,
    followers: 0,
    monthlyListeners: 0
  });

  const fetchMyData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Tracks
      const tracksRes = await api.get("/catalog/tracks?mine=true&limit=100");
      
      // 2. Fetch Analytics from History Service
      const analyticsRes = await api.get("/history/artist-stats");
      
      if (tracksRes.data.success) {
        const myTracks = tracksRes.data.data.tracks || [];
        // Sort by playCount for ranking
        const sortedTracks = [...myTracks].sort((a: any, b: any) => (b.playCount || 0) - (a.playCount || 0));
        setTracks(sortedTracks);
        
        const totalPlays = myTracks.reduce((acc: number, t: any) => acc + (t.playCount || 0), 0);
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : {};
        
        setStats({
          totalTracks: myTracks.length,
          totalPlays: totalPlays,
          followers: user.followerCount || 0,
          monthlyListeners: user.monthlyListeners || Math.floor(totalPlays / 1.5)
        });
      }

      if (analyticsRes.data.success) {
        setTopFans(analyticsRes.data.data.topFans || []);
      }
    } catch (error) {
      console.error("Error fetching artist data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyData();

    const socket = io(SOCKET_URL);
    socket.on("connect", () => {
      socket.emit("join_admin_room");
    });

    socket.on("track_played", () => {
        fetchMyData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const statCards = [
    { label: "Tổng lượt nghe", value: stats.totalPlays.toLocaleString(), icon: faHeadphones, color: "text-pink-500", bg: "bg-pink-500/10", trend: "+12.5%" },
    { label: "Người theo dõi", value: stats.followers.toLocaleString(), icon: faUsers, color: "text-purple-500", bg: "bg-purple-500/10", trend: "+3.2%" },
    { label: "Bài hát đã đăng", value: stats.totalTracks.toString(), icon: faMusic, color: "text-blue-500", bg: "bg-blue-500/10", trend: "Ổn định" },
    { label: "Người nghe hàng tháng", value: stats.monthlyListeners.toLocaleString(), icon: faArrowTrendUp, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "+8.9%" },
  ];

  return (
    <div className="flex flex-col font-inter antialiased bg-[#050505] min-h-screen text-zinc-300">
      {/* Premium Header */}
      <div className="px-10 py-6 border-b border-white/[0.05] flex justify-between items-center bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-1.5 h-6 bg-gradient-to-b from-[#ff2d55] to-[#a855f7] rounded-full drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]"></div>
          </div>
          <div>
            <h1 className="text-white text-[20px] font-black tracking-tight leading-none flex items-center gap-3">
              ARTIST STUDIO
              <span className="bg-white/5 text-[10px] font-bold px-2 py-0.5 rounded-full text-zinc-500 border border-white/5">PRO VERSION</span>
            </h1>
            <p className="text-zinc-500 text-[11px] mt-1.5 font-bold uppercase tracking-[0.2em]">Bảng điều khiển nghệ sĩ chuyên nghiệp</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 mr-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Hệ thống Live</span>
            </div>
            <button 
                onClick={() => navigate("/admin/upload")}
                className="bg-gradient-to-r from-[#ff2d55] to-[#ff4b6d] hover:shadow-[0_0_20px_rgba(255,45,85,0.4)] text-white text-[11px] font-black uppercase tracking-widest px-7 py-3.5 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                Phát hành ngay
            </button>
        </div>
      </div>

      <div className="p-10 space-y-10 max-w-[1600px] mx-auto w-full">
        
        {/* Row 1: Hero Featured Track & Quick Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Featured Track Hero */}
            <div className="xl:col-span-2 bg-[#0c0c0c] p-8 rounded-[32px] border border-white/[0.05] relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 h-full">
                    <div className="w-48 h-48 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-105 transition-transform duration-500">
                        {tracks.length > 0 ? (
                            <img src={tracks[0].coverUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <FontAwesomeIcon icon={faMusic} className="text-zinc-800 text-4xl" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                            <span className="bg-[#ff2d55] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Tiêu điểm</span>
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <FontAwesomeIcon icon={faCrown} className="text-yellow-500" />
                                Tác phẩm tốt nhất
                            </span>
                        </div>
                        <h2 className="text-white text-[32px] md:text-[42px] font-black tracking-tighter leading-none mb-4 group-hover:text-[#ff2d55] transition-colors">
                            {tracks.length > 0 ? tracks[0].title : "Sẵn sàng tỏa sáng"}
                        </h2>
                        <div className="flex items-center justify-center md:justify-start gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Tổng lượt nghe</p>
                                <p className="text-white text-[18px] font-black">{tracks.length > 0 ? tracks[0].playCount.toLocaleString() : 0}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="text-center md:text-left">
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Thứ hạng</p>
                                <p className="text-[#ff2d55] text-[18px] font-black">Top #1</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff2d55]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-[#0c0c0c] p-6 rounded-[28px] border border-white/[0.05] hover:border-[#ff2d55]/30 transition-all group flex flex-col justify-between">
                        <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} mb-6 group-hover:scale-110 transition-transform`}>
                            <FontAwesomeIcon icon={stat.icon} className="text-[16px]" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[28px] font-black text-white tracking-tighter">{stat.value}</p>
                                <span className={`text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-zinc-500'}`}>{stat.trend}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Row 2: Content Management & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Professional Tracks Table */}
          <div className="lg:col-span-2 bg-[#0c0c0c] rounded-[32px] border border-white/[0.05] overflow-hidden">
            <div className="px-10 py-7 border-b border-white/[0.05] flex justify-between items-center">
              <div>
                <h2 className="text-white text-[16px] font-black tracking-tight">Danh sách tác phẩm</h2>
                <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-1">Cập nhật lúc {new Date().toLocaleTimeString()}</p>
              </div>
              <button onClick={() => navigate("/admin/tracks")} className="text-[11px] font-black text-[#ff2d55] uppercase tracking-widest hover:text-white transition-colors group">
                Quản lý nâng cao
                <FontAwesomeIcon icon={faArrowTrendUp} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="p-4">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/[0.02] animate-pulse rounded-2xl mb-3" />)
              ) : tracks.length > 0 ? (
                <div className="space-y-2">
                    {tracks.slice(0, 5).map((track, index) => (
                    <div key={track._id} className="flex items-center justify-between p-4 hover:bg-white/[0.03] rounded-[20px] transition-all group border border-transparent hover:border-white/[0.05]">
                        <div className="flex items-center gap-6">
                            <div className="relative group/cover">
                                <div className="w-14 h-14 rounded-xl bg-[#111] overflow-hidden border border-white/10">
                                    <img src={track.coverUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                    <FontAwesomeIcon icon={faFire} className="text-white text-xs" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-white text-[14px] font-black tracking-tight group-hover:text-[#ff2d55] transition-colors">{track.title}</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-zinc-500 text-[11px] font-bold bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">{track.playCount.toLocaleString()} Plays</span>
                                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                    <span className="text-[#ff2d55] text-[11px] font-bold uppercase tracking-wider">Top #{index + 1}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <button onClick={() => navigate("/admin/tracks")} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-[#ff2d55] hover:text-white transition-all cursor-pointer">
                                <FontAwesomeIcon icon={faEdit} className="text-[12px]" />
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                    <FontAwesomeIcon icon={faMusic} className="text-zinc-800 text-5xl mb-4" />
                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-[12px]">Bắt đầu sự nghiệp của bạn bằng cách tải bài hát đầu tiên</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Fans / Community Insights */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-[#121212] to-[#080808] p-8 rounded-[32px] border border-white/[0.05] relative overflow-hidden">
                <h3 className="text-white font-black text-[14px] uppercase tracking-widest mb-6 flex items-center gap-3">
                    <FontAwesomeIcon icon={faCrown} className="text-yellow-500" />
                    Người hâm mộ hàng đầu
                </h3>
                <div className="space-y-5">
                    {topFans.length > 0 ? topFans.map((fan, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center font-black text-[12px] text-white overflow-hidden">
                                    {fan.avatar ? (
                                        <img src={fan.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        fan.name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-white group-hover:text-yellow-500 transition-colors">{fan.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{fan.plays} lượt nghe</p>
                                </div>
                            </div>
                            <div className={`text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/5 text-zinc-500'}`}>
                                #{i + 1}
                            </div>
                        </div>
                    )) : (
                        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest text-center py-10">Chưa có dữ liệu fan</p>
                    )}
                </div>
                <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all">Xem tất cả fan</button>
            </div>

            <div className="bg-gradient-to-br from-[#ff2d55]/10 to-[#a855f7]/10 p-10 rounded-[32px] border border-white/[0.05] relative group">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black mb-6 shadow-xl group-hover:rotate-12 transition-transform">
                        <FontAwesomeIcon icon={faChartLine} className="text-[20px]" />
                    </div>
                    <h3 className="text-white font-black text-[18px] mb-3 leading-tight">Insight Insight: Nhạc Pop đang lên ngôi!</h3>
                    <p className="text-zinc-400 text-[12px] leading-relaxed mb-6 font-medium">Khán giả của bạn nghe nhiều nhất vào lúc 21h tối. Hãy cân nhắc phát hành bài hát mới vào khung giờ này.</p>
                    <button className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 group-hover:gap-5 transition-all">
                        Xem chi tiết phân tích
                        <span className="w-6 h-px bg-white"></span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
