import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { SongCard } from "./SongCard";
import { AlbumCard } from "./AlbumCard";
import { PlaylistCard } from "./PlaylistCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faPlay } from "@fortawesome/free-solid-svg-icons";
import { faUser as faUserRegular } from "@fortawesome/free-regular-svg-icons";
import api from "../services/api";
import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";

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

const ShortcutCard = ({ title, onPlay, onNavigate, image }: { title: string; onPlay?: (e: React.MouseEvent) => void; onNavigate?: () => void; image?: string }) => (
  <div 
    onClick={onNavigate}
    className="flex items-center transition-all duration-300 rounded-xl overflow-hidden cursor-pointer group h-[58px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] shadow-lg backdrop-blur-md"
  >
    <div className="w-[58px] h-full shrink-0 bg-zinc-800 relative overflow-hidden">
      {image ? (
        <img src={image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-500/80 to-pink-500/80" />
      )}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
    </div>
    <span className="text-zinc-200 group-hover:text-white transition-colors duration-200 font-bold text-[14px] px-5 truncate tracking-tight flex-1">{title}</span>
    
    {/* Mini Play Button on Hover */}
    <div 
      onClick={onPlay}
      className="mr-3 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 z-10"
    >
      <FontAwesomeIcon icon={faPlay} className="text-[10px] ml-0.5" />
    </div>
  </div>
);

export function Display() {
  const navigate = useNavigate();
  const { items: songs } = useSelector((state: RootState) => state.songs);
  const { playWithId } = useContext(PlayerContext) as any;
  const [popularArtists, setPopularArtists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Không chặn return ở đây nữa để khách vẫn thấy được nhạc
      const token = localStorage.getItem("token");

      try {
        const artistPromise = api.get("/catalog/artists?limit=10").catch(() => ({ data: { data: [] } }));
        const albumPromise = api.get("/catalog/albums?limit=6").catch(() => ({ data: { data: [] } }));
        const historyPromise = api.get("/history/recently-played?limit=6").catch(() => ({ data: { data: [] } }));
        const playlistPromise = api.get("/catalog/tracks/smart-playlists").catch(() => ({ data: { data: [] } }));

        const [artistRes, albumRes, historyRes, playlistRes] = await Promise.all([
          artistPromise,
          albumPromise,
          token ? historyPromise : Promise.resolve({ data: { data: [] } }),
          playlistPromise
        ]);
        
        const officialArtists = artistRes.data.data || [];
        setAlbums(albumRes.data.data || []);
        setPlaylists((playlistRes.data.data || playlistRes.data || []).filter(Boolean));
        const rawHistory = historyRes.data.data || [];
        const seen = new Set();
        const uniqueHistory = rawHistory.filter((item: any) => {
          const id = item._id || item.trackId?._id || item.trackId;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setRecentlyPlayed(uniqueHistory);

        const artistsFromSongs = Array.from(new Set(songs.map((s: any) => s.artist)))
          .filter(name => name && name !== "Unknown Artist")
          .map((name, index) => {
             const trackForArtist = songs.find((s: any) => s.artist === name);
             return {
              _id: trackForArtist?.officialArtistId?.[0]?._id || trackForArtist?.officialArtistId?.[0] || `derived-${index}`,
              name: name,
              avatarUrl: trackForArtist?.artistAvatar || trackForArtist?.coverUrl
            };
          });

        const combinedArtists = [...officialArtists];
        artistsFromSongs.forEach(derived => {
          if (!combinedArtists.some(official => official.name === derived.name)) {
            combinedArtists.push(derived);
          }
        });
        setPopularArtists(combinedArtists.filter(Boolean).slice(0, 10));
      } catch (error) {
        console.error("Fetch data error:", error);
      }
    };
    fetchData();
  }, [songs]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const handlePlayShortcut = (e: React.MouseEvent, genre: string) => {
    e.stopPropagation();

    // Kiểm tra đăng nhập
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup");
      return;
    }

    const searchGenre = genre.toLowerCase();
    const filteredSongs = songs.filter((s: any) => {
      if (!s) return false;
      const songGenre = Array.isArray(s.genre) ? s.genre.join(" ") : (s.genre || "");
      const songCategory = Array.isArray(s.category) ? s.category.join(" ") : (s.category || "");
      
      return songGenre.toLowerCase().includes(searchGenre) || 
             songCategory.toLowerCase().includes(searchGenre);
    });

    if (filteredSongs.length > 0) {
      playWithId(filteredSongs[0]._id, filteredSongs);
    } else if (songs.length > 0) {
      playWithId(songs[0]._id, songs);
    }
  };

  const handleNavigateShortcut = (genre: string) => {
    handleAuthNavigate(`/genre/${genre}`);
  };

  const getShortcutImage = (genre: string) => {
    const searchGenre = genre.toLowerCase();
    const song = songs.find((s: any) => {
      if (!s) return false;
      const songGenre = Array.isArray(s.genre) ? s.genre.join(" ") : (s.genre || "");
      const songCategory = Array.isArray(s.category) ? s.category.join(" ") : (s.category || "");
      
      return songGenre.toLowerCase().includes(searchGenre) || 
             songCategory.toLowerCase().includes(searchGenre);
    });
    return song?.image || song?.coverUrl || song?.thumbnail;
  };

  // Tạo phím tắt động từ các thể loại nhạc thực tế có trong DB
  const dynamicShortcuts = Array.from(new Set(songs.flatMap((s: any) => 
    Array.isArray(s.genre) ? s.genre : [s.genre]
  )))
  .filter(g => g && g !== 'null' && g !== 'Unknown' && g !== 'undefined')
  .slice(0, 6)
  .map(genre => ({
    title: `${genre} Hot`,
    genre: genre
  }));

  const shortcuts = dynamicShortcuts.length > 0 ? dynamicShortcuts : [
    { title: "Khám phá nhạc mới", genre: "" }
  ];

  const displaySongs = songs;

  const handleAuthNavigate = (path: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup");
      return;
    }
    navigate(path);
  };

  return (
    <div className="flex-1 h-full bg-transparent overflow-y-auto relative custom-scrollbar-hidden select-none">
      <div className="px-6 lg:px-10 pt-4 pb-24 w-full">
        <h1 className="text-white text-[32px] font-semibold font-outfit tracking-tight mb-8">
          {greeting}
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {shortcuts.map(s => (
            <ShortcutCard 
              key={s.title} 
              title={s.title} 
              image={getShortcutImage(s.genre)}
              onPlay={(e) => handlePlayShortcut(e, s.genre)}
              onNavigate={() => handleNavigateShortcut(s.genre)}
            />
          ))}
        </div>

        {recentlyPlayed.length > 0 && (
          <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Phát gần đây</h2>
              <div 
                onClick={() => handleAuthNavigate("/search")}
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

        {displaySongs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Những bài hát thịnh hành</h2>
              <div 
                onClick={() => handleAuthNavigate("/search")}
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
        )}

        {albums.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Album nổi bật</h2>
              <div 
                onClick={() => handleAuthNavigate("/search")}
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

        {popularArtists.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Nghệ sĩ phổ biến</h2>
              <div 
                onClick={() => handleAuthNavigate("/search")}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {popularArtists.map((artist: any, i: number) => (
                <ArtistCard 
                  key={artist._id} 
                  id={artist._id}
                  name={artist.name || artist.displayName} 
                  index={i} 
                  avatar={artist.avatarUrl} 
                />
              ))}
            </div>
          </section>
        )}

        {displaySongs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Mới phát hành</h2>
              <div 
                onClick={() => handleAuthNavigate("/search")}
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
        )}

        {playlists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <div>
                <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight">Playlist dành cho bạn</h2>
              </div>
              <div 
                onClick={() => handleAuthNavigate("/search")}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {playlists.map((playlist: any) => (
                playlist.isSmart ? (
                  // Smart Playlist: Click điều hướng tới trang Genre
                  <div
                    key={playlist._id}
                    onClick={() => handleAuthNavigate(`/genre/${playlist.genre}`)}
                    className="cursor-pointer group transition-all duration-200"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800 shadow-xl">
                      <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAuthNavigate(`/genre/${playlist.genre}`);
                        }}
                        className="absolute bottom-3 right-3 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl"
                      >
                        <FontAwesomeIcon icon={faPlay} className="text-white text-sm ml-0.5" />
                      </div>
                    </div>
                    <p className="text-white font-bold text-[14px] truncate tracking-tight">{playlist.name}</p>
                    <p className="text-zinc-500 text-[12px] mt-0.5 truncate">{playlist.trackCount} bài · {playlist.description}</p>
                  </div>
                ) : (
                  <PlaylistCard key={playlist._id} playlist={playlist} />
                )
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
