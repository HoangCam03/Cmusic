import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSongById, getArtistSongs } from "../services/SongServices/ListSongs";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faHeart, faEllipsis, faMicrophone, faArrowTrendUp, faTrash, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { SongCard } from "../components/SongCard";
import api from "../services/api";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const TrackDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = useContext(PlayerContext);
  const [track, setTrack] = useState<any>(null);
  const [artistSongs, setArtistSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null); // Bình luận đang được phản hồi

  // Modal Xóa bình luận
  const [deleteModal, setDeleteModal] = useState({ show: false, commentId: null as string | null });
  const [isLiked, setIsLiked] = useState(false);
  const [recommendedSongs, setRecommendedSongs] = useState<any[]>([]);

  const checkLikeStatus = async () => {
    try {
      const res = await api.get(`/likes/tracks/${id}/check`);
      if (res.data.success) {
        setIsLiked(res.data.data.liked);
      }
    } catch (err) {
      console.error("Check like error:", err);
    }
  };

  const toggleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để yêu thích");
      navigate("/signup");
      return;
    }

    try {
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
      window.dispatchEvent(new CustomEvent('like-change', { detail: { trackId: id, isLiked: !isLiked } }));
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái yêu thích");
    }
  };
  
  // 1. Lyrics Display & Sync States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [parsedLyrics, setParsedLyrics] = useState<{ time: number; text: string }[]>([]);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const lyricsRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex >= 0 && lyricsRefs.current[activeLineIndex] && isAutoSync) {
      lyricsRefs.current[activeLineIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, isAutoSync]);

  // 2. Admin Studio States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSyncingSession, setIsSyncingSession] = useState(false);
  const [syncedLines, setSyncedLines] = useState<{ [key: number]: number }>({}); // index -> timestamp

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      setIsAdmin(user.role === 'admin' || user.role === 'artist');
    }
  }, []);

  // Parsing LRC format: [mm:ss.xx] Lyrics
  const parseLRC = (lrc: string) => {
    if (!lrc) return [];
    const lines = lrc.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach(line => {
      const match = line.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3]);
        const time = minutes * 60 + seconds + (ms / 100);
        const text = line.replace(timeRegex, '').trim();
        result.push({ time, text: text || "" }); // Giữ lại dòng trắng nếu cần
      } else {
        // Coi như là text thuần hoặc dòng trắng
        result.push({ time: -1, text: line.trim() });
      }
    });
    return result;
  };

  useEffect(() => {
    if (track?.lyrics) {
      setParsedLyrics(parseLRC(track.lyrics));
    }
  }, [track]);

  // Sync Logic (Auto Highlight - High Resolution)
  useEffect(() => {
    const audio = ctx?.audioRef?.current;
    if (!audio || parsedLyrics.length === 0 || !isAutoSync) return;

    const onTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const hasTimestamps = parsedLyrics.some(l => l.time !== -1);
      let index = -1;

      if (hasTimestamps) {
        for (let i = 0; i < parsedLyrics.length; i++) {
          // Bù đắp một chút độ trễ 0.1s cho trải nghiệm mượt hơn
          if (parsedLyrics[i].time !== -1 && (currentTime + 0.1) >= parsedLyrics[i].time) index = i;
          else if (parsedLyrics[i].time > (currentTime + 0.1)) break;
        }
      } else if (track?.duration) {
        const timePerLine = track.duration / parsedLyrics.length;
        index = Math.floor(currentTime / timePerLine);
      }
      
      if (index !== activeLineIndex) setActiveLineIndex(index);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, [ctx?.audioRef, parsedLyrics, activeLineIndex, isAutoSync, track?.duration]);

  // Handle Recording Sync (Admin Live Sync - With Reaction Offset)
  const handleMarkLine = async (index: number) => {
    if (!isSyncingSession || !ctx?.audioRef?.current) return;
    
    // Bù đắp phản xạ người dùng (thường nhanh hơn 0.3s)
    const currentTime = Math.max(0, ctx.audioRef.current.currentTime - 0.25);
    
    setSyncedLines(prev => ({ ...prev, [index]: currentTime }));

    // 2. Tự động tạo nội dung LRC mới và lưu vào DB luôn
    try {
      const updatedLines = { ...syncedLines, [index]: currentTime };
      const lrcContent = parsedLyrics.map((line, idx) => {
        const time = updatedLines[idx] !== undefined ? updatedLines[idx] : line.time;
        if (time !== -1 && time !== undefined) {
          const mins = Math.floor(time / 60).toString().padStart(2, '0');
          const secs = Math.floor(time % 60).toString().padStart(2, '0');
          const ms = Math.floor((time % 1) * 100).toString().padStart(2, '0');
          return `[${mins}:${secs}.${ms}] ${line.text}`;
        }
        return line.text;
      }).join('\n');

      // Gửi PATCH lên server ngay lập tức
      await api.patch(`/catalog/tracks/${id}`, { lyrics: lrcContent });
      console.log(`✅ Đã lưu mốc thời gian cho dòng ${index + 1}`);
    } catch (err) {
      console.error("Lỗi lưu trực tiếp:", err);
    }
  };

  // Space key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSyncingSession) {
        e.preventDefault();
        const nextIndex = parsedLyrics.findIndex((_, idx) => syncedLines[idx] === undefined);
        if (nextIndex !== -1) handleMarkLine(nextIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSyncingSession, syncedLines, parsedLyrics]);

  const fetchComments = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/catalog/tracks/${id}/comments`);
      if (res.data.success) {
        setComments(res.data.data);
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để bình luận");
      navigate("/signup");
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post("/catalog/tracks/comments", {
        trackId: id,
        content: newComment,
        parentId: replyTo?._id || null
      });
      if (res.data.success) {
        setNewComment("");
        setReplyTo(null);
        setComments(prev => [res.data.data, ...prev]);
        toast.success(replyTo ? "Đã gửi phản hồi!" : "Đã đăng bình luận!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể đăng bình luận");
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setComments([]); // Reset comments to prevent old comments from showing
      try {
        const res = await getSongById(id);
        if (res.success) {
          const songData = res.data;
          setTrack(songData);
          fetchComments();
          checkLikeStatus();
          
          // Fetch recommended songs
          try {
            const recRes = await api.get(`/catalog/tracks/${id}/recommended`);
            if (recRes.data.success) {
              setRecommendedSongs(recRes.data.data);
            }
          } catch (err) {
            console.error("Fetch recommended error:", err);
          }
          
          // officialArtistId là array, lấy _id của phần tử đầu tiên
          const officialArtist = Array.isArray(songData.officialArtistId)
            ? songData.officialArtistId[0]
            : songData.officialArtistId;
          const targetArtistId = officialArtist?._id
            || (typeof officialArtist === 'string' ? officialArtist : null)
            || songData.artistId?._id
            || (typeof songData.artistId === 'string' ? songData.artistId : null);

          
          if (targetArtistId) {
            // Re-fetch artist songs for the correct artist
            const artistRes = await getArtistSongs(targetArtistId);
            if (artistRes.success) {
              setArtistSongs(artistRes.data.filter((s: any) => s._id !== id).slice(0, 10));
            }
          }
        }
      } catch (err) {
        console.error("Fetch detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const isPlaying = ctx?.track?._id === track?._id && ctx?.playStatus;
  const lastTrackIdRef = React.useRef<string | null>(ctx?.track?._id || null);

  // Tự động chuyển trang CHỈ KHI bài hát trong Player tự động nhảy sang bài mới khi đang nghe bài cũ
  useEffect(() => {
    const currentPlayingId = ctx?.track?._id;
    
    // Nếu ID bài đang hát thay đổi (vừa chuyển bài)
    if (currentPlayingId && lastTrackIdRef.current && currentPlayingId !== lastTrackIdRef.current) {
      // Chỉ tự động nhảy trang nếu người dùng ĐANG ở đúng trang của bài vừa hát xong
      if (id === lastTrackIdRef.current) {
        navigate(`/track/${currentPlayingId}`);
      }
    }
    
    // Cập nhật mốc theo dõi mới
    lastTrackIdRef.current = currentPlayingId;
  }, [ctx?.track?._id, id, navigate]);

  if (loading) return <div className="p-8 text-white opacity-50">Đang tải giai điệu...</div>;
  if (!track) return <div className="p-8 text-white opacity-50">Không tìm thấy bài hát</div>;

  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Hero Header */}
      <div className="relative h-[300px] lg:h-[400px] px-8 flex items-end pb-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl" style={{ backgroundImage: `url(${track.coverUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-end gap-8 w-full">
          <div className="w-48 h-48 lg:w-64 lg:h-64 shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden">
            <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white">Bài hát</p>
            <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter mb-4">{track.title}</h1>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <img src={Array.isArray(track.officialArtistId) ? track.officialArtistId[0]?.avatarUrl : track.officialArtistId?.avatarUrl || track.artistId?.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
              
              <div className="flex items-center flex-wrap">
                {Array.isArray(track.officialArtistId) && track.officialArtistId.length > 0 ? (
                  track.officialArtistId.map((artist: any, idx: number) => (
                    <span key={artist?._id || idx} className="flex items-center">
                      <span 
                        className="hover:underline cursor-pointer" 
                        onClick={() => {
                          const targetId = artist?._id || artist;
                          if (targetId && typeof targetId === 'string') navigate(`/artist/${targetId}`);
                        }}
                      >
                        {artist?.name || track.artist}
                      </span>
                      {idx < track.officialArtistId.length - 1 && (
                        <span className="mx-1.5 opacity-50 font-medium text-zinc-400 no-underline cursor-default">ft.</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span 
                    className="hover:underline cursor-pointer" 
                    onClick={() => {
                      const mainArtist = track.officialArtistId;
                      const targetId = mainArtist?._id || mainArtist;
                      if (targetId && typeof targetId === 'string') navigate(`/artist/${targetId}`);
                    }}
                  >
                    {track.artist}
                  </span>
                )}
              </div>
              
              <span className="opacity-50 mx-1">•</span>
              <span className="opacity-50">{Math.floor(track.duration / 60)} phút {track.duration % 60} giây</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body */}
      <div className="px-8 py-8 space-y-16">
        {/* Play Controls bar */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => {
              const token = localStorage.getItem("token");
              if (!token) {
                navigate("/signup");
                return;
              }
              ctx?.playWithId(track._id);
            }} 
            className="w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xl" />
          </button>
          <button 
            onClick={toggleLike}
            className={`transition-all text-2xl hover:scale-110 active:scale-90 cursor-pointer ${isLiked ? 'text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'text-zinc-400 hover:text-white'}`}
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-all text-xl"><FontAwesomeIcon icon={faEllipsis} /></button>
        </div>

        {/* Lyrics with Sync and Expand functionality */}
        <section className="relative group/lyrics">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FontAwesomeIcon icon={faMicrophone} className="text-purple-500 text-lg" />
              Lời bài hát
            </h2>
            
            {/* Auto-Sync Toggle */}
            <div className="flex items-center gap-3 bg-zinc-900/60 p-1.5 px-4 rounded-full border border-white/5 opacity-0 group-hover/lyrics:opacity-100 transition-opacity">
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tự động chạy</span>
               <button 
                onClick={() => setIsAutoSync(!isAutoSync)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isAutoSync ? 'bg-purple-600' : 'bg-zinc-700'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSync ? 'left-6' : 'left-1'}`} />
               </button>
            </div>
          </div>
          
          <div 
            className={`relative p-8 bg-zinc-900/40 rounded-3xl border border-white/5 font-outfit transition-all duration-700 overflow-hidden ${
              (!isExpanded && !isSyncingSession) ? "max-h-[400px]" : "max-h-[10000px] shadow-[0_32px_64px_rgba(0,0,0,1)]"
            }`}
          >
            <div className="flex flex-col gap-5">
              {parsedLyrics.length > 0 ? (
                parsedLyrics.map((line, index) => {
                  const isActive = activeLineIndex === index;
                  const isRecorded = syncedLines[index] !== undefined;
                  
                  // Chỉ hiển thị highlight khi không click trống
                  if (!line.text && !isSyncingSession) return <div key={index} className="h-8" />;

                  return (
                    <div 
                      key={index} 
                      ref={(el) => { lyricsRefs.current[index] = el; }}
                      className="flex items-center gap-4 group/line"
                    >
                      {isSyncingSession && (
                        <div 
                          className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${isRecorded ? 'bg-purple-500 shadow-[0_0_12px_#a855f7]' : 'bg-white/10'}`} 
                        />
                      )}
                      <p 
                        onClick={() => handleMarkLine(index)}
                        className={`text-2xl lg:text-5xl font-bold transition-all duration-500 cursor-pointer select-none leading-tight ${
                          isActive 
                            ? "text-white scale-105 origin-left drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" 
                            : "text-zinc-700 hover:text-zinc-200"
                        } ${isSyncingSession && !isRecorded ? 'opacity-30' : ''}`}
                      >
                        {line.text}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xl lg:text-4xl font-bold text-zinc-500">
                  Giai điệu này chưa có lời bài hát. Hãy tận hưởng âm nhạc nhé!
                </p>
              )}
            </div>

            {/* Fade effect when collapsed */}
            {!isExpanded && !isSyncingSession && (
              <div className={`absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent z-10 pointer-events-none transition-opacity ${parsedLyrics.length < 5 ? 'opacity-0' : 'opacity-100'}`} />
            )}
          </div>

          {/* Admin Studio Controls - Live Sync Version */}
          {isAdmin && (
            <div className="mt-8 flex flex-wrap items-center gap-4 p-6 bg-purple-600/10 border border-purple-500/20 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1">
                <h4 className="text-white font-bold mb-1 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSyncingSession ? 'bg-red-500 animate-pulse' : 'bg-purple-500'}`} />
                  Lyrics Studio {isSyncingSession && "(Chế độ lưu trực tiếp đang bật)"}
                </h4>
                <p className="text-zinc-400 text-xs font-medium">
                  {isSyncingSession 
                    ? "✨ Ca sĩ hát đến đâu anh CLICK đến đó. Hệ thống sẽ TỰ LƯU ngay lập tức!"
                    : "Công cụ đồng bộ lời nhạc Live Sync chuyên nghiệp dành cho Admin."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!isSyncingSession ? (
                  <button 
                    onClick={() => { setIsSyncingSession(true); setSyncedLines({}); }}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(168,85,247,0.3)]"
                  >
                    Bật Live Sync
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsSyncingSession(false);
                      // Refresh to apply final state
                      getSongById(id!).then(res => setTrack(res.data));
                    }}
                    className="bg-white text-black px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:bg-zinc-200 active:scale-95 shadow-xl"
                  >
                    Hoàn tất & Thoát
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Show More Button */}
          {parsedLyrics.length > 5 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 text-sm font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              {isExpanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </section>

        {/* Artist About Section (Premium Card) */}
        {(() => {
          const mainArtist = Array.isArray(track.officialArtistId) ? track.officialArtistId[0] : track.officialArtistId;
          if (!mainArtist) return null;

          return (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-50">Giới thiệu về nghệ sĩ</h2>
              <div className="relative group/artist overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-8 flex flex-col md:flex-row gap-10 items-center transition-all hover:bg-zinc-800/40">
                <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 rounded-full overflow-hidden shadow-2xl relative">
                    <img 
                      src={mainArtist.avatarUrl} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/artist:scale-110" 
                      alt={mainArtist.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/artist:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <h3 
                        className="text-4xl lg:text-5xl font-black text-white mb-2 leading-none hover:underline cursor-pointer" 
                        onClick={() => {
                          const id = mainArtist?._id || mainArtist;
                          if (id && typeof id === 'string') navigate(`/artist/${id}`);
                        }}
                      >
                        {mainArtist.name}
                      </h3>
                      <p className="text-purple-400 font-bold tracking-widest uppercase text-xs">
                        {mainArtist.topCities?.[0]?.listeners?.toLocaleString() || "1,234,567"} người nghe hàng tháng
                      </p>
                    </div>
                    
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 font-medium">
                      {mainArtist.bio || "Nghệ sĩ tâm huyết với những giai điệu đầy cảm xúc, đang chinh phục trái tim của hàng triệu người yêu nhạc trên khắp thế giới với phong cách độc bản."}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                      <button className="bg-white text-black px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl">
                        Theo dõi
                      </button>
                      <button 
                        onClick={() => {
                          const id = mainArtist?._id || mainArtist;
                          if (id && typeof id === 'string') navigate(`/artist/${id}`);
                        }}
                        className="border border-white/20 hover:border-white/40 text-white px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Xem trang cá nhân
                      </button>
                    </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Popular Songs Table */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-50">
            Bài hát phổ biến của {track.officialArtistId?.name || track.artist || track.artistId?.displayName}
          </h2>
          <div className="space-y-1">
            {artistSongs.slice(0, 5).map((s, idx) => (
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
                className="grid grid-cols-[32px_1fr_120px_48px] items-center gap-4 px-4 py-2 rounded-lg hover:bg-white/5 group transition-colors cursor-pointer text-zinc-400"
              >
                <span className="text-sm font-medium">{idx + 1}</span>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={s.coverUrl} className="w-10 h-10 rounded shadow-lg" alt="" />
                  <span className="text-sm font-bold text-white truncate">{s.title}</span>
                </div>
                <span className="text-xs font-medium text-zinc-500">{s.playCount?.toLocaleString() || "0"} lượt nghe</span>
                <span className="text-xs font-medium text-zinc-500 flex justify-end">3:42</span>
              </div>
            ))}
          </div>
        </section>

        {/* More from Artist Grid */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Album khác của {track.artist || track.artistId?.displayName}</h2>
            <button className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Xem danh sách đĩa nhạc</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {artistSongs.map(s => <SongCard key={s._id} song={s} />)}
          </div>
        </section>

        {/* 4b. Recommended Songs */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-purple-500 text-lg" />
              Gợi ý cho bạn
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {recommendedSongs.slice(0, 6).map(s => <SongCard key={s._id} song={s} />)}
          </div>
        </section>

        {/* 5. COMMENT SECTION */}
        <section className="bg-zinc-900/20 rounded-3xl border border-white/5 p-8">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            Bình luận
            <span className="text-sm font-medium text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">{comments.length}</span>
          </h2>

          <form onSubmit={handleCommentSubmit} className="mb-12">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                <img 
                  src={JSON.parse(localStorage.getItem("user") || "{}").avatarUrl || "https://res.cloudinary.com/dmhu9crst/image/upload/v1711202424/avatars/default_avatar.png"} 
                  className="w-full h-full object-cover" 
                  alt="" 
                />
              </div>
              <div className="flex-1 space-y-3">
                <textarea 
                  id="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? `Phản hồi ${replyTo.userId?.displayName}...` : "Chia sẻ cảm nhận của bạn về bài hát này..."}
                  className="w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all min-h-[100px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <div>
                    {replyTo && (
                      <button 
                        onClick={() => { setReplyTo(null); setNewComment(""); }}
                        className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest"
                      >
                        Hủy phản hồi
                      </button>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest px-8 py-3 rounded-full transition-all active:scale-95 cursor-pointer"
                  >
                    {submittingComment ? "Đang gửi..." : (replyTo ? "Gửi phản hồi" : "Đăng bình luận")}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-8">
            {(() => {
              const rootComments = comments.filter(c => !c.parentId);
              const replies = comments.filter(c => c.parentId);

              if (rootComments.length === 0) {
                return (
                  <div className="text-center py-10">
                    <p className="text-zinc-500 text-sm font-medium">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                  </div>
                );
              }

              return rootComments.map((comment) => (
                <div key={comment._id} className="space-y-4">
                  {/* Top Level Comment */}
                  <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden cursor-pointer" onClick={() => navigate(`/profile/${comment.userId?._id}`)}>
                      <img src={comment.userId?.avatarUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white hover:underline cursor-pointer flex items-center gap-1.5" onClick={() => navigate(`/profile/${comment.userId?._id}`)}>
                          {comment.userId?.displayName}
                          
                          {/* Artist Badge Logic */}
                          {(() => {
                             const artists = Array.isArray(track.officialArtistId) ? track.officialArtistId : [track.officialArtistId];
                             const isTrackArtist = artists.some((a: any) => a?.userId?._id === comment.userId?._id || a?.userId === comment.userId?._id);
                             if (isTrackArtist) return (
                               <div className="flex items-center gap-1 bg-purple-500/20 px-1.5 py-0.5 rounded-md border border-purple-500/30">
                                  <span className="text-[9px] font-black uppercase text-purple-400 tracking-tighter">Nghệ sĩ</span>
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-purple-400 text-[10px]" />
                               </div>
                             );
                             return null;
                          })()}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <p className="text-zinc-200 text-[14px] leading-relaxed whitespace-pre-wrap font-medium">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Thích</button>
                        <button 
                          onClick={() => {
                            setReplyTo(comment);
                            setNewComment(`@${comment.userId?.displayName} `);
                            document.getElementById('comment-input')?.scrollIntoView({ behavior: 'smooth' });
                            document.getElementById('comment-input')?.focus();
                          }}
                          className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                        >
                          Phản hồi
                        </button>
                        
                        {/* Delete Button */}
                        {(() => {
                          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                          const currentUserId = currentUser.id || currentUser._id;
                          const isOwner = currentUserId && String(currentUserId) === String(comment.userId?._id || comment.userId);
                          const isAdminOrArtist = ['admin', 'artist'].includes(currentUser.role);
                          return (isOwner || isAdminOrArtist) && (
                            <button onClick={() => setDeleteModal({ show: true, commentId: comment._id })} className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors">Xóa</button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  <div className="ml-14 space-y-6 border-l border-white/5 pl-6">
                    {replies.filter(r => r.parentId === comment._id).map(reply => (
                      <div key={reply._id} className="flex gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden cursor-pointer" onClick={() => navigate(`/profile/${reply.userId?._id}`)}>
                          <img src={reply.userId?.avatarUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white hover:underline cursor-pointer flex items-center gap-1.5" onClick={() => navigate(`/profile/${reply.userId?._id}`)}>
                              {reply.userId?.displayName}
                              {/* Artist Badge for Reply */}
                              {(() => {
                                 const artists = Array.isArray(track.officialArtistId) ? track.officialArtistId : [track.officialArtistId];
                                 const isTrackArtist = artists.some((a: any) => a?.userId?._id === reply.userId?._id || a?.userId === reply.userId?._id);
                                 if (isTrackArtist) return <FontAwesomeIcon icon={faCheckCircle} className="text-purple-400 text-[10px]" />;
                                 return null;
                              })()}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: vi })}
                            </span>
                          </div>
                          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                          <div className="flex items-center gap-4 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Thích</button>
                            <button 
                              onClick={() => {
                                setReplyTo(comment); // Reply to the parent
                                setNewComment(`@${reply.userId?.displayName} `);
                                document.getElementById('comment-input')?.scrollIntoView({ behavior: 'smooth' });
                                document.getElementById('comment-input')?.focus();
                              }}
                              className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                            >
                              Phản hồi
                            </button>
                            {(() => {
                              const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                              const currentUserId = currentUser.id || currentUser._id;
                              const isOwner = currentUserId && String(currentUserId) === String(reply.userId?._id || reply.userId);
                              const isAdminOrArtist = ['admin', 'artist'].includes(currentUser.role);
                              return (isOwner || isAdminOrArtist) && (
                                <button onClick={() => setDeleteModal({ show: true, commentId: reply._id })} className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors">Xóa</button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-20 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 pb-12">
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm">Công ty</h4>
            <ul className="text-zinc-400 text-sm space-y-2 font-medium">
              <li className="hover:text-white hover:underline cursor-pointer">Giới thiệu</li>
              <li className="hover:text-white hover:underline cursor-pointer">Việc làm</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm">Cộng đồng</h4>
            <ul className="text-zinc-400 text-sm space-y-2 font-medium">
              <li className="hover:text-white hover:underline cursor-pointer">Dành cho các Nghệ sĩ</li>
              <li className="hover:text-white hover:underline cursor-pointer">Nhà phát triển</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm">Liên kết hữu ích</h4>
            <ul className="text-zinc-400 text-sm space-y-2 font-medium">
              <li className="hover:text-white hover:underline cursor-pointer">Hỗ trợ</li>
              <li className="hover:text-white hover:underline cursor-pointer">Ứng dụng miễn phí</li>
            </ul>
          </div>
          <div className="space-y-4 text-right">
             <p className="text-zinc-500 text-sm">© 2026 Spotify AB</p>
          </div>
        </footer>
      </div>
      {/* Custom Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900/90 border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faTrash} className="text-2xl text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Xóa bình luận?</h3>
            <p className="text-zinc-400 text-center text-sm mb-8 leading-relaxed">
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bình luận này không?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ show: false, commentId: null })}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Hủy
              </button>
              <button 
                onClick={async () => {
                  if (!deleteModal.commentId) return;
                  try {
                    await api.delete(`/catalog/tracks/comments/${deleteModal.commentId}`);
                    setComments(prev => prev.filter(c => c._id !== deleteModal.commentId));
                    toast.success("Đã xóa bình luận thành công");
                    setDeleteModal({ show: false, commentId: null });
                  } catch (err) {
                    toast.error("Không thể xóa bình luận");
                  }
                }}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-95"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackDetailPage;
