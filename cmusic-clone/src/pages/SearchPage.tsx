import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { SongCard } from "../components/SongCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faMicrophone } from "@fortawesome/free-solid-svg-icons";

const SearchPage: React.FC = () => {
  const { items: songs } = useSelector((state: RootState) => state.songs);

  return (
    <div className="flex-1 bg-transparent p-8 md:px-12 pb-32">
      {/* Search Header */}
      <div className="max-w-4xl mb-12">
        <h1 className="text-white text-4xl font-black mb-6 tracking-tight">Tìm kiếm</h1>
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Bạn muốn nghe gì?" 
            className="w-full bg-[#18181b] border border-white/5 text-white text-sm rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-[#242427] transition-all placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Results Content */}
      <div className="space-y-12">
        {/* All Songs Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
               <FontAwesomeIcon icon={faMicrophone} className="text-purple-500 text-sm" />
            </div>
            <h2 className="text-white text-2xl font-black tracking-tight">Tất cả bài hát</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {songs.map((song: any) => (
              <SongCard key={song._id} song={song} />
            ))}
          </div>
        </section>

        {/* Categories / Genre (Optional for future) */}
        <section>
           <h3 className="text-white text-xl font-bold mb-6">Duyệt tìm tất cả</h3>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[
                { name: "Podcast", bg: "bg-pink-600" },
                { name: "Sự kiện trực tiếp", bg: "bg-purple-700" },
                { name: "Dành cho bạn", bg: "bg-blue-600" },
                { name: "Mới phát hành", bg: "bg-orange-600" },
                { name: "Pop", bg: "bg-emerald-600" },
                { name: "K-Pop", bg: "bg-sky-600" },
                { name: "Hip-Hop", bg: "bg-rose-600" },
                { name: "Hành trình", bg: "bg-indigo-600" }
              ].map(cat => (
                <div key={cat.name} className={`${cat.bg} aspect-[16/10] rounded-xl p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}>
                   <span className="text-white font-black text-xl tracking-tighter">{cat.name}</span>
                   <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-white/10 rotate-12 blur-xl" />
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export default SearchPage;
