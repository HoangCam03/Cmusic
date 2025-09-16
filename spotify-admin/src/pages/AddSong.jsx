import React, { useEffect, useState } from 'react';
import { assets } from '../assets/assets';
import { getAllPlaylists } from '../services/ListPlaylist';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AddSong = () => {
    const navigate = useNavigate();
    const [song, setSong] = useState(null);
    const [image, setImage] = useState(null);
    const [name, setName] = useState("");
    const [artist, setArtist] = useState("");
    const [desc, setDesc] = useState("");
    const [playlist, setPlaylist] = useState("");
    const [album, setAlbum] = useState("");
    const [loading, setLoading] = useState(false);
    const [listPlaylists, setListPlaylists] = useState([]);

    // Lấy token từ localStorage
    const getAuthToken = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            toast.error("Please login to continue");
            navigate('/login'); // Redirect to login page
            return null;
        }
        return token;
    };

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                const response = await fetch(`${import.meta.env.VITE_API_URL}/playlist/list-playlists`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        toast.error("Session expired. Please login again.");
                        navigate('/login');
                        return;
                    }
                    throw new Error('Failed to fetch playlists');
                }

                const data = await response.json();
                if (data.playlists) {
                    setListPlaylists(data.playlists);
                }
            } catch (error) {
                console.error("Error fetching playlists:", error);
                toast.error(error.message || "Failed to load playlists");
            }
        };
        fetchPlaylists();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) return;

        setLoading(true);

        const formData = new FormData();
        formData.append("image", image);
        formData.append("name", name);
        formData.append("desc", desc);
        formData.append("artist", artist);
        formData.append("playlist", playlist);
        formData.append("album", album);
        formData.append("audio", song);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/songs/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to add song');
            }

            const data = await response.json();

            if (data.message === "Upload & save successful") {
                toast.success("Song added successfully!");
                // Reset form
                setImage(null);
                setName("");
                setDesc("");
                setArtist("");
                setPlaylist("");
                setAlbum("");
                setSong(null);
            } else {
                toast.error(data.error || "Failed to add song. Please try again.");
            }
        } catch (error) {
            console.error("Error adding song:", error);
            toast.error(error.message || "Failed to add song. Please try again.");
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
        <form onSubmit={handleSubmit} className="flex flex-col items-start gap-8 text-gray-600 pb-20">
            <div className="flex gap-8">
                <div className="flex flex-col gap-4 border-2 border-dashed border-pink-500 p-4 rounded-lg shadow-md">
                    <p className="font-semibold text-gray-600">Upload Song</p>
                    <input
                        onChange={(e) => setSong(e.target.files[0])}
                        type="file"
                        id="song"
                        accept="audio/*"
                        hidden
                    />
                    <label htmlFor="song" className="cursor-pointer">
                        <img
                            src={song ? assets.doneSong : assets.uploadSong}
                            className="w-24 transition-transform hover:scale-105"
                            alt="upload song"
                        />
                    </label>
                </div>
                <div className="flex flex-col gap-4 border-2 border-dashed border-pink-500 p-4 rounded-lg shadow-md">
                    <p className="font-semibold text-gray-600">Upload Image</p>
                    <input
                        onChange={(e) => setImage(e.target.files[0])}
                        type="file"
                        id="image"
                        accept="image/*"
                        hidden
                    />
                    <label htmlFor="image" className="cursor-pointer">
                        <img
                            src={image ? URL.createObjectURL(image) : assets.uploadImage}
                            className="w-24 transition-transform hover:scale-105"
                            alt="upload image"
                        />
                    </label>
                </div>
            </div>
            <div className="flex flex-col gap-2.5">
                <p>Song Name</p>
                <input
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    type="text"
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    placeholder="Type Here"
                    required
                />
            </div>
            <div className="flex flex-col gap-2.5">
                <p>Artist</p>
                <input
                    onChange={(e) => setArtist(e.target.value)}
                    value={artist}
                    type="text"
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    placeholder="Type Here"
                    required
                />
            </div>
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
            <div className="flex flex-col gap-2.5">
                <p>Playlist</p>
                <select
                    onChange={(e) => setPlaylist(e.target.value)}
                    value={playlist}
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    required
                >
                    <option value="">-- Select a playlist --</option>
                    {listPlaylists.map((playlist) => (
                        <option key={playlist._id} value={playlist._id}>
                            {playlist.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col gap-2.5">
                <p>Album Name</p>
                <input
                    onChange={(e) => setAlbum(e.target.value)}
                    value={album}
                    type="text"
                    className="bg-transparent outline-green-600 border-2 border-gray-400 p-2.5 w-[max(40vw,250px)]"
                    placeholder="Type album name"
                    required
                />
            </div>

            <div className="flex flex-col gap-2.5">
                <button
                    type="submit"
                    className="text-base bg-black text-white py-2.5 px-14 cursor-pointer rounded-lg shadow-md hover:bg-green-600 transition-colors"
                >
                    Add Song
                </button>
            </div>
        </form>
    );
};

export default AddSong;
