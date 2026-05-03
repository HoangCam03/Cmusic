import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../services/api";
import { 
  faTimes, 
  faCheckCircle,
  faChevronRight,
  faChevronLeft
} from "@fortawesome/free-solid-svg-icons";
import { 
  faFacebook, 
  faInstagram 
} from "@fortawesome/free-brands-svg-icons";

interface ArtistAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
}

const ArtistAboutModal: React.FC<ArtistAboutModalProps> = ({ isOpen, onClose, artistId }) => {
  const [artistData, setArtistData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && artistId) {
      const fetchFullArtist = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/catalog/artists/${artistId}`);
          if (res.data.success) {
            setArtistData(res.data.data);
          }
        } catch (err) {
          console.error("Error fetching full artist stats:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchFullArtist();
    }
  }, [isOpen, artistId]);

  if (!isOpen || !artistId) return null;
  const artist = artistData || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#121212] rounded-[40px] overflow-hidden shadow-2xl flex flex-col animate-scaleUp border border-white/5 mx-auto">
        
        {loading && (
          <div className="absolute inset-0 z-50 bg-[#121212]/80 backdrop-blur-sm flex items-center justify-center">
             <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Gallery Top Section - Compact */}
        <div className="relative h-[35vh] w-full group">
           <img 
              src={artist.gallery?.[0] || artist.avatarUrl} 
              className="w-full h-full object-cover" 
              alt="" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
           
           {/* Close Button */}
           <button 
             onClick={onClose}
             className="absolute top-5 right-5 w-9 h-9 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all border border-white/10 z-20"
           >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
           </button>

           {/* Gallery Controls - Smaller */}
           <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-black/60"><FontAwesomeIcon icon={faChevronLeft} className="text-xs"/></button>
              <button className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-black/60"><FontAwesomeIcon icon={faChevronRight} className="text-xs"/></button>
           </div>
        </div>

        {/* Info Content Section - Compact Layout */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
              
              {/* Left Side: Major Stats */}
              <div className="md:col-span-2 space-y-8">
                 <div className="grid grid-cols-1 gap-6">
                    <div>
                       <p className="text-white text-2xl font-black tracking-tighter">{(artist.stats?.followerCount || 0).toLocaleString()}</p>
                       <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mt-1">Người theo dõi</p>
                    </div>
                    <div>
                       <p className="text-white text-2xl font-black tracking-tighter">{(artist.stats?.monthlyListeners || 0).toLocaleString()}</p>
                       <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mt-1">Người nghe tháng</p>
                    </div>
                 </div>

                 {/* Real Aggregate Stats */}
                 <div className="grid grid-cols-1 gap-6 pt-4 border-t border-white/5">
                    <div>
                       <p className="text-white text-2xl font-black tracking-tighter">{(artist.stats?.totalPlays || 0).toLocaleString()}</p>
                       <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mt-1">Tổng lượt nghe</p>
                    </div>
                    <div>
                       <p className="text-white text-2xl font-black tracking-tighter">{artist.stats?.totalTracks || 0}</p>
                       <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mt-1">Bài hát đã phát hành</p>
                    </div>
                 </div>

                 {/* Top Cities - ONLY SHOW IF EXISTS */}
                 {artist.stats?.topCities && artist.stats.topCities.length > 0 && (
                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-white text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Khu vực nghe nhiều</h4>
                      <div className="space-y-3">
                         {artist.stats.topCities.slice(0, 5).map((item: any, idx: number) => (
                           <div key={idx} className="flex flex-col">
                              <span className="text-white text-[13px] font-bold">{item.city}</span>
                              <span className="text-zinc-500 text-[10px] font-medium">{(item.count || 0).toLocaleString()} người nghe</span>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}

                 {/* Socials */}
                 <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button className="text-zinc-400 hover:text-white transition-colors"><FontAwesomeIcon icon={faFacebook as any} /></button>
                    <button className="text-zinc-400 hover:text-white transition-colors ml-2"><FontAwesomeIcon icon={faInstagram as any} /></button>
                 </div>
              </div>

              {/* Right Side: Bio */}
              <div className="md:col-span-3 space-y-6">
                 <div className="text-zinc-400 text-[14px] leading-relaxed font-medium space-y-5">
                    {artist.bio ? (
                      artist.bio.split('\n').slice(0, 3).map((para: string, i: number) => (
                        <p key={i}>{para}</p>
                      ))
                    ) : (
                      <p>Nghệ sĩ chưa cập nhật tiểu sử.</p>
                    )}
                 </div>

                 <div className="bg-zinc-800/20 rounded-2xl p-5 border border-white/5 space-y-3">
                    <div className="flex items-center gap-3">
                       <FontAwesomeIcon icon={faCheckCircle} className="text-blue-400 text-lg" />
                       <div>
                          <p className="text-white text-[13px] font-bold">Nghệ sĩ đã xác minh</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleUp { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default ArtistAboutModal;
