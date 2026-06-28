import React from "react";

interface ArtistCardProps {
  artist: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  return (
    <div
      onClick={() => {
        // Option to navigate to an Artist Page if it exists, otherwise just a placeholder
      }}
      className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer group flex flex-col items-center text-center h-full border border-transparent hover:border-white/5"
    >
      <div className="w-32 h-32 rounded-full overflow-hidden mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-zinc-800">
        {artist.avatarUrl ? (
          <img
            src={artist.avatarUrl}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            alt={artist.name}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br from-indigo-500 to-purple-600">
            {artist.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <h3 className="text-white font-bold text-[15px] truncate tracking-tight mb-1 group-hover:text-purple-400 transition-colors w-full">
        {artist.name}
      </h3>
      <p className="text-zinc-500 text-[13px] font-medium tracking-tight">
        Nghệ sĩ
      </p>
    </div>
  );
};
