import Sidebar from './components/Sidebar'
import Player from './components/Player'
import Display from './components/Display'
import Header from './components/Header'
import { useContext, useEffect } from 'react'
import { PlayerContext } from './context/PlayerContext'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSongs } from './store/slices/songSlice'
import { fetchPlaylists } from './store/slices/playlistSlice'
import Register from './components/Register/Register'
import { Routes, Route } from 'react-router-dom'
import Login from './components/Login/Login'

const App = () => {
  const { audioRef, track } = useContext(PlayerContext);
  const dispatch = useDispatch();
  const { status: songsStatus } = useSelector((state) => state.songs);
  const { items: playlists, status: playlistsStatus, error: playlistsError } = useSelector((state) => state.playlists.items);

  console.log('App - initial playlists status:', playlistsStatus);

  useEffect(() => {
    console.log('App - useEffect triggered. Current playlists status:', playlistsStatus);
    if (songsStatus === 'idle') {
      dispatch(fetchSongs());
    }
    if (playlistsStatus === 'idle') {
      console.log('App - Dispatching fetchPlaylists...');
      dispatch(fetchPlaylists());
    } else {
      console.log('App - Not dispatching fetchPlaylists. Status is:', playlistsStatus);
    }
  }, [songsStatus, playlistsStatus, dispatch]);

  // Optional: Log playlists data and error from App for debugging
  // useEffect(() => {
  //   console.log('App - playlists data:', playlists);
  //   if(playlistsError) {
  //     console.error('App - playlists error:', playlistsError);
  //   }
  // }, [playlists, playlistsError]);

  return (
    <div className="h-screen bg-black">
      <Routes>
        <Route path="/signup" element={<Register />} />
        <Route path='/login' element={<Login/>} />
        <Route path="/*" element={
          <>
            <Header className="sticky top-0 left-0 right-0 z-50" />
            <div className="h-[80%] flex">
              <Sidebar />
              <Display />
            </div>
            <Player />
            {track && <audio ref={audioRef} src={track.file} preload="auto"></audio>}
          </>
        } />
      </Routes>
    </div>
  );
}

export default App