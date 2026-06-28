import { useContext, useEffect, useRef, useState } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faMicrophone } from "@fortawesome/free-solid-svg-icons";

export function LyricsOverlay() {
  const ctx = useContext(PlayerContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!ctx?.showLyrics || !ctx.audioRef?.current) return;

    let animationFrame: number;
    const updateTime = () => {
      if (ctx.audioRef?.current) {
        setCurrentTime(ctx.audioRef.current.currentTime);
      }
      animationFrame = requestAnimationFrame(updateTime);
    };
    
    animationFrame = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrame);
  }, [ctx?.showLyrics, ctx?.audioRef]);

  if (!ctx?.showLyrics) return null;

  const track = ctx.track;
  const lyrics = track?.syncedLyrics || [];

  const activeLineIndex = lyrics.findIndex(
    (line: any) => (currentTime - (-0.6)) >= line.start && (currentTime - (-0.6)) <= line.end
  );
  const displayIndex = activeLineIndex !== -1 ? activeLineIndex : lyrics.findLastIndex((line: any) => (currentTime - (-0.6)) >= line.start);

  return (
    <div className="fixed inset-0 z-[150] bg-[#1a0b12] flex flex-col p-8 pt-20 animate-in slide-in-from-bottom-full duration-500">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0 pointer-events-none" />
      
      {/* Nút đóng */}
      <button 
        onClick={() => ctx.setShowLyrics(false)}
        className="absolute top-10 right-10 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 z-50 cursor-pointer shadow-xl backdrop-blur-md"
      >
        <FontAwesomeIcon icon={faTimes} className="text-xl" />
      </button>

      <div className="flex flex-col lg:flex-row gap-16 h-full w-full max-w-[1400px] mx-auto relative z-10">
        
        {/* Cột trái: Artwork */}
        <div className="lg:w-[450px] shrink-0 flex flex-col pt-10">
           <img src={track?.image || track?.coverUrl} className="w-full aspect-square object-cover rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]" alt="" />
           <h2 className="text-white text-3xl font-black mt-8 tracking-tight">{track?.title}</h2>
           <p className="text-zinc-400 text-xl font-bold mt-2 opacity-80">{track?.artist}</p>
        </div>

        {/* Cột phải: Lời bài hát cuộn */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative scroll-smooth mask-image-vertical" ref={containerRef}>
          {lyrics.length > 0 ? (
            <div className="space-y-8 py-[40vh]">
              {lyrics.map((line: any, index: number) => {
                const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                const isPremium = currentUser.plan && currentUser.plan !== 'free';
                
                let lyricsViews = JSON.parse(localStorage.getItem("lyricsViews") || "{}");
                let canViewFullLyrics = isPremium;
                if (!isPremium) {
                  if (lyricsViews.trackIds?.includes(track?._id)) {
                    canViewFullLyrics = true;
                  } else if (lyricsViews.trackIds?.length < 2) {
                    canViewFullLyrics = true;
                  } else {
                    canViewFullLyrics = false;
                  }
                }

                // Giới hạn 5 dòng cho người dùng thường
                if (!canViewFullLyrics && index >= 5) {
                  if (index === 5) {
                    const isActivePremium = displayIndex >= 5;
                    return (
                      <div 
                        key="premium-teaser" 
                        ref={(el) => {
                           if (isActivePremium && el && containerRef.current) {
                               el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                           }
                        }}
                        className={`mt-8 p-10 bg-gradient-to-b from-purple-600/20 to-transparent rounded-3xl border border-purple-500/20 text-center space-y-4 transition-all duration-[400ms] ${isActivePremium ? 'scale-105 opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 'opacity-40'}`}
                      >
                         <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                            <FontAwesomeIcon icon={faMicrophone} className="text-white text-2xl" />
                         </div>
                         <h4 className="text-white font-black text-3xl">Mở khóa toàn bộ lời bài hát</h4>
                         <p className="text-zinc-400 text-xl max-w-md mx-auto">Nâng cấp lên gói Premium để thưởng thức lời bài hát thời gian thực và nhiều đặc quyền khác.</p>
                         <button 
                          onClick={() => {
                            ctx.setShowLyrics(false);
                            window.location.href = "/premium";
                          }}
                          className="bg-white text-black px-10 py-4 rounded-full text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl mt-4"
                         >
                           Nâng cấp ngay
                         </button>
                      </div>
                    );
                  }
                  return null;
                }

                const isActive = index === displayIndex || (!canViewFullLyrics && index === 4 && displayIndex >= 5);
                const isPassed = index < displayIndex;
                return (
                  <p 
                    key={index} 
                    onClick={() => {
                      if (ctx.audioRef?.current) {
                        ctx.audioRef.current.currentTime = Math.max(0, line.start + (-0.6));
                        ctx.audioRef.current.play().catch(e => console.log("Lỗi autoplay", e));
                        ctx.play();
                      }
                    }}
                    className={`text-4xl lg:text-5xl font-black leading-tight transition-all duration-[400ms] ease-out cursor-pointer hover:text-white ${
                      isActive ? "text-white scale-105 origin-left text-shadow-glow" : 
                      isPassed ? "text-white/40" : "text-white/20"
                    }`}
                    ref={(el) => {
                       // Tự động cuộn mượt mà đến dòng hiện tại
                       if (isActive && el && containerRef.current) {
                           el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                       }
                    }}
                  >
                    {line.text}
                  </p>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              {track?.lyrics ? (
                 <div className="whitespace-pre-line text-center text-3xl leading-[2.5] font-bold text-white/50 py-20 pb-[30vh]">
                    {track.lyrics}
                 </div>
              ) : (
                 <p className="text-white/30 text-2xl font-bold">Bài hát này chưa có lời.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
