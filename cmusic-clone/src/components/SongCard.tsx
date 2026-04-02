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
      className="transition-all duration-200 cursor-pointer group flex flex-col items-start"
      onClick={() => ctx?.playWithId(song._id)}
    >
      <div className="relative w-full aspect-square mb-3">
        {song.coverImage ? (
          <img
            src={song.coverImage}
            alt={song.title}
            className="w-full h-full object-cover rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]" style={{background: '#1c1c1e'}}>
            <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3H12z" />
            </svg>
          </div>
        )}
        {/* Play button overlay */}
        <button className="absolute bottom-3 right-3 w-12 h-12 bg-[#a855f7] rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(168,85,247,0.4)] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#c084fc]">
          <FontAwesomeIcon icon={faPlay} className="text-white w-5 h-5 ml-1" />
        </button>
      </div>
      <p className="text-white font-medium text-[15px] truncate w-full mb-1 tracking-tight font-outfit">{song.title}</p>
      <div className="flex items-center gap-2 w-full">
        {song.isExplicit && (
          <span className="shrink-0 inline-flex items-center justify-center w-3 h-3 border border-zinc-600 text-zinc-500 text-[8px] font-bold rounded-[2px]">
            E
          </span>
        )}
        <p className="text-zinc-500 text-[12px] truncate tracking-wide font-light">{song.artist || "Nghệ sĩ"}</p>
      </div>
    </div>
  );
}
