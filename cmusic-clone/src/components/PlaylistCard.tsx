import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    thumbnail?: string;
    userId?: {
      displayName: string;
    };
    isPublic: boolean;
  };
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/playlist/${playlist._id}`)}
      className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer group border border-white/5 shadow-lg flex flex-col h-full"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-zinc-800">
        <img
          src={playlist.thumbnail || "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt={playlist.name}
        />
        
        {/* Hover Play Button */}
        <div className="absolute right-3 bottom-3 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95">
          <FontAwesomeIcon icon={faPlay} className="ml-1 text-lg" />
        </div>
      </div>

      <div className="flex flex-col min-w-0">
        <h3 className="text-white font-bold text-[15px] truncate tracking-tight mb-1 group-hover:text-purple-400 transition-colors">
          {playlist.name}
        </h3>
        <p className="text-zinc-500 text-[13px] truncate font-medium tracking-tight">
          Bởi {playlist.userId?.displayName || "Người dùng CMusic"}
        </p>
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mt-2">
          Playlist
        </p>
      </div>
    </div>
  );
};
