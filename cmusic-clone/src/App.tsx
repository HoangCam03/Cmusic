import React, { useContext, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Player } from "./components/Player";
import { Display } from "./components/Display";
import { Header } from "./components/Header";
import { PlayerContext } from "./context/PlayerContext";
import { fetchSongs } from "./store/slices/songSlice";
import { fetchPlaylists } from "./store/slices/playlistSlice";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { useAppDispatch, useAppSelector } from "./store/store";
import { UploadPage } from "./pages/UploadPage";
import { AdminLayout } from "./layouts/AdminLayout";

const App: React.FC = () => {
  const playerContext = useContext(PlayerContext);
  const audioRef = playerContext?.audioRef;
  const track = playerContext?.track;
  const location = useLocation();

  const dispatch = useAppDispatch();
  const { status: songsStatus } = useAppSelector((state) => state.songs);
  const { items: playlistsState } = useAppSelector((state) => state.playlists);

  useEffect(() => {
    if (songsStatus === "idle") {
      dispatch(fetchSongs());
    }
    if (playlistsState.status === "idle") {
      dispatch(fetchPlaylists());
    }
  }, [songsStatus, playlistsState.status, dispatch]);

  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem("token"));

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  return (
    <Routes>
      {/* Auth pages - KHÔNG nằm trong wrapper overflow-hidden, tự cuộn tự do */}
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Admin Zone */}
      <Route
        path="/admin/*"
        element={
          <div className="h-screen bg-black font-sans selection:bg-purple-500/30 overflow-hidden">
            <AdminLayout>
              <Routes>
                <Route path="upload" element={<UploadPage />} />
                <Route path="tracks" element={<div className="text-white text-3xl font-semibold italic">Quản lý bài hát (Sắp ra mắt)</div>} />
                <Route path="*" element={<div className="text-white text-3xl font-semibold italic">Chào mừng Admin CMusic!</div>} />
              </Routes>
            </AdminLayout>
          </div>
        }
      />

      {/* Client Zone */}
      <Route
        path="/*"
        element={
          <div className="h-screen font-sans selection:bg-purple-500/30 overflow-hidden flex bg-[#09090b]">
            {/* Left Sidebar — full height, no header */}
            <Sidebar />

            {/* Right Panel — Header + Content + Banner */}
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
              {/* Header — only in right panel */}
              <Header />

              {/* Main scrollable content */}
              <div className="flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Display />} />
                </Routes>
              </div>

              {/* Bottom Promotional Bar - Hide if logged in */}
              {!isLoggedIn && (
                <div className="h-[72px] w-full px-8 flex justify-between items-center bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 shrink-0 relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.455z" />
                      </svg>
                    </div>
                    <div className="text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70 mb-0.5">Trải nghiệm CMusic</p>
                      <p className="font-medium text-[15px] tracking-tight">
                        Tận hưởng kho nhạc không giới hạn với chất lượng đỉnh cao. Tham gia ngay hôm nay!
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate("/signup")}
                    className="bg-white text-black text-[13px] font-semibold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl relative z-10 shrink-0"
                  >
                    Đăng ký miễn phí
                  </button>
                </div>
              )}
            </div>

            {playerContext?.playStatus && <Player />}
            {track && <audio ref={audioRef} src={track.file} preload="auto"></audio>}
          </div>
        }
      />
    </Routes>
  );
};

export default App;
