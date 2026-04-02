import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faStepForward,
  faStepBackward,
  faShuffle,
  faRepeat,
  faVolumeHigh,
  faExpand,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";

export function Player() {
  const ctx = useContext(PlayerContext);

  const formatTime = (min: number, sec: number) =>
    `${min}:${sec.toString().padStart(2, "0")}`;

  return (
    <div className="h-[96px] bg-[#09090b]/40 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between px-8 shrink-0 relative z-50">
      <div className="flex items-center gap-5 w-[30%] min-w-0">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <svg className="w-6 h-6 text-purple-400/80 relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3H12z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-white text-[14px] font-medium hover:text-purple-400 transition-colors cursor-pointer truncate tracking-tight">
            {ctx?.track?.title || "Chưa có bài hát"}
          </p>
          <p className="text-zinc-500 text-[12px] font-normal hover:text-zinc-300 transition-colors cursor-pointer truncate mt-0.5 tracking-wide">
            {ctx?.track?.artist || "Nghệ sĩ"}
          </p>
        </div>
        <button className="text-zinc-600 hover:text-pink-500 transition-all ml-3 shrink-0 transform hover:scale-110 active:scale-90">
          <FontAwesomeIcon icon={faHeart} className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 w-[40%] max-w-[700px]">
        <div className="flex items-center gap-8">
          <button 
            onClick={ctx?.toggleShuffle} 
            className={`${ctx?.isShuffle ? "text-purple-500" : "text-zinc-500"} hover:text-white transition-all transform hover:scale-110 active:scale-90`}
          >
            <FontAwesomeIcon icon={faShuffle} className="w-3.5 h-3.5" />
          </button>
          <button onClick={ctx?.previous} className="text-zinc-400 hover:text-white transition-all transform hover:scale-110 active:scale-90">
            <FontAwesomeIcon icon={faStepBackward} className="w-4 h-4" />
          </button>
          <button
            onClick={ctx?.playStatus ? ctx.pause : ctx?.play}
            className="w-11 h-11 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl"
          >
            <FontAwesomeIcon icon={ctx?.playStatus ? faPause : faPlay} className="w-4 h-4 ml-0.5" />
          </button>
          <button onClick={ctx?.next} className="text-zinc-400 hover:text-white transition-all transform hover:scale-110 active:scale-90">
            <FontAwesomeIcon icon={faStepForward} className="w-4 h-4" />
          </button>
          <button 
            onClick={ctx?.toggleRepeat}
            className={`${ctx?.isRepeat ? "text-purple-500" : "text-zinc-500"} hover:text-white transition-all transform hover:scale-110 active:scale-90`}
          >
            <FontAwesomeIcon icon={faRepeat} className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4 w-full">
          <span className="text-zinc-600 text-[11px] font-normal min-w-[40px] text-right tracking-tighter">
            {ctx?.time ? formatTime(ctx.time.currentTime.minute, ctx.time.currentTime.second) : "0:00"}
          </span>
          <div
            ref={ctx?.seekBg}
            onClick={ctx?.seekSong}
            className="flex-1 h-[3px] bg-white/5 rounded-full cursor-pointer group relative transition-all hover:h-[5px]"
          >
            <div
              ref={ctx?.seekBar}
              className="h-full bg-white rounded-full transition-all relative group-hover:bg-purple-500"
            ></div>
          </div>
          <span className="text-zinc-600 text-[11px] font-normal min-w-[40px] tracking-tighter">
            {ctx?.time ? formatTime(ctx.time.totalTime.minute, ctx.time.totalTime.second) : "--:--"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5 w-[30%] justify-end">
        <button className="text-zinc-500 hover:text-white transition-all transform hover:scale-110">
          <FontAwesomeIcon icon={faVolumeHigh} className="w-3.5 h-3.5" />
        </button>
        <div className="w-24 h-[3px] bg-white/5 rounded-full cursor-pointer relative group transition-all hover:h-[5px]">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ctx?.volume}
            onChange={ctx?.changeVolume}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            style={{ width: `${(ctx?.volume || 0) * 100}%` }}
            className="h-full bg-zinc-400 rounded-full transition-all group-hover:bg-purple-500"
          ></div>
        </div>
        <button className="text-zinc-500 hover:text-white transition-all transform hover:scale-110">
          <FontAwesomeIcon icon={faExpand} className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
