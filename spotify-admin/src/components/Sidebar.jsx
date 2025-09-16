import React from 'react';
import { assets } from '../assets/assets';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    return (
      <div className="bg-[#003A10] min-h-screen flex flex-col items-center pt-5 w-[max(20vw,250px)]">
        <img
          src={assets.spotify}
          alt="spotify logo"
          className="w-[max(10vw,100px)] mb-8"
        />

        <NavLink
          to="/add-song"
          className="flex items-center gap-6 text-gray-800 bg-white px-6 border-black p-2 drop-shadow-[-4px_4px_#00FF5B] text-sm font-medium w-[210px] ml-auto mr-2 mb-4 cursor-pointer"
        >
          <img src={assets.songadd} className="w-5" alt="add a song" />
          <span>Add Song</span>
        </NavLink>

        <NavLink
          to="/list-songs"
          className="flex items-center gap-6 text-gray-800 bg-white px-6 border-black p-2 drop-shadow-[-4px_4px_#00FF5B] text-sm font-medium w-[210px] ml-auto mr-2 mb-4 cursor-pointer"
        >
          <img src={assets.listSongs} className="w-5" alt="add a song" />
          <span>List of Songs</span>
        </NavLink>
        <NavLink
          to="add-playlist"
          className="flex items-center gap-6 text-gray-800 bg-white px-6 border-black p-2 drop-shadow-[-4px_4px_#00FF5B] text-sm font-medium w-[210px] ml-auto mr-2 mb-4 cursor-pointer"
        >
          <img src={assets.addAlbum} className="w-5" alt="add a song" />
          <span>Add Album</span>
        </NavLink>

        <NavLink
          to="/list-playlists"
          className="flex items-center gap-6 text-gray-800 bg-white px-6 border-black p-2 drop-shadow-[-4px_4px_#00FF5B] text-sm font-medium w-[210px] ml-auto mr-2 mb-4 cursor-pointer"
        >
          <img src={assets.listAlbum} className="w-5" alt="add a song" />
          <span>List of Albums</span>
        </NavLink>

        <NavLink
          to="/list-users"
          className="flex items-center gap-6 text-gray-800 bg-white px-6 border-black p-2 drop-shadow-[-4px_4px_#00FF5B] text-sm font-medium w-[210px] ml-auto mr-2 mb-4 cursor-pointer"
        >
          <img src={assets.listAlbum} className="w-5" alt="add a song" />
          <span>List of Users</span>
        </NavLink>

      </div>
    );
};

export default Sidebar;
