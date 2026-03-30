import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

interface Song {
  _id: string;
  title: string;
  artist?: string;
  coverImage?: string;
  isExplicit?: boolean;
}

interface SongCardProps {
  song: Song;
}

export function SongCard({ song }: SongCardProps) {
  const ctx = useContext(PlayerContext);

  return (
    <div
      className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 rounded-2xl cursor-pointer group shadow-lg hover:shadow-2xl hover:-translate-y-1"
      onClick={() => ctx?.playWithId(song._id)}
    >
      <div className="relative w-full aspect-square mb-4">
        {song.coverImage ? (
          <img
            src={song.coverImage}
            alt={song.title}
            className="w-full h-full object-cover rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center justify-center border border-white/5">
            <svg className="w-12 h-12 text-[#a1a1aa]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3H12z" />
            </svg>
          </div>
        )}
        {/* Play button overlay */}
        <button className="absolute bottom-3 right-3 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 hover:scale-105">
          <FontAwesomeIcon icon={faPlay} className="text-white w-4 h-4 ml-0.5" />
        </button>
      </div>
      <p className="text-white font-bold text-[15px] truncate">{song.title}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        {song.isExplicit && (
          <span className="shrink-0 inline-flex items-center justify-center w-4 h-4 bg-white/10 border border-white/10 text-[#a1a1aa] text-[9px] font-black rounded-sm">
            E
          </span>
        )}
        <p className="text-[#a1a1aa] text-xs font-medium truncate">{song.artist || "Nghệ sĩ"}</p>
      </div>
    </div>
  );
}
