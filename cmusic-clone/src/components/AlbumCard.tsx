import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

interface AlbumCardProps {
  album: {
    _id: string;
    title: string;
    coverUrl: string;
    artistId?: {
      displayName: string;
    };
    releaseDate: string;
  };
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/album/${album._id}`)}
      className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer group border border-white/5 shadow-lg flex flex-col h-full"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-zinc-800">
        <img
          src={album.coverUrl}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt={album.title}
        />
        
        {/* Hover Play Button */}
        <div className="absolute right-3 bottom-3 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95">
          <FontAwesomeIcon icon={faPlay} className="ml-1 text-lg" />
        </div>
      </div>

      <div className="flex flex-col min-w-0">
        <h3 className="text-white font-bold text-[15px] truncate tracking-tight mb-1 group-hover:text-purple-400 transition-colors">
          {album.title}
        </h3>
        <p className="text-zinc-500 text-[13px] truncate font-medium tracking-tight">
          {album.artistId?.displayName || "Nghệ sĩ CMusic"}
        </p>
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mt-2">
          {new Date(album.releaseDate).getFullYear()} • Album
        </p>
      </div>
    </div>
  );
};
