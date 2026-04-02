import React, { useEffect, useRef, useState, FC, ReactNode } from "react";
import { PlayerContext } from "./PlayerContext";
import { fetchSongs, setCurrentTrack } from "../store/slices/songSlice";
import { useAppDispatch, useAppSelector } from "../store/store";

interface PlayerContextProviderProps {
  children: ReactNode;
}

const PlayerContextProvider: FC<PlayerContextProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekBg = useRef<HTMLDivElement>(null);
  const seekBar = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { items: songs, currentTrack: track, status } = useAppSelector((state) => state.songs);
  const [playStatus, setPlayStatus] = useState<boolean>(false);
  const [time, setTime] = useState({
    currentTime: { second: 0, minute: 0 },
    totalTime: { second: 0, minute: 0 },
  });

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchSongs());
    }
  }, [status, dispatch]);

  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);
  
  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
  };

  const play = (): void => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlayStatus(true);
    }
  };

  const pause = (): void => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayStatus(false);
    }
  };

  const playWithId = async (id: string): Promise<void> => {
    const selectedTrack = songs.find((song: any) => song._id === id);
    if (!selectedTrack) return;

    if (track && track._id === id) {
      if (playStatus) {
        audioRef.current?.pause();
        setPlayStatus(false);
      } else {
        audioRef.current?.play();
        setPlayStatus(true);
      }
    } else {
      dispatch(setCurrentTrack(selectedTrack));
      setTimeout(() => {
        audioRef.current?.play();
        setPlayStatus(true);
      }, 0);
    }
  };

  const previous = async (): Promise<void> => {
    const currentIndex = songs.findIndex((song: any) => song._id === track?._id);
    if (currentIndex > 0) {
      dispatch(setCurrentTrack(songs[currentIndex - 1]));
      setTimeout(() => {
        audioRef.current?.play();
        setPlayStatus(true);
      }, 0);
    }
  };

  const next = async (): Promise<void> => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      dispatch(setCurrentTrack(songs[randomIndex]));
    } else {
      const currentIndex = songs.findIndex((song: any) => song._id === track?._id);
      if (currentIndex < songs.length - 1) {
        dispatch(setCurrentTrack(songs[currentIndex + 1]));
      } else if (isRepeat) {
        dispatch(setCurrentTrack(songs[0]));
      }
    }
    
    setTimeout(() => {
      audioRef.current?.play();
      setPlayStatus(true);
    }, 0);
  };

  const seekSong = async (e: React.MouseEvent<HTMLDivElement>): Promise<void> => {
    if (audioRef.current && seekBg.current) {
      audioRef.current.currentTime =
        ((e.nativeEvent.offsetX / seekBg.current.offsetWidth) * audioRef.current.duration);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.ontimeupdate = () => {
        if (seekBar.current && audioRef.current && !isNaN(audioRef.current.duration)) {
          seekBar.current.style.width = Math.floor(
            (audioRef.current.currentTime / audioRef.current.duration) * 100
          ) + "%";

          setTime({
            currentTime: {
              second: Math.floor(audioRef.current.currentTime % 60),
              minute: Math.floor(audioRef.current.currentTime / 60),
            },
            totalTime: {
              second: Math.floor(audioRef.current.duration % 60),
              minute: Math.floor(audioRef.current.duration / 60),
            },
          });
        }
      };

      audioRef.current.onended = () => {
        if (isRepeat && !isShuffle) {
          audioRef.current?.play();
        } else {
          next();
        }
      };
    }
  }, [audioRef, isRepeat, isShuffle, songs, track]);

  const contextValue = {
    audioRef: audioRef as React.RefObject<HTMLAudioElement>,
    seekBg: seekBg as React.RefObject<HTMLDivElement>,
    seekBar: seekBar as React.RefObject<HTMLDivElement>,
    track,
    playStatus,
    setPlayStatus,
    time,
    setTime,
    play,
    pause,
    playWithId,
    previous,
    next,
    seekSong,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    volume,
    changeVolume,
    isSearchOpen,
    setIsSearchOpen
  };

  return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};

export default PlayerContextProvider;
