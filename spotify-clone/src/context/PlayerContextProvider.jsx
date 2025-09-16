import { useEffect, useRef, useState } from "react";
import { PlayerContext } from "./PlayerContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchSongs, setCurrentTrack } from "../store/slices/songSlice";

const PlayerContextProvider = ({ children }) => {
    const audioRef = useRef();
    const seekBg = useRef();
    const seekBar = useRef();
    const dispatch = useDispatch();
    const { items: songs, currentTrack: track, status } = useSelector((state) => state.songs);
    const [playStatus, setPlayStatus] = useState(false);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchSongs());
        }
    }, [status, dispatch]);

    ///Set time run
    const [time, setTime] = useState({
        currentTime: { second: 0, minute: 0 },
        totalTime: {
            second: 0,
            minute: 0
        },
    });
    // const [volume, setVolume] = useState(0.5);
    // const [seek, setSeek] = useState(0)
    // const [current, setCurrent] = useState(0)
    // const [duration, setDuration] = useState(0)
    // const [isPlaying, setIsPlaying] = useState(false)
    // const [isSeeking, setIsSeeking] = useState(false)

    const play = () => {
        audioRef.current.play();
        setPlayStatus(true);
    }

    const pause = () => {
        audioRef.current.pause();
        setPlayStatus(false);
    }

    const playWithId = async (id) => {
        const selectedTrack = songs.find(song => song._id === id);
        if (!selectedTrack) return;

        if (track._id === id) {
            if (playStatus) {
                audioRef.current.pause();
                setPlayStatus(false);
            } else {
                audioRef.current.play();
                setPlayStatus(true);
            }
        } else {
            dispatch(setCurrentTrack(selectedTrack));
            setTimeout(() => {
                audioRef.current.play();
                setPlayStatus(true);
            }, 0);
        }
    };

    const previous = async () => {
        const currentIndex = songs.findIndex(song => song._id === track._id);
        if (currentIndex > 0) {
            dispatch(setCurrentTrack(songs[currentIndex - 1]));
            setTimeout(() => {
                audioRef.current.play();
                setPlayStatus(true);
            }, 0);
        }
    };

    const next = async () => {
        const currentIndex = songs.findIndex(song => song._id === track._id);
        if (currentIndex < songs.length - 1) {
            dispatch(setCurrentTrack(songs[currentIndex + 1]));
            setTimeout(() => {
                audioRef.current.play();
                setPlayStatus(true);
            }, 0);
        }
    }

    const seekSong = async (e) => {
        audioRef.current.currentTime = ((e.nativeEvent.offsetX / seekBg.current.offsetWidth) * audioRef.current.duration).toFixed(2);
    }

    useEffect(() => {
        setTimeout(() => {
            audioRef.current.ontimeupdate = () => {
                seekBar.current.style.width = (Math.floor(audioRef.current.currentTime / audioRef.current.duration * 100) + "%")

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
            };
        }, 1000)
    }, [audioRef])

    const contextValue = {
        audioRef,
        seekBg,
        seekBar,
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

        // volume,
        // setVolume,
        // seek,
        // setSeek,
        // current,
        // setCurrent,
        // duration,
        // setDuration,
        // isPlaying,
        // setIsPlaying,
        // isSeeking,
        // setIsSeeking,
    };

    return (
        <PlayerContext.Provider value={contextValue}>
            {children}
        </PlayerContext.Provider>
    );
};

export default PlayerContextProvider;
