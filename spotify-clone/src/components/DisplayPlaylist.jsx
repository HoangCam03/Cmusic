import { useParams } from "react-router-dom";
import Navbar from "./Navbar";
import { assets } from "../assets/assets";
import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";

const DisplayPlaylist = () => {
  const { id } = useParams();
  const { items: playlists = {}, status: playlistsStatus } = useSelector((state) => state.playlists);
  const playlistArray = playlists.data || [];
  const { items: songs, status: songsStatus } = useSelector((state) => state.songs);

  const playlistData = playlistArray.find(playlist => playlist._id === id);

  if (playlistsStatus === 'loading' || songsStatus === 'loading') {
    return <div className="text-white p-4">Loading...</div>;
  }

  if (!playlistData) {
    if(playlistsStatus === 'loading') return <div className="text-white p-4">Loading playlist...</div>;
    return <p className="text-white p-4">Playlist not found</p>;
  }

  // Lấy từng trường
  const { name, image, desc, bgcolor } = playlistData;

  const { playWithId, playStatus, track } = useContext(PlayerContext);

  const handleClickSong = (songId) => {
    playWithId(songId)
  };

  // Lọc các bài hát thuộc playlist hiện tại
  const playlistSongs = songs.filter(song => song.playlist === playlistData._id);

  const formatDuration = (duration) => {
    if (!duration) return "00:00";
    const [min, sec] = duration.split(':').map(Number);
    const formattedMin = String(min).padStart(2, '0');
    const formattedSec = String(Math.floor(sec)).padStart(2, '0');
    return `${formattedMin}:${formattedSec}`;
  };

  return (
    <div>
      <div className="mt-5 flex gap-8 flex-col md:flex-row md:items-start p-4">
        <img className="w-60 rounded shadow-md" src={playlistData.image} alt="image" />
        <div className="flex flex-col">
          <p className="mt-[64px]">Playlist</p>
          <h2 className="text-5xl font-bold mb-4 md:text-7xl">
            {playlistData.name}
          </h2>
          <h4>{playlistData.desc}</h4>
          <p className="flex gap-3 mt-5">
            <img className="inline-block w-5" src={assets.logoGreen} alt="logo" />
            <b>Spotify</b>•<b>{playlistSongs.length} songs,</b>
            about {Math.floor(playlistSongs.length * 3.5)} min
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-3 mt-10 mb-4 pl-2 text-[#a7a7a7]">
        <p>
          <b className="mr-4">#</b>
          Title
        </p>
        <p className="text-center">Album</p>
        <p className="text-right pr-4">Duration</p>
      </div>
      <hr />
      {playlistSongs.map((song, index) => (
        <div
          onClick={() => handleClickSong(song._id)}
          key={song._id}
          className="group grid grid-cols-3 sm:grid-cols-3 pl-2 items-center text-[#fff] cursor-pointer hover:bg-[#595959] p-2"
        >
          <p className="flex items-center">
            <b className="mr-4 group-hover:hidden">{index + 1}</b>
            <button
              className="mr-4 hidden group-hover:inline"
              onClick={(e) => {
                e.stopPropagation();
                handleClickSong(song._id);
              }}
            >
              <FontAwesomeIcon
                className="cursor-pointer"
                icon={
                  playStatus && track?._id === song._id
                    ? faPause
                    : faPlay
                }
              />
            </button>
            <img className="inline w-10 h-10 mr-5" src={song.image} alt="image" />
            <span className="text-white truncate">{song.name}</span>
          </p>
          <p className="text-center">{song.album}</p>
          <p className="text-right pr-4">{formatDuration(song.duration) || '0:00'}</p>
        </div>
      ))} 
    </div>
  );
};        

export default DisplayPlaylist; 