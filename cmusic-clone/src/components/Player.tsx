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
    <div className="h-[90px] bg-[#18181b]/80 backdrop-blur-md border border-white/5 rounded-2xl flex items-center justify-between px-6 shrink-0 shadow-lg">
      <div className="flex items-center gap-4 w-[30%] min-w-0">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl shadow-lg flex items-center justify-center shrink-0 border border-white/5">
          <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3H12z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-white text-[15px] font-bold hover:text-purple-400 transition-colors cursor-pointer truncate">
            {ctx?.track?.title || "Chưa có bài hát"}
          </p>
          <p className="text-[#a1a1aa] text-xs font-medium cursor-pointer truncate mt-0.5">
            {ctx?.track?.artist || "Nghệ sĩ"}
          </p>
        </div>
        <button className="text-[#a1a1aa] hover:text-pink-500 transition-colors ml-2 shrink-0">
          <FontAwesomeIcon icon={faHeart} className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 w-[40%] max-w-[600px]">
        <div className="flex items-center gap-6">
          <button className="text-[#a1a1aa] hover:text-white transition">
            <FontAwesomeIcon icon={faShuffle} className="w-4 h-4" />
          </button>
          <button onClick={ctx?.previous} className="text-[#a1a1aa] hover:text-white transition">
            <FontAwesomeIcon icon={faStepBackward} className="w-4 h-4" />
          </button>
          <button
            onClick={ctx?.playStatus ? ctx.pause : ctx?.play}
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-105 transition-all duration-300"
          >
            <FontAwesomeIcon icon={ctx?.playStatus ? faPause : faPlay} className="w-4 h-4 ml-0.5" />
          </button>
          <button onClick={ctx?.next} className="text-[#a1a1aa] hover:text-white transition">
            <FontAwesomeIcon icon={faStepForward} className="w-4 h-4" />
          </button>
          <button className="text-[#a1a1aa] hover:text-white transition">
            <FontAwesomeIcon icon={faRepeat} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full">
          <span className="text-[#a1a1aa] text-xs font-medium min-w-[35px] text-right">
            {ctx?.time ? formatTime(ctx.time.currentTime.minute, ctx.time.currentTime.second) : "0:00"}
          </span>
          <div
            ref={ctx?.seekBg}
            onClick={ctx?.seekSong}
            className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative overflow-hidden"
          >
            <div
              ref={ctx?.seekBar}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-colors relative"
            ></div>
          </div>
          <span className="text-[#a1a1aa] text-xs font-medium min-w-[35px]">
            {ctx?.time ? formatTime(ctx.time.totalTime.minute, ctx.time.totalTime.second) : "--:--"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-[30%] justify-end">
        <button className="text-[#a1a1aa] hover:text-white transition">
          <FontAwesomeIcon icon={faVolumeHigh} className="w-4 h-4" />
        </button>
        <div className="w-24 h-1.5 bg-white/10 rounded-full cursor-pointer group overflow-hidden">
          <div className="w-[70%] h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-colors"></div>
        </div>
        <button className="text-[#a1a1aa] hover:text-white transition">
          <FontAwesomeIcon icon={faExpand} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
