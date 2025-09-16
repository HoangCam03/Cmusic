import { Routes, Route, useLocation } from 'react-router-dom';
import DisplayHome from './DisplayHome';
import DisplayPlaylist from './DisplayPlaylist';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Register from './Register/Register';
import CreatePlaylist from './CreatePlaylist/CreatePlaylist';

const Display = () => {
  const displayRef = useRef();
  const location = useLocation();
  const isPlaylist = location.pathname.includes("/playlist/");
  const playlistId = isPlaylist ? location.pathname.split('/').pop() : "";

  const { items: playlists = {} } = useSelector((state) => state.playlists);
  const playlistArray = playlists.data || [];
  const currentPlaylist = playlistArray.find((p) => p._id === playlistId || String(p.id) === playlistId);

  console.log("playlistArray1 (render): ", playlistArray );
  
  // Determine if the current route requires full width (no horizontal padding)
  const isFullWidthRoute = location.pathname === '/create-playlist'; // Add other full-width routes here if needed

  useEffect(() => {
    if (!displayRef.current) return;
    console.log("playlists state changed (useEffect): ", playlists);
    console.log("playlistArray (useEffect): ", playlistArray);
    if (isPlaylist) {
      if (currentPlaylist && typeof currentPlaylist.bgcolor === 'string' && currentPlaylist.bgcolor.startsWith('#')) {
        displayRef.current.style.background = `linear-gradient(to bottom, ${currentPlaylist.bgcolor}, #121212)`;
      } else {
        displayRef.current.style.background = "#121212"; // Default background if playlist has no color
      }
    } else {
      displayRef.current.style.background = "#121212"; // Default background for other routes
    }
  }, [location.pathname, playlistId, isPlaylist, playlists]);

  return (
    <div 
      ref={displayRef} 
      className={`w-[100%] text-white overflow-auto lg:w-[75%] lg:ml-0 mr-2 rounded-lg ${isFullWidthRoute ? '' : 'px-6 rounded bg-[#121212]'}`} // Conditionally apply padding and rounded corners
    >
      <Routes>
        <Route path="/" element={<DisplayHome />} />
        <Route path="/playlist/:id" element={<DisplayPlaylist />} />
        <Route path="/create-playlist" element={<CreatePlaylist />} />
       
          
      </Routes>
    </div>
  );
}

export default Display;


