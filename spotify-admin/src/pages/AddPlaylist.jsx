import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AddPlaylist = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [bgcolor, setBgcolor] = useState("#000000");
  const [loading, setLoading] = useState(false);

  const getAuthToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error("Please login to continue");
      navigate('/login');
      return null;
    }
    return token;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("name", name);
    formData.append("desc", desc);
    formData.append("bgcolor", bgcolor);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/playlist/add-playlist`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please login again.");
          navigate('/login');
          return;
        }
        throw new Error(data.error || data.message || "Failed to add playlist");
      }

      if (data.playlist) {
        toast.success("Playlist added successfully!");
        // Reset form
        setImage(false);
        setName("");
        setDesc("");
        setBgcolor("#000000");
        // Có thể thêm navigate về trang danh sách playlist nếu muốn
        // navigate('/playlists');
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error adding playlist:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <div className='grid place-items-center min-h-[80vh]'>
      <div className='w-16 h-16 place-self-center border-4 border-gray-400 border-t-green-800 rounded-full animate-spin'>
      </div>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="flex flex-col items-start gap-8 text-gray-600">
      {/* Image */}
      <div className="flex flex-col gap-4 border-2 border-dashed border-pink-500 p-4 rounded-lg shadow-md">
        <p>Upload Image</p>
        <input
          onChange={(e) => setImage(e.target.files[0])}
          type="file"
          id="image"
          accept="image/*"
          hidden
          required
        />
        <label htmlFor="image" className="cursor-pointer">
          <img
            src={image ? URL.createObjectURL(image) : assets.uploadImage}
            className="w-24 transition-transform hover:scale-105"
            alt="upload image"
          />
        </label>
      </div>
      {/* Name */}
      <div className="flex flex-col gap-2.5">
        <p>Playlist Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          type="text"
          className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
          placeholder="Type Here"
          required
        />
      </div>
      {/* Description */}
      <div className="flex flex-col gap-2.5">
        <p>Description</p>
        <input
          onChange={(e) => setDesc(e.target.value)}
          value={desc}
          type="text"
          className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
          placeholder="Type Here"
          required
        />
      </div>
      <div className="flex flex-col gap-3">
        <p className="">Background Color</p>
        <input
          onChange={(e) => setBgcolor(e.target.value)}
          value={bgcolor}
          type="color"
          required
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          type="submit"
          disabled={loading}
          className="text-base bg-black text-white py-2.5 px-14 cursor-pointer rounded-lg shadow-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Playlist'}
        </button>
      </div>
    </form>
  );
};

export default AddPlaylist; 