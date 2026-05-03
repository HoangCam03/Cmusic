import React, { useContext, useEffect, useState } from "react";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlusCircle, faEllipsisH, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { getRecommendedSongs } from "../services/SongServices/ListSongs";
import ArtistAboutModal from "./ArtistAboutModal";

import api from "../services/api";

export const NowPlayingSidebar: React.FC = () => {
   const navigate = useNavigate();
   const ctx = useContext(PlayerContext) as PlayerContextType;
   const track = ctx?.track;
   const [recommended, setRecommended] = useState<any[]>([]);
   const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
   const [artistData, setArtistData] = useState<any>(null);
   const [isFollowing, setIsFollowing] = useState(false);

   // Fetch recommended songs khi track thay đổi
   useEffect(() => {
      if (track?._id) {
         getRecommendedSongs(track._id).then(res => {
            if (res.success) setRecommended(res.data);
         });
      }
   }, [track?._id]);

   // Fetch thông tin nghệ sĩ trực tiếp từ API khi track thay đổi
   useEffect(() => {
      const fetchArtistData = async () => {
         const oai = (track as any)?.officialArtistId;
         const artistId = Array.isArray(oai)
            ? (typeof oai[0] === 'object' ? oai[0]?._id : oai[0])
            : (typeof oai === 'object' ? oai?._id : oai);

         if (!artistId || typeof artistId !== 'string') {
            setArtistData(null);
            setIsFollowing(false);
            return;
         }

         try {
            const res = await api.get(`/catalog/artists/${artistId}`);
            if (res.data.success) setArtistData(res.data.data);

            const followRes = await api.get(`/catalog/artists/${artistId}/follow/check`);
            if (followRes.data.success) setIsFollowing(followRes.data.data.isFollowing);
         } catch {
            setArtistData(null);
            setIsFollowing(false);
         }
      };

      if (track?._id) fetchArtistData();
   }, [track?._id]);

   const handleFollowToggle = async () => {
      const artistId = artistData?._id;
      if (!artistId) return;

      try {
         if (isFollowing) {
            await api.delete(`/catalog/artists/${artistId}/follow`);
            setIsFollowing(false);
            setArtistData((prev: any) => prev ? { 
               ...prev, 
               stats: { ...prev.stats, followerCount: Math.max(0, (prev.stats.followerCount || 1) - 1) } 
            } : null);
         } else {
            await api.post(`/catalog/artists/${artistId}/follow`);
            setIsFollowing(true);
            setArtistData((prev: any) => prev ? { 
               ...prev, 
               stats: { ...prev.stats, followerCount: (prev.stats.followerCount || 0) + 1 } 
            } : null);
         }
      } catch (error) {
         console.error("Error toggling follow:", error);
      }
   };

   // Lấy danh sách bài hát tiếp theo từ Queue thực tế của Player
   const fullQueue = ctx?.queue || []; // Truy cập từ PlayerContextType
   const currentIndex = fullQueue.findIndex((s: any) => s._id === track?._id);
   
   // Lấy tối đa 3 bài tiếp theo sau bài hiện tại
   const nextInQueue = currentIndex !== -1 
      ? fullQueue.slice(currentIndex + 1, currentIndex + 4)
      : [];

   // Nếu hàng chờ hết, fallback sang Recommended (như Autoplay)
   const upNextDisplay = nextInQueue.length > 0 ? nextInQueue : recommended.slice(0, 3);

   if (!track) return null;

   // Tổng hợp thông tin để hiển thị: ưu tiên dữ liệu fetch từ API, fallback về dữ liệu track
   const mainArtist = {
      ...artistData,
      name: artistData?.name || track.artist || "Nghệ sĩ CMusic",
      avatarUrl: artistData?.avatarUrl || track.artistAvatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
      bio: artistData?.bio || track.artistBio || "Nghệ sĩ chưa cập nhật tiểu sử.",
      isVerified: artistData?.isVerified || false,
      stats: {
         monthlyListeners: artistData?.stats?.monthlyListeners ?? 0,
         followerCount: artistData?.stats?.followerCount ?? 0
      },
      gallery: artistData?.gallery || [],
      _id: artistData?._id
   };

   return (
      <div className="w-[300px] bg-transparent flex flex-col h-full overflow-hidden shrink-0 hidden xl:flex">
         {/* Scrollable Content - Elevated Heights */}
         <div className="flex-1 overflow-y-auto px-1.5 pt-0 pb-8 custom-scrollbar">

            {/* Bo tròn phần Tiêu đề và Ảnh bìa - Rounded XL for Consistency */}
            <div className="bg-zinc-900/40 rounded-xl border border-white/5 p-4 pt-6 space-y-6 mb-6">
               <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm hover:underline cursor-pointer truncate mr-2">{track.title}</h2>
                  <div className="flex items-center gap-3 text-zinc-400 shrink-0">
                     <button className="hover:text-white transition-colors"><FontAwesomeIcon icon={faEllipsisH} /></button>
                     <button className="hover:text-white transition-colors text-lg"><FontAwesomeIcon icon={faTimes} /></button>
                  </div>
               </div>

               {/* Main Cover */}
               <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl group">
                  <img src={track.image || track.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
               </div>
            </div>

            {/* Title & Artist */}
            <div className="flex justify-between items-start mb-6 px-1">
               <div className="min-w-0">
                  <h3 className="text-2xl font-black text-white hover:underline cursor-pointer truncate">{track.title}</h3>
                  <p
                     onClick={() => {
                        const id = mainArtist?._id || mainArtist;
                        if (id && typeof id === 'string') navigate(`/artist/${id}`);
                     }}
                     className="text-zinc-400 font-bold hover:text-white hover:underline cursor-pointer transition-colors"
                  >
                     {track.artist}
                  </p>
               </div>
               <button className="text-zinc-400 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faPlusCircle} className="text-xl" />
               </button>
            </div>

            {/* Artist Card - Premium Layered Design */}
            <section
               onClick={() => setIsAboutModalOpen(true)}
               className="bg-zinc-900/40 rounded-3xl overflow-hidden mb-6 group hover:bg-zinc-800/60 transition-all cursor-pointer border border-white/5"
            >
               <div className="relative h-64 overflow-hidden bg-[#121212]">
                  {/* Background Blur Image */}
                  <img
                     src={mainArtist?.avatarUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"}
                     className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-150"
                     alt=""
                  />

                  {/* Layered Photos Container */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     {/* Back Layer 1 */}
                     <div className="absolute w-32 h-32 rounded-lg bg-zinc-800 shadow-2xl rotate-[-12deg] -translate-x-12 translate-y-2 overflow-hidden border border-white/10 opacity-60 group-hover:rotate-[-15deg] group-hover:-translate-x-16 transition-all duration-700">
                        <img src={mainArtist?.gallery?.[0] || mainArtist?.avatarUrl} className="w-full h-full object-cover" alt="" />
                     </div>
                     {/* Back Layer 2 */}
                     <div className="absolute w-32 h-32 rounded-lg bg-zinc-800 shadow-2xl rotate-[12deg] translate-x-12 translate-y-4 overflow-hidden border border-white/10 opacity-60 group-hover:rotate-[15deg] group-hover:translate-x-16 transition-all duration-700">
                        <img src={mainArtist?.gallery?.[1] || mainArtist?.avatarUrl} className="w-full h-full object-cover" alt="" />
                     </div>
                     {/* Main Front Layer */}
                     <div className="absolute w-40 h-40 rounded-xl bg-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 overflow-hidden border border-white/20 group-hover:scale-105 transition-all duration-500">
                        <img src={mainArtist?.avatarUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"} className="w-full h-full object-cover" alt="" />
                     </div>
                  </div>

                  <div className="absolute top-4 left-4 text-white font-black text-[9px] uppercase tracking-[0.2em] drop-shadow-lg bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">Giới thiệu về nghệ sĩ</div>
               </div>

               <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                     <h4 className="text-white text-xl font-black tracking-tight group-hover:text-purple-400 transition-colors">
                        {mainArtist.name}
                     </h4>
                     {mainArtist.isVerified && (
                        <span className="text-blue-400 text-sm"><FontAwesomeIcon icon={faCheckCircle} /></span>
                     )}
                  </div>

                  <div className="flex items-center justify-between">
                     <p className="text-zinc-400 text-[12px] font-bold tracking-tight">
                        {(mainArtist.stats.monthlyListeners).toLocaleString()} người nghe hằng tháng
                     </p>
                     <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           handleFollowToggle();
                        }}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg ${
                           isFollowing 
                           ? "bg-transparent text-white border border-white/20 hover:border-white" 
                           : "bg-white text-black"
                        }`}
                     >
                        {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                     </button>
                  </div>

                  <p className="text-zinc-500 text-[13px] leading-relaxed line-clamp-3 font-medium italic opacity-80 group-hover:opacity-100 transition-opacity">
                     {mainArtist?.bio || "Một nghệ sĩ đầy tâm huyết đang cống hiến những giai điệu tuyệt vời cho CMusic."}
                  </p>
               </div>
            </section>

            {/* Next in Queue / Recommended */}
            <section className="bg-zinc-900/40 rounded-2xl p-4">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold text-sm">Tiếp theo trong danh sách chờ</h4>
                  <button className="text-xs font-bold text-zinc-400 hover:text-white">Mở danh sách chờ</button>
               </div>
               <div className="space-y-3">
                  {upNextDisplay.map((s: any) => (
                     <div
                        key={s._id}
                        onClick={() => {
                           const token = localStorage.getItem("token");
                           if (!token) {
                              navigate("/signup");
                              return;
                           }
                           ctx?.playWithId(s._id);
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-all"
                     >
                        <div className="w-12 h-12 rounded overflow-hidden shrink-0">
                           <img src={s.image || s.coverUrl || s.thumbnail || s.avatarUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        </div>
                        <div className="min-w-0">
                           <p className="text-white text-sm font-bold truncate group-hover:text-purple-400">{s.name || s.title}</p>
                           <p className="text-zinc-500 text-xs truncate">
                              {s.artist || s.officialArtistId?.[0]?.name || s.artistId?.displayName}
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         </div>

         {/* Artist About Modal */}
         <ArtistAboutModal
            isOpen={isAboutModalOpen}
            onClose={() => setIsAboutModalOpen(false)}
            artistId={mainArtist?._id || mainArtist}
         />
      </div>
   );
};

export default NowPlayingSidebar;
