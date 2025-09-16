import React, { useEffect } from 'react'
import Navbar from './Navbar'
import PlaylistItem from './PlaylistItem';
import SongData from './SongData';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPlaylists } from '../store/slices/playlistSlice';

const DisplayHome = () => {
    const dispatch = useDispatch();
    const { items: playlists, status: playlistsStatus, error: playlistsError } = useSelector((state) => state.playlists);
    const { items: songs = [], status: songsStatus } = useSelector((state) => state.songs);
    
    const playlistArray = playlists.data || [];
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';

    useEffect(() => {
        console.log('Current playlists state:', {
            status: playlistsStatus,
            data: playlistArray,
            error: playlistsError,
            isLoggedIn
        });

        // Luôn fetch playlist khi component mount hoặc khi status là idle
        if (playlistsStatus === 'idle') {
            console.log('Fetching playlists...');
            dispatch(fetchPlaylists());
        }
    }, [playlistsStatus, dispatch, playlistArray, playlistsError, isLoggedIn]);

    // Xử lý trạng thái loading
    if (songsStatus === 'loading' || playlistsStatus === 'loading') {
        return (
            <div className="text-white p-4 flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    // Xử lý trạng thái lỗi
    if (songsStatus === 'failed' || playlistsStatus === 'failed') {
        return (
            <div className="text-white p-4 text-center">
                <p className="text-red-500">Error: {playlistsError || 'Something went wrong'}</p>
                <button 
                    onClick={() => dispatch(fetchPlaylists())}
                    className="mt-4 px-4 py-2 bg-green-500 rounded hover:bg-green-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Lọc playlist để hiển thị
    const systemPlaylists = playlistArray.filter(playlist => playlist.type === 'system');
    const personalPlaylists = isLoggedIn ? playlistArray.filter(playlist => playlist.type === 'personal') : [];

    // Kiểm tra dữ liệu trống
    if (!songs?.length && !systemPlaylists?.length && !personalPlaylists?.length) {
        return (
            <div className="text-white p-4 text-center">
                <p>No content available.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#121212] min-h-screen">
            <div className="flex items-center w-full sticky top-0 z-10 px-6 py-4 bg-[#121212]">
                <Navbar />
            </div>
            
            {systemPlaylists?.length > 0 && (
                <div className="px-6 mb-8">
                    <h1 className="my-5 font-bold text-2xl text-white">Featured Charts</h1>
                    <div className="flex overflow-x-auto gap-4 pb-4">
                        {systemPlaylists.map((item) => (
                            <PlaylistItem
                                key={item._id}
                                images={item.image}
                                name={item.name}
                                desc={item.desc}
                                id={item._id}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isLoggedIn && personalPlaylists?.length > 0 && (
                <div className="px-6 mb-8">
                    <h1 className="my-5 font-bold text-2xl text-white">Your Playlists</h1>
                    <div className="flex overflow-x-auto gap-4 pb-4">
                        {personalPlaylists.map((item) => (
                            <PlaylistItem
                                key={item._id}
                                images={item.image}
                                name={item.name}
                                desc={item.desc}
                                id={item._id}
                            />
                        ))}
                    </div>
                </div>
            )}

            {songs?.length > 0 && (
                <div className="px-6 mb-8">
                    <h1 className="my-5 font-bold text-2xl text-white">Today's biggest hits</h1>
                    <div className="flex overflow-x-auto gap-4 pb-4">
                        {songs.map((item) => (
                            <SongData
                                key={item._id}
                                images={item.image}
                                name={item.name}
                                desc={item.desc}
                                id={item._id}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DisplayHome;