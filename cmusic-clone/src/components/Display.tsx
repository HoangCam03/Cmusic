import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { SongCard } from "./SongCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { faUser as faUserRegular } from "@fortawesome/free-regular-svg-icons";

const ArtistCard = ({ name, index }: { name: string; index: number }) => {
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
      className="transition-all duration-200 cursor-pointer group text-center flex flex-col items-center"
    >
      <div
        className={`w-full aspect-square rounded-full mb-3 flex items-center justify-center text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-gradient-to-br ${bg} transition-transform duration-300 group-hover:scale-[1.02] relative overflow-hidden`}
      >
         <FontAwesomeIcon icon={faUserRegular} className="text-3xl opacity-50" />
         <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>
      <div>
        <p className="text-white font-medium text-[14px] truncate tracking-tight font-outfit">{name}</p>
        <p className="text-zinc-500 text-[12px] mt-1 font-light tracking-wide italic">Nghệ sĩ</p>
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
  const { items: songs } = useSelector((state: RootState) => state.songs);

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
    { _id: "1", title: "FATHER (feat. T...", artist: "Kanye West, Ye, Tr...", isExplicit: true },
    { _id: "2", title: "Griddle", artist: "Yeat, Don Toliver", isExplicit: true },
    { _id: "3", title: "I Know You're ...", artist: "RAYE", isExplicit: false },
    { _id: "4", title: "The Best", artist: "Conan Gray", isExplicit: true },
    { _id: "5", title: "Younger You", artist: "Miley Cyrus", isExplicit: false },
    { _id: "6", title: "GARBAGE", artist: "Melanie Martinez", isExplicit: true },
  ];

  const newReleases = [
    { _id: "n1", title: "Love Story", artist: "Taylor Swift", isExplicit: false },
    { _id: "n2", title: "APT.", artist: "ROSÉ, Bruno Mars", isExplicit: false },
    { _id: "n3", title: "TASTE", artist: "Sabrina Carpenter", isExplicit: true },
    { _id: "n4", title: "DIE WITH A SM...", artist: "Lady Gaga, Bruno M.", isExplicit: false },
    { _id: "n5", title: "Espresso", artist: "Sabrina Carpenter", isExplicit: false },
    { _id: "n6", title: "BIRDS OF A FE...", artist: "Billie Eilish", isExplicit: false },
  ];

  const playlists = [
    { _id: "p1", title: "Chill Vibes", artist: "CMusic Curated" },
    { _id: "p2", title: "Workout Beats", artist: "CMusic Curated" },
    { _id: "p3", title: "Study Session", artist: "CMusic Curated" },
    { _id: "p4", title: "Party Mix", artist: "CMusic Curated" },
    { _id: "p5", title: "Acoustic Morni...", artist: "CMusic Curated" },
    { _id: "p6", title: "Night Drive", artist: "CMusic Curated" },
  ];

  const displaySongs = songs.length > 0 ? songs.slice(0, 6) : mockSongs;

  return (
    <div className="flex-1 h-full bg-transparent overflow-y-auto relative custom-scrollbar-hidden select-none">
      <div className="px-6 lg:px-10 pt-4 pb-24 max-w-[1600px] mx-auto">
        <h1 className="text-white text-[32px] font-semibold font-outfit tracking-tight mb-8">
          {greeting}
        </h1>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {shortcuts.map(s => (
            <ShortcutCard key={s.title} title={s.title} />
          ))}
        </div>

        {/* Trending Songs */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Những bài hát thịnh hành</h2>
            <div className="flex items-center gap-1 group cursor-pointer">
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

        {/* Popular Artists */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Nghệ sĩ phổ biến</h2>
            <div className="flex items-center gap-1 group cursor-pointer">
              <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {placeholderArtists.slice(0, 6).map((name, i) => (
              <ArtistCard key={name} name={name} index={i} />
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Mới phát hành</h2>
            <div className="flex items-center gap-1 group cursor-pointer">
              <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {newReleases.slice(0, 6).map((song: any) => (
              <SongCard key={song._id} song={song} />
            ))}
          </div>
        </section>

        {/* Playlists for You */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-white text-[22px] font-semibold font-outfit tracking-tight hover:text-purple-400 transition-colors cursor-pointer">Playlist dành cho bạn</h2>
            <div className="flex items-center gap-1 group cursor-pointer">
              <span className="text-zinc-500 text-[13px] font-medium group-hover:text-white transition tracking-wide">Hiện tất cả</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-zinc-600 text-[10px] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {playlists.slice(0, 6).map((song: any) => (
              <SongCard key={song._id} song={song} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
