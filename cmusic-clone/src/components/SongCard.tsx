import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";

interface Song {
  _id: string;
  title: string;
  artist?: string;
  coverImage?: string;
  image?: string;
  coverUrl?: string;
  isExplicit?: boolean;
}

interface SongCardProps {
  song: Song;
}

export function SongCard({ song }: SongCardProps) {
  const navigate = useNavigate();
  const ctx = useContext(PlayerContext);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup");
      return;
    }

    ctx?.playWithId(song._id);
  };

  const imageUrl = song.coverImage || song.image || song.coverUrl;
  const isCurrentTrack = ctx?.track?._id === song._id;
  const isPlaying = isCurrentTrack && ctx?.playStatus;

  return (
    <div
      className="transition-all duration-200 cursor-pointer group flex flex-col items-start relative"
      onClick={() => navigate(`/track/${song._id}`)}
    >
      <div className="relative w-full aspect-square mb-3">
        {imageUrl ? (
          <img
            src={imageUrl}
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
        
        {/* Actions Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {/* Play Button */}
          <button 
            className={`w-12 h-12 bg-[#a855f7] rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(168,85,247,0.4)] ${isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0'} transition-all duration-300 hover:scale-105 hover:bg-[#c084fc]`}
            onClick={handlePlay}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className={`text-white w-5 h-5 ${isPlaying ? '' : 'ml-1'}`} />
          </button>
        </div>
      </div>
      <p className="text-white font-medium text-[15px] truncate w-full mb-1 tracking-tight font-outfit">{song.title}</p>
      <div className="flex items-center gap-1.5 min-w-0 pr-1">
        {song.isExplicit && (
          <span className="shrink-0 inline-flex items-center justify-center w-3 h-3 border border-zinc-600 text-zinc-500 text-[8px] font-bold rounded-[2px] mt-0.5">
            E
          </span>
        )}
        <div className="flex items-center gap-x-1 truncate w-full">
          {Array.isArray((song as any).officialArtistId) && (song as any).officialArtistId.length > 0 ? (
            (song as any).officialArtistId.map((artist: any, idx: number) => (
              <React.Fragment key={artist?._id || idx}>
                <span 
                  className="text-zinc-500 text-[12px] tracking-wide font-light hover:text-white hover:underline cursor-pointer transition-colors shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    const artistId = artist?._id || artist;
                    if (artistId && typeof artistId === 'string') navigate(`/artist/${artistId}`);
                  }}
                >
                  {artist?.name || song.artist}
                </span>
                {idx < (song as any).officialArtistId.length - 1 && (
                  <span className="text-zinc-700 text-[11px] shrink-0">,</span>
                )}
              </React.Fragment>
            ))
          ) : (
            <span 
              className="text-zinc-500 text-[12px] truncate tracking-wide font-light hover:text-white hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const oai = (song as any).officialArtistId;
                const mainArtist = Array.isArray(oai) ? oai[0] : oai;
                const id = mainArtist?._id || mainArtist;
                if (id && typeof id === 'string') navigate(`/artist/${id}`);
              }}
            >
              {song.artist || (song as any).artistId?.displayName || "Nghệ sĩ"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
