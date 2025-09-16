import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'animate.css';
import { updatePlaylist } from '../services/UpdatePlaylistService';

const ListPlaylists = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    name: '',
    desc: '',
    bgcolor: '',
    image: null,
  });

  // Lấy token từ localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error("Please login to continue");
      return null;
    }
    return token;
  };

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setError("Authentication required");
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/playlist/list-playlists`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Session expired. Please login again.");
            // Có thể thêm logic redirect về trang login ở đây
            return;
          }
          throw new Error('Failed to fetch playlists');
        }

        const data = await res.json();
        if (data.playlists) {
          setData(data.playlists);
        } else {
          setError("Failed to load playlists");
        }
      } catch (err) {
        console.error("Error fetching playlists:", err);
        setError(err.message || "Failed to load playlists");
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  const handleDeletePlaylist = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    const result = await Swal.fire({
      title: "Xóa Playlist?",
      text: "Bạn có chắc muốn xóa playlist này? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/playlist/delete-playlist/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please login again.");
          return;
        }
        throw new Error('Failed to delete playlist');
      }

      const data = await response.json();
      if (data.status === "Success") {
        toast.success("Playlist deleted successfully!");
        setData(prevData => prevData.filter(playlist => playlist._id !== id));
      } else {
        toast.error(data.error || "Failed to delete playlist!");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  const handleUpdateClick = (playlist) => {
    setSelectedPlaylist(playlist);
    setUpdateForm({
      name: playlist.name,
      desc: playlist.desc,
      bgcolor: playlist.bgcolor,
      image: null,
    });
    setShowModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    setIsUpdating(true);
    try {
      const changedFields = {};
      Object.keys(updateForm).forEach(key => {
        if (key === 'image') {
          if (updateForm[key]) {
            changedFields[key] = updateForm[key];
          }
        } else if (updateForm[key] !== selectedPlaylist[key]) {
          changedFields[key] = updateForm[key];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        setShowModal(false);
        return;
      }

      const formData = new FormData();
      Object.keys(changedFields).forEach(key => {
        if (key === 'image' && changedFields[key]) {
          formData.append('image', changedFields[key]);
        } else {
          formData.append(key, changedFields[key]);
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/playlist/update-playlist/${selectedPlaylist._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please login again.");
          return;
        }
        throw new Error('Failed to update playlist');
      }

      const res = await response.json();
      
      if (res.message === "Playlist updated successfully") {
        toast.success("Playlist updated successfully!");
        setShowModal(false);
        
        setData(prevData => prevData.map(playlist => 
          playlist._id === selectedPlaylist._id 
            ? { 
                ...playlist,
                ...changedFields,
                image: changedFields.image ? URL.createObjectURL(changedFields.image) : playlist.image
              }
            : playlist
        ));
      } else {
        toast.error(res.error || "Failed to update playlist!");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "An error occurred while updating the playlist.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Thêm hàm để kiểm tra xem form có thay đổi không
  const hasFormChanged = () => {
    return Object.keys(updateForm).some(key => {
      if (key === 'image') {
        return updateForm[key] !== null;
      }
      return updateForm[key] !== selectedPlaylist[key];
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
      <p>All Playlists</p>
      <br />
      <div className="sm:grid hidden grid-cols-[0.5fr_1fr_1.9fr_0.7fr_0.3fr] items-center gap-2 p-4 border-gray-300 text-sm mr-5 bg-gray-100">
        <b>Image</b>
        <b>Name</b>
        <p className="font-bold">Description</p>
        <b>Background Color</b>
        <b>Action</b>
      </div>
      {data.map((playlist, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[0.5fr_1fr_2fr_0.5fr_0.2fr_0.1fr] items-center gap-2.5 p-3 border border-gray-300 text-sm mr-5 justify-center"
        >
          <img
            src={playlist.image}
            alt="Playlist"
            className="w-12 flex justify-center items-center"
          />
          <p>{playlist.name}</p>
          <p>{playlist.desc}</p>
          <div 
            className="w-8 h-8 rounded-full" 
            style={{ backgroundColor: playlist.bgcolor }}
          />
          <div className="flex justify-between items-center w-full">
            <button 
              onClick={() => handleUpdateClick(playlist)} 
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Edit
            </button>
            <p 
              onClick={() => handleDeletePlaylist(playlist._id)} 
              className="text-red-600 hover:underline cursor-pointer "
            >
              X
            </p>
          </div>
        </div>
      ))}

      {/* Update Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl my-auto">
            <h2 className="text-2xl font-bold mb-4">Update Playlist</h2>
            {isUpdating ? (
              <div className='grid place-items-center min-h-[40vh]'>
                <div className='w-16 h-16 place-self-center border-4 border-gray-400 border-t-green-800 rounded-full animate-spin'>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateSubmit} className="flex flex-col items-start gap-8 text-gray-600">
                <div className="flex gap-8">
                  
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
                        src={updateForm.image ? URL.createObjectURL(updateForm.image) : selectedPlaylist?.image || assets.uploadImage}
                        className="w-24 transition-transform hover:scale-105"
                        alt="upload image"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <p>Playlist Name</p>
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
                  <p>Background Color</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={updateForm.bgcolor}
                      onChange={(e) => setUpdateForm({...updateForm, bgcolor: e.target.value})}
                      className="w-12 h-12 p-1 border-2 border-gray-400 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={updateForm.bgcolor}
                      onChange={(e) => setUpdateForm({...updateForm, bgcolor: e.target.value})}
                      className="bg-transparent  outline-green-600 border-2 border-gray-400 p-2.5 w-[max(35.9vw,200px)]"
                      placeholder="Enter hex color code"
                      required
                    />
                  </div>
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
                      'Update Playlist'
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
};

export default ListPlaylists;