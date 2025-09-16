import React from 'react'
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'animate.css';
import { deleteSong } from '../services/DeleteService';
import { updateSong } from '../services/UpdateSongService';
import { assets } from '../assets/assets';

const ListSongs = () => {
  const [data, setData] = React.useState([]);
  const [playlists, setPlaylists] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateForm, setUpdateForm] = React.useState({
    name: '',
    artist: '',
    desc: '',
    playlist: '',
    album: '',
    image: null,
    audio: null
  });

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          toast.error("Please login to continue");
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/playlist/list-playlists`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (data.playlists) {
          const mapPlaylists = {};
          data.playlists.forEach(playlist => {
            mapPlaylists[playlist._id] = playlist.name;
          });
          setPlaylists(mapPlaylists);
        } else {
          setError("Failed to load playlists");
        }
      } catch (err) {
        console.error("Error fetching playlists:", err);
        setError("Failed to load playlists");
      }
    };
    fetchPlaylists();
  }, []);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/song/list-songs`);
        const data = await res.json();

        if (data.status === "Success") {
          setData(data.data);
        } else {
          setError("Failed to load songs");
        }
      } catch (err) {
        console.error("Error fetching songs:", err);
        setError("Failed to load songs");
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const handleDeleteSong = async (id) => {
    const result = await Swal.fire({
      title: "Xóa Bài Hát?",
      text: "Bạn có chắc muốn xóa bài hát này? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,

      // Spotify-like dark style
      background: "#191414",
      color: "#fff",
      iconColor: "#1DB954",
      confirmButtonColor: "#1DB954",
      cancelButtonColor: "#535353",

      customClass: {
        popup: "rounded-lg",
        title: "text-lg font-semibold",
        confirmButton: "px-4 py-2",
        cancelButton: "px-4 py-2",
      },

      showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
      }
    });

    if (!result.isConfirmed) return;
    try {
      const res = await deleteSong(id);
      console.log("Delete response:", res);

      if (res.status === "Success") {
        toast.success("Song deleted successfully!");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/song/list-songs`);
        const newData = await res.json();

        if (newData.status === "Success") {
          setData(newData.data);
        }
      } else {
        toast.error("Song Delete failed!");
      }

    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return "00:00";
    const [min, sec] = duration.split(':').map(Number);
    const formattedMin = String(min).padStart(2, '0');
    const formattedSec = String(Math.floor(sec)).padStart(2, '0');
    return `${formattedMin}:${formattedSec}`;
  };

  const handleUpdateClick = (song) => {
    setSelectedSong(song);
    setUpdateForm({
      name: song.name,
      artist: song.artist,
      desc: song.desc,
      playlist: song.playlist,
      album: song.album,
      image: null,
      audio: null
    });
    setShowModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Chỉ gửi các trường đã thay đổi
      const changedFields = {};
      Object.keys(updateForm).forEach(key => {
        if (key === 'image' || key === 'audio') {
          if (updateForm[key]) {
            changedFields[key] = updateForm[key];
          }
        } else if (updateForm[key] !== selectedSong[key]) {
          changedFields[key] = updateForm[key];
        }
      });

      // Nếu không có gì thay đổi thì return
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        setShowModal(false);
        return;
      }

      const res = await updateSong(selectedSong._id, changedFields);
      
      if (res.status === "Success" || res.message === "Song updated successfully") {
        toast.success("Song updated successfully!");
        setShowModal(false);
        
        // Update the song in the local state
        setData(prevData => prevData.map(song => 
          song._id === selectedSong._id 
            ? { 
                ...song,
                ...changedFields,
                // Chỉ update image nếu có upload mới
                image: changedFields.image ? URL.createObjectURL(changedFields.image) : song.image
              }
            : song
        ));
      } else {
        toast.error("Failed to update song!");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred while updating the song.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Thêm hàm để kiểm tra xem form có thay đổi không
  const hasFormChanged = () => {
    return Object.keys(updateForm).some(key => {
      if (key === 'image' || key === 'audio') {
        return updateForm[key] !== null;
      }
      return updateForm[key] !== selectedSong[key];
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div>
      <p>All Songs List</p>
      <br />
      <div className="sm:grid hidden grid-cols-[0.5fr_1fr_1.9fr_0.7fr_1fr_1fr_0.6fr_0.3fr] items-center gap-2 p-4 border-gray-300 text-sm mr-5 bg-gray-100">
        <b>Image</b>
        <b>Name</b>
        <p className="font-bold">Description</p>
        <b>Artist</b>
        <b>Playlist</b>
        <b>Album</b>
        <b>Duration</b>
        <b>Action</b>
      </div>
      {data.map((items, index) => {
        return (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[0.5fr_1fr_2fr_0.7fr_1fr_1fr_0.6fr_0.2fr] items-center gap-2.5 p-3 border border-gray-300 text-sm mr-5 justify-center"
          >
            <img
              src={items.image}
              alt="Song"
              className="w-12 flex justify-center items-center"
            />
            <p>{items.name}</p>
            <p>{items.desc}</p>
            <p>{items.artist}</p>
            <p>{playlists[items.playlist] || "Unknown Playlist"}</p>
            <p>{items.album || "Unknown Album"}</p>
            <p>{formatDuration(items.duration)}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleUpdateClick(items)} 
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Edit
              </button>
              <p onClick={() => handleDeleteSong(items._id)} className="text-red-600 hover:underline cursor-pointer">X</p>
            </div>
          </div>
        );
      })}

      {/* Update Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl my-auto">
            <h2 className="text-2xl font-bold mb-4">Update Song</h2>
            {isUpdating ? (
              <div className='grid place-items-center min-h-[40vh]'>
                <div className='w-16 h-16 place-self-center border-4 border-gray-400 border-t-green-800 rounded-full animate-spin'>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateSubmit} className="flex flex-col items-start gap-8 text-gray-600">
                <div className="flex gap-8">
                  <div className="flex flex-col gap-4 border-2 border-dashed border-pink-500 p-4 rounded-lg shadow-md">
                    <p className="font-semibold text-gray-600">Upload Song</p>
                    <input
                      onChange={(e) => setUpdateForm({...updateForm, audio: e.target.files[0]})}
                      type="file"
                      id="audio"
                      accept="audio/*"
                      hidden
                    />
                    <label htmlFor="audio" className="cursor-pointer">
                      <img
                        src={updateForm.audio ? assets.doneSong : assets.uploadSong}
                        className="w-24 transition-transform hover:scale-105"
                        alt="upload song"
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-4 border-2 border-dashed border-pink-500 p-4 rounded-lg shadow-md">
                    <p className="font-semibold text-gray-600">Upload Image</p>
                    <input
                      onChange={(e) => setUpdateForm({...updateForm, image: e.target.files[0]})}
                      type="file"
                      id="image"
                      accept="image/*"
                      hidden
                    />
                    <label htmlFor="image" className="cursor-pointer">
                      <img
                        src={updateForm.image ? URL.createObjectURL(updateForm.image) : selectedSong?.image || assets.uploadImage}
                        className="w-24 transition-transform hover:scale-105"
                        alt="upload image"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <p>Song Name</p>
                  <input
                    type="text"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm({...updateForm, name: e.target.value})}
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    placeholder="Type Here"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <p>Artist</p>
                  <input
                    type="text"
                    value={updateForm.artist}
                    onChange={(e) => setUpdateForm({...updateForm, artist: e.target.value})}
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    placeholder="Type Here"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <p>Description</p>
                  <input
                    type="text"
                    value={updateForm.desc}
                    onChange={(e) => setUpdateForm({...updateForm, desc: e.target.value})}
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    placeholder="Type Here"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <p>Playlist</p>
                  <select
                    value={updateForm.playlist}
                    onChange={(e) => setUpdateForm({...updateForm, playlist: e.target.value})}
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    required
                  >
                    <option value="">-- Select a playlist --</option>
                    {Object.entries(playlists).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2.5">
                  <p>Album Name</p>
                  <input
                    type="text"
                    value={updateForm.album}
                    onChange={(e) => setUpdateForm({...updateForm, album: e.target.value})}
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    placeholder="Type album name"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-base bg-gray-500 text-white py-2.5 px-14 cursor-pointer rounded-lg shadow-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!hasFormChanged()}
                    className={`text-base text-white py-2.5 px-14 cursor-pointer rounded-lg shadow-md transition-colors ${
                      hasFormChanged() 
                        ? 'bg-black hover:bg-green-600' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update Song'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListSongs