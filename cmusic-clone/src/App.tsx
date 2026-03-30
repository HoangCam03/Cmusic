import React, { useContext, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Player } from "./components/Player";
import { Display } from "./components/Display";
import { Header } from "./components/Header";
import { PlayerContext } from "./context/PlayerContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchSongs } from "./store/slices/songSlice";
import { fetchPlaylists } from "./store/slices/playlistSlice";
import Register from "./components/Register/Register.tsx";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import { RootState, AppDispatch } from "./store/store";

const App: React.FC = () => {
  const playerContext = useContext(PlayerContext);
  const audioRef = playerContext?.audioRef;
  const track = playerContext?.track;

  const dispatch = useDispatch<AppDispatch>();
  const { status: songsStatus } = useSelector((state: RootState) => state.songs);
  const { items: playlistsState } = useSelector((state: RootState) => state.playlists);

  useEffect(() => {
    if (songsStatus === "idle") {
      dispatch(fetchSongs());
    }
    if (playlistsState.status === "idle") {
      dispatch(fetchPlaylists());
    }
  }, [songsStatus, playlistsState.status, dispatch]);

  return (
    <div className="h-screen bg-[#09090b] flex flex-col p-3 gap-3 font-sans overflow-hidden text-[#a1a1aa] selection:bg-purple-500/30">
      <Routes>
        <Route path="/signup" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <>
              <Header />

              <div className="flex-1 flex gap-3 overflow-hidden">
                <Sidebar />
                <Display />
              </div>

              {/* Bottom Promotional Bar - K-Style Glassmorphism */}
              <div className="h-[80px] w-full px-8 py-4 flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                <div className="text-white flex flex-col justify-center">
                  <p className="text-[13px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest mb-1.5">
                    Trải nghiệm CMusic
                  </p>
                  <p className="font-medium text-[15px] opacity-90 tracking-wide">
                    Tận hưởng kho nhạc không giới hạn với chất lượng đỉnh cao. Tham gia ngay hôm nay!
                  </p>
                </div>
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold py-3.5 px-10 rounded-full hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all duration-300">
                  Đăng ký miễn phí
                </button>
              </div>

              {playerContext?.playStatus && <Player />}
              {track && <audio ref={audioRef} src={track.file} preload="auto"></audio>}
            </>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
