import React, { useContext, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Player } from "./components/Player";
import { Display } from "./components/Display";
import { Header } from "./components/Header";
import { PlayerContext } from "./context/PlayerContext";
import { fetchPlaylists } from "./store/slices/playlistSlice";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import UploadPage from "./pages/UploadPage";
import AdminPage from "./pages/AdminPage";
import TrackManagementPage from "./pages/TrackManagementPage";
import ArtistManagementPage from "./pages/ArtistManagementPage";
import AlbumManagementPage from "./pages/AlbumManagementPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import PermissionPage from "./pages/PermissionPage";
import TrackDetailPage from "./pages/TrackDetailPage";
import ArtistDetailPage from "./pages/ArtistDetailPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import SearchPage from "./pages/SearchPage";
import { AdminLayout } from "./layouts/AdminLayout";
import { NowPlayingSidebar } from "./components/NowPlayingSidebar";
import { PlaylistDetailPage } from "./pages/PlaylistDetail";
import LikedSongsPage from "./pages/LikedSongsPage";
import ArtistStudioPage from "./pages/ArtistStudioPage";
import PricingPage from "./pages/PricingPage";
import { NotificationProvider } from "./context/NotificationContext";

import { useAppDispatch, useAppSelector } from "./store/store";
import { Toaster } from "react-hot-toast";

const App: React.FC = () => {
  const playerContext = useContext(PlayerContext);
  const audioRef = playerContext?.audioRef;
  const track = playerContext?.track;
  const location = useLocation();

  const dispatch = useAppDispatch();
  const { items: playlistsState } = useAppSelector((state) => state.playlists);

  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem("token"));

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  useEffect(() => {
    if (isLoggedIn && playlistsState.status === "idle") {
      dispatch(fetchPlaylists());
    }
  }, [playlistsState.status, dispatch, isLoggedIn]);

  return (
    <NotificationProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#161618',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '13px',
            fontWeight: '600',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
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
                  <Route path="tracks" element={<TrackManagementPage />} />
                  <Route path="albums" element={<AlbumManagementPage />} />
                  <Route path="artists" element={<ArtistManagementPage />} />
                  <Route path="users" element={<UserManagementPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="permissions" element={<PermissionPage />} />
                  <Route path="studio" element={<ArtistStudioPage />} />
                  <Route path="*" element={
                    JSON.parse(localStorage.getItem("user") || "{}").role === "artist" 
                    ? <ArtistStudioPage /> 
                    : <AdminPage />
                  } />
                </Routes>
              </AdminLayout>
            </div>
          }
        />

        {/* Client Zone */}
        <Route
          path="/*"
          element={
            <div className="h-screen flex flex-col bg-[#000000] font-sans selection:bg-purple-500/30 overflow-hidden">
              <div className="flex flex-1 overflow-hidden p-2 gap-2 pb-1">
                <Sidebar />
                <div className="flex-1 flex gap-1 overflow-hidden">
                  <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0c0c0c] rounded-2xl">
                    <Header />
                    <div className="flex-1 overflow-y-auto custom-scrollbar-hidden">
                      <Routes>
                        <Route path="/" element={<Display />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/track/:id" element={<TrackDetailPage />} />
                        <Route path="/artist/:id" element={<ArtistDetailPage />} />
                        <Route path="/album/:id" element={<AlbumDetailPage />} />
                        <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                        <Route path="/collection/tracks" element={<LikedSongsPage />} />
                        <Route path="/premium" element={<PricingPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                      </Routes>
                    </div>
                  </div>
                  <NowPlayingSidebar />
                </div>
              </div>

              {!isLoggedIn && (
                <div className="h-[72px] w-full px-8 flex justify-between items-center bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 shrink-0 relative overflow-hidden cursor-pointer" onClick={() => navigate("/signup")}>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455L18 2.25l.259 1.035a3.375 3.375 0 002.456-2.455L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.455z" />
                      </svg>
                    </div>
                    <div className="text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">Trải nghiệm CMusic</p>
                      <p className="font-bold text-[15px] tracking-tight truncate">Tham gia ngay để nghe nhạc không giới hạn và tạo playlist cá nhân!</p>
                    </div>
                  </div>
                  <button className="bg-white text-black text-[13px] font-black px-8 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10 shrink-0">
                    Đăng ký miễn phí
                  </button>
                </div>
              )}

              {isLoggedIn && track && <Player />}
              {isLoggedIn && track && <audio ref={audioRef} src={track.file} preload="auto"></audio>}
            </div>
          }
        />
      </Routes>
    </NotificationProvider>
  );
};

export default App;
