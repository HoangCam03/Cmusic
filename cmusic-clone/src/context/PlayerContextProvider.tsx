import React, { useEffect, useRef, useState, FC, ReactNode } from "react";
import { PlayerContext } from "./PlayerContext";
import { fetchSongs, setCurrentTrack } from "../store/slices/songSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import { trackPlay, recordPlayHistory } from "../services/SongServices/ListSongs";

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
    const token = localStorage.getItem("token");
    if (status === "idle" && token) {
      dispatch(fetchSongs());
    }
  }, [status, dispatch]);

  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    const savedVolume = localStorage.getItem('cmusic_volume');
    return savedVolume ? parseFloat(savedVolume) : 0.7;
  });
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    localStorage.setItem('cmusic_volume', volume.toString());
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

  const [queue, setQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cmusic_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cmusic_queue', JSON.stringify(queue));
    } catch (e) {}
  }, [queue]);

  useEffect(() => {
    if (queue.length === 0 && songs.length > 0) {
      setQueue(songs);
    }
  }, [songs]);

  const playWithId = async (id: string, newQueue?: any[]): Promise<void> => {
    let activeQueue = queue;
    if (newQueue) {
      const normalizedQueue = newQueue.map((track: any) => ({
        ...track,
        file: track.file || track.audioUrl,
        image: track.image || track.coverUrl,
        name: track.name || track.title,
        artist: track.artist || track.artistId?.displayName || "Nghệ sĩ CMusic",
      }));
      setQueue(normalizedQueue);
      activeQueue = normalizedQueue;
    }

    let selectedTrack = activeQueue.find((song: any) => song._id === id);
    if (!selectedTrack) {
      selectedTrack = songs.find((song: any) => song._id === id);
      if (selectedTrack && !newQueue) {
        // Track not in current queue, and no new queue provided.
        // Fallback to the global songs list.
        setQueue(songs);
        activeQueue = songs;
      }
    }
    
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
    const currentIndex = queue.findIndex((song: any) => song._id === track?._id);
    if (currentIndex > 0) {
      dispatch(setCurrentTrack(queue[currentIndex - 1]));
      setTimeout(() => {
        audioRef.current?.play();
        setPlayStatus(true);
      }, 0);
    }
  };

  const next = async (): Promise<void> => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      dispatch(setCurrentTrack(queue[randomIndex]));
    } else {
      const currentIndex = queue.findIndex((song: any) => song._id === track?._id);
      if (currentIndex < queue.length - 1) {
        dispatch(setCurrentTrack(queue[currentIndex + 1]));
      } else if (isRepeat) {
        dispatch(setCurrentTrack(queue[0]));
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
          const currentTime = audioRef.current.currentTime;
          seekBar.current.style.width = Math.floor(
            (currentTime / audioRef.current.duration) * 100
          ) + "%";

          // Lưu vị trí hiện tại vào localStorage để khôi phục khi reload
          if (track?._id) {
            localStorage.setItem('cmusic_last_time', currentTime.toString());
            localStorage.setItem('cmusic_last_track_id', track._id);
          }

          setTime({
            currentTime: {
              second: Math.floor(currentTime % 60),
              minute: Math.floor(currentTime / 60),
            },
            totalTime: {
              second: Math.floor(audioRef.current.duration % 60),
              minute: Math.floor(audioRef.current.duration / 60),
            },
          });
        }
      };

      // Khôi phục vị trí phát cũ khi bài hát bắt đầu load (onloadedmetadata)
      audioRef.current.onloadedmetadata = () => {
        const savedTime = localStorage.getItem('cmusic_last_time');
        const savedTrackId = localStorage.getItem('cmusic_last_track_id');
        
        if (savedTime && savedTrackId === track?._id && audioRef.current) {
          audioRef.current.currentTime = parseFloat(savedTime);
          // Sau khi khôi phục xong thì có thể xóa hoặc để đó cập nhật tiếp
        }
      };

      audioRef.current.onplay = () => setPlayStatus(true);
      audioRef.current.onpause = () => setPlayStatus(false);

      audioRef.current.onended = () => {
        if (isRepeat && !isShuffle) {
          audioRef.current?.play();
        } else {
          next();
        }
      };
    }
  }, [audioRef, isRepeat, isShuffle, songs, track]);

  useEffect(() => {
    if (track?._id && playStatus) {
      // Ghi nhận lịch sử nghe nhạc (History Service)
      recordPlayHistory(track._id);
      
      // Tăng lượt nghe (Catalog Service)
      trackPlay(track._id);
    }
  }, [track?._id, playStatus]);

  useEffect(() => {
    if ('mediaSession' in navigator && track) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'CMusic',
        artwork: [
          { src: track.image || '', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => { play(); });
      navigator.mediaSession.setActionHandler('pause', () => { pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', () => { previous(); });
      navigator.mediaSession.setActionHandler('nexttrack', () => { next(); });
    }
  }, [track, playStatus]);

  const updateQueue = (newQueue: any[]) => {
    const normalizedQueue = newQueue.map((t: any) => ({
      ...t,
      file: t.file || t.audioUrl,
      image: t.image || t.coverUrl,
      name: t.name || t.title,
      artist: t.artist || t.artistId?.displayName || "Nghệ sĩ CMusic",
    }));
    setQueue(normalizedQueue);
  };

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
    updateQueue,
    previous,
    next,
    queue,
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
