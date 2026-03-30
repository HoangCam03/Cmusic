import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { SongCard } from "./SongCard";

const ArtistCard = ({ name, index }: { name: string; index: number }) => {
  const gradients = [
    "from-[#FF8008] to-[#FFC837]",
    "from-[#4CB8C4] to-[#3CD3AD]",
    "from-[#24C6DC] to-[#514A9D]",
    "from-[#FF512F] to-[#DD2476]",
    "from-[#1A2980] to-[#26D0CE]",
    "from-[#FF512F] to-[#F09819]"
  ];
  const bg = gradients[index % gradients.length];
  
  return (
    <div className="p-5 bg-white/5 border border-white/5 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 rounded-2xl cursor-pointer group shadow-lg">
      <div
        className={`w-full aspect-square rounded-full mb-5 flex items-center justify-center text-white font-black text-4xl shadow-xl bg-gradient-to-br ${bg} group-hover:shadow-2xl transition-all`}
      >
        {name[0]}
      </div>
      <p className="text-white font-bold text-[15px] truncate">{name}</p>
      <p className="text-[#a1a1aa] text-xs mt-1 font-medium">Nghệ sĩ</p>
    </div>
  );
};

export function Display() {
  const { items: songs } = useSelector((state: RootState) => state.songs);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const placeholderArtists = ["Sơn Tùng M-TP", "Đen Vâu", "Hòa Minzy", "Jack - J97", "Mỹ Tâm", "Bích Phương"];
  
  const mockSongs = [
    { _id: "1", title: "FATHER (feat. Travis Scott)", artist: "Kanye West, Ye, Travis Scott", isExplicit: true },
    { _id: "2", title: "Griddle", artist: "Yeat, Don Toliver", isExplicit: true },
    { _id: "3", title: "I Know You're Hurting", artist: "RAYE", isExplicit: false },
    { _id: "4", title: "The Best", artist: "Conan Gray", isExplicit: true },
    { _id: "5", title: "Younger You", artist: "Miley Cyrus", isExplicit: false },
    { _id: "6", title: "GARBAGE", artist: "Melanie Martinez", isExplicit: true },
  ];

  const displaySongs = songs.length > 0 ? songs.slice(0, 6) : mockSongs;

  return (
    <div className="flex-1 h-full bg-[#18181b] rounded-2xl overflow-y-auto border border-white/5 relative shadow-lg custom-scrollbar">
      {/* Soft Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-purple-900/40 via-purple-900/10 to-transparent pointer-events-none" />

      <div className="px-8 pt-12 pb-8 relative z-10">
        <h1 className="text-white text-4xl font-black tracking-tight mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
          {greeting}
        </h1>

        {/* Trending Songs */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-2xl font-bold tracking-tight">Những bài hát thịnh hành</h2>
            <a href="#" className="text-[#a1a1aa] text-[13px] font-bold hover:text-white transition uppercase tracking-wider">
              Hiện tất cả
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {displaySongs.map((song: any) => (
              <SongCard key={song._id} song={song} />
            ))}
          </div>
        </section>

        {/* Popular Artists */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-2xl font-bold tracking-tight">Nghệ sĩ phổ biến</h2>
            <a href="#" className="text-[#a1a1aa] text-[13px] font-bold hover:text-white transition uppercase tracking-wider">
              Hiện tất cả
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {placeholderArtists.map((name, i) => (
              <ArtistCard key={name} name={name} index={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
