import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { SongCard } from "./SongCard";
import { AlbumCard } from "./AlbumCard";
import { PlaylistCard } from "./PlaylistCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { faUser as faUserRegular } from "@fortawesome/free-regular-svg-icons";
import api from "../services/api";

const ArtistCard = ({ id, name, index, avatar }: { id?: string; name: string; index: number; avatar?: string }) => {
  const navigate = useNavigate();
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-emerald-400 to-cyan-500",
    "from-blue-500 to-purple-600",
    "from-rose-500 to-orange-400",
    "from-indigo-500 to-blue-400",
    "from-orange-500 to-yellow-400"
  ];
  const bg = gradients[index % gradients.length];
  
  return (
    <div
      onClick={() => id && navigate(`/artist/${id}`)}
      className="transition-all duration-200 cursor-pointer group text-center flex flex-col items-center"
    >
      <div
        className={`w-full aspect-square rounded-full mb-3 flex items-center justify-center text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-gradient-to-br ${bg} transition-transform duration-300 group-hover:scale-[1.02] relative overflow-hidden`}
      >
         {avatar ? (
           <img src={avatar} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" alt="" />
         ) : (
           <FontAwesomeIcon icon={faUserRegular} className="text-3xl opacity-50" />
         )}
         <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>
      <div>
        <p className="text-white font-medium text-[14px] truncate tracking-tight font-outfit uppercase">{name}</p>
        <p className="text-zinc-500 text-[12px] mt-1 font-light tracking-wide italic leading-none">Nghệ sĩ</p>
      </div>
    </div>
  );
};

const ShortcutCard = ({ title }: { title: string }) => (
  <div className="flex items-center transition-all duration-300 rounded-xl overflow-hidden cursor-pointer group h-[54px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] shadow-lg backdrop-blur-md">
    <div className="w-[54px] h-full shrink-0 bg-gradient-to-br from-purple-500/80 to-pink-500/80 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
    </div>
    <span className="text-zinc-300 group-hover:text-white transition-colors duration-200 font-medium text-[14px] px-5 truncate tracking-tight">{title}</span>
  </div>
);

export function Display() {
  const navigate = useNavigate();
  const { items: songs } = useSelector((state: RootState) => state.songs);
  const [popularArtists, setPopularArtists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // Fetch Artist và Album độc lập để nếu một cái lỗi thì cái kia vẫn chạy
        const artistPromise = api.get("/catalog/artists?limit=10").catch(() => ({ data: { data: [] } }));
        const albumPromise = api.get("/catalog/albums?limit=6").catch(() => ({ data: { data: [] } }));
        const historyPromise = api.get("/history/recently-played?limit=6").catch(() => ({ data: { data: [] } }));
        const playlistPromise = api.get("/playlists/public?limit=6").catch(() => ({ data: { data: [] } }));

        const [artistRes, albumRes, historyRes, playlistRes] = await Promise.all([
          artistPromise,
          albumPromise,
          historyPromise,
          playlistPromise
        ]);
        
        const officialArtists = artistRes.data.data || [];
        setAlbums(albumRes.data.data || []);
        setPlaylists(playlistRes.data.data || []);
        const rawHistory = historyRes.data.data || [];
        // Deduplicate: chỉ giữ lần xuất hiện đầu tiên của mỗi bài hát
        const seen = new Set();
        const uniqueHistory = rawHistory.filter((item: any) => {
          const id = item._id || item.trackId?._id || item.trackId;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setRecentlyPlayed(uniqueHistory);

        // Logic thông minh: Lấy nghệ sĩ từ bài hát thực tế để tăng tính phong phú
        const artistsFromSongs = Array.from(new Set(songs.map((s: any) => s.artist)))
          .filter(name => name && name !== "Nghệ sĩ CMusic")
          .map((name, index) => {
             const trackForArtist = songs.find((s: any) => s.artist === name);
             return {
              _id: trackForArtist?.officialArtistId?.[0]?._id || trackForArtist?.officialArtistId?.[0] || `derived-${index}`,
              name: name,
              avatarUrl: trackForArtist?.artistAvatar || trackForArtist?.coverUrl // Ưu tiên avatar nghệ sĩ từ track, sau đó tới cover bài hát
            };
          });

        // Gộp lại: Ưu tiên Artist chính thức, sau đó là các Artist từ bài hát
        const combined = [...officialArtists];
        artistsFromSongs.forEach(a => {
           if (!combined.some(c => (c.name || c.displayName)?.toLowerCase() === a.name.toLowerCase())) {
             combined.push(a);
           }
        });

        // Nếu vẫn không có nghệ sĩ nào (hiếm khi xảy ra nếu đã có bài hát), mới dùng placeholder
        setPopularArtists(combined.slice(0, 6));
      } catch (error) {
        console.error("Fetch data error:", error);
      }
    };
    fetchData();
  }, [songs]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const placeholderArtists = ["BTS", "BLACKPINK", "IU", "SEVENTEEN", "NewJeans", "Stray Kids"];
  
  const shortcuts = [
    { title: "Nhạc Việt yêu thích" },
    { title: "K-Pop Hits" },
    { title: "US-UK Hot" },
    { title: "Lo-Fi Chill" },
    { title: "Nhạc không lời" },
    { title: "Top 100" }
  ];

  const mockSongs = [
    { 
      _id: "m1", 
      title: "Lofi Study Session", 
      artist: "CMusic Chill", 
      file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop" 
    },
    { 
      _id: "m2", 
      title: "Night City Drive", 
      artist: "Synthwave Pro", 
      file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop" 
    },
    { 
      _id: "m3", 
      title: "Piano Sanctuary", 
      artist: "Classical Mind", 
      file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" 
    }
  ];

  const displaySongs = songs.length > 0 ? songs : mockSongs;

  return (
    <div className="flex-1 h-full bg-transparent overflow-y-auto relative custom-scrollbar-hidden select-none">
      <div className="px-6 lg:px-10 pt-4 pb-24 w-full">
        <h1 className="text-white text-[32px] font-semibold font-outfit tracking-tight mb-8">
          {greeting}
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {shortcuts.map(s => (
            <ShortcutCard key={s.title} title={s.title} />
          ))}
        </div>

        {recentlyPlayed.length > 0 && (
          <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Phát gần đây</h2>
              <div 
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {recentlyPlayed.map((song: any, idx: number) => (
                <SongCard key={`${song._id}-${idx}`} song={song} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Những bài hát thịnh hành</h2>
            <div 
              onClick={() => navigate("/search")}
              className="flex items-center gap-1 group cursor-pointer"
            >
              <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {displaySongs.slice(0, 6).map((song: any) => (
              <SongCard key={song._id} song={song} />
            ))}
          </div>
        </section>

        {albums.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Album nổi bật</h2>
              <div 
                onClick={() => navigate("/search")}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {albums.map((album: any) => (
                <AlbumCard key={album._id} album={album} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Nghệ sĩ phổ biến</h2>
            <div 
              onClick={() => navigate("/search")}
              className="flex items-center gap-1 group cursor-pointer"
            >
              <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {popularArtists.length > 0 ? (
              popularArtists.map((artist: any, i: number) => (
                <ArtistCard 
                  key={artist._id} 
                  id={artist._id}
                  name={artist.name || artist.displayName} 
                  index={i} 
                  avatar={artist.avatarUrl} 
                />
              ))
            ) : (
              placeholderArtists.slice(0, 6).map((name, i) => (
                <ArtistCard key={name} name={name} index={i} />
              ))
            )}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Mới phát hành</h2>
            <div 
              onClick={() => navigate("/search")}
              className="flex items-center gap-1 group cursor-pointer"
            >
              <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {displaySongs.slice(0, 6).map((song: any) => (
              <SongCard key={song._id} song={song} />
            ))}
          </div>
        </section>

        {playlists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Playlist dành cho bạn</h2>
              <div 
                onClick={() => navigate("/search")}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {playlists.map((playlist: any) => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
