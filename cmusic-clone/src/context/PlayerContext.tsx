import { createContext, RefObject, Dispatch, SetStateAction } from "react";

export interface PlayerContextType {
  audioRef: RefObject<HTMLAudioElement>;
  seekBg: RefObject<HTMLDivElement>;
  seekBar: RefObject<HTMLDivElement>;
  track: any;
  playStatus: boolean;
  setPlayStatus: Dispatch<SetStateAction<boolean>>;
  time: {
    currentTime: { second: number; minute: number };
    totalTime: { second: number; minute: number };
  };
  setTime: Dispatch<SetStateAction<{ currentTime: { second: number; minute: number }; totalTime: { second: number; minute: number } }>>;
  play: () => void;
  pause: () => void;
  playWithId: (id: string, queue?: any[]) => Promise<void>;
  previous: () => Promise<void>;
  next: () => Promise<void>;
  queue: any[]; // Danh sách bài hát đang chờ phát
  updateQueue: (newQueue: any[]) => void;
  seekSong: (e: React.MouseEvent<HTMLDivElement>) => Promise<void>;
  isShuffle: boolean;
  toggleShuffle: () => void;
  isRepeat: boolean;
  toggleRepeat: () => void;
  volume: number;
  changeVolume: (e: any) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>;
}

export const PlayerContext = createContext<PlayerContextType | null>(null);
