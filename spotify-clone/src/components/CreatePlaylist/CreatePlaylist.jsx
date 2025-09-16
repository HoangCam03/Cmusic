import React, { useState, useRef, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faUserPlus, faEllipsisH, faList, faSearch, faTimes, faPlay } from '@fortawesome/free-solid-svg-icons';
import EditPlaylistModal from '../EditPlaylistModal/EditPlaylistModal';

const CreatePlaylist = () => {
  // Placeholder data - replace with actual state/props later
  const playlist = {
    name: "My New Playlist",
    desc: "Add a description",
    owner: "Logged-in User", // Replace with actual user name
    isPublic: true,
    image: null, // Placeholder for image URL or file
  };

  const containerRef = useRef(null); // Ref for the scrollable container
  const [isScrolled, setIsScrolled] = useState(false); // State to track if scrolled
  const [isImageHovered, setIsImageHovered] = useState(false); // State for image hover
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = containerRef.current.scrollTop;
        // Define two thresholds for hysteresis (adjust as needed)
        const upperThreshold = 260; // Become scrolled when exceeding this
        const lowerThreshold = 250; // Become unscrolled when falling below this

        if (scrollPosition > upperThreshold && !isScrolled) {
          setIsScrolled(true);
        } else if (scrollPosition < lowerThreshold && isScrolled) {
          setIsScrolled(false);
        }
      }
    };

    const currentContainer = containerRef.current;

    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('scroll', handleScroll, { passive: true });
      }
    };
  }, [isScrolled]); // Dependency array includes isScrolled

  const handleSearch = (e) => {
    // TODO: Implement search logic
    console.log("Searching for:", e.target.value);
  };

  const handleClearSearch = () => {
    // TODO: Implement clear search logic
    console.log("Clear search");
  };

  const handleImageChange = (event) => {
    // TODO: Handle image file upload
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file);
      // Here you would typically upload the file and update playlist.image state/data
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#121212] rounded-lg overflow-y-auto">

      {/* Sticky Header Bar - Appears on Scroll */}
      {isScrolled && (
        <div className="w-full h-[64px] bg-[#242424] flex items-center px-8 sticky top-0 z-10 transition-opacity duration-300 ease-in-out opacity-100" style={{ left: 0, right: 0 }}>
          {/* Optional: Play button and other icons */}
          <FontAwesomeIcon icon={faPlay} className="text-green-500 text-3xl mr-4 cursor-pointer" title="Play" />
          {/* Playlist Name */}
          <h2 className="text-white text-xl font-bold whitespace-nowrap overflow-hidden text-overflow-ellipsis">{playlist.name}</h2>
        </div>
      )}

      {/* Original Large Header Section - Always at the top when not scrolled */}
      <div className="w-full h-[300px] bg-gradient-to-b from-[#502630] to-[#121212] flex items-end p-8 "> 
        
        {/* Playlist Image/Icon Area */}
        {/* Position relative for overlay */}
        <div 
          className="relative w-[232px] h-[232px] flex items-center justify-center bg-[#3e3e3e] rounded-md shadow-xl mr-6 group cursor-pointer"
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
          onClick={openModal} // Open modal on click
        > 
          {/* Image or Default Icon */}
          {/* Adjust opacity on hover */}
          {playlist.image ? (
            <img 
              src={playlist.image} 
              alt={playlist.name} 
              className={`w-full h-full object-cover  rounded-md transition-opacity duration-200 ${isImageHovered ? 'opacity-50' : 'opacity-100'}`}
            />
          ) : (
            // Only render music icon if not hovered
            !isImageHovered && (
              <FontAwesomeIcon 
                icon={faMusic} 
                className="text-white text-6xl opacity-50"
              />
            )
          )}

          {/* Hover Overlay */}
          {isImageHovered && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white rounded-md">
              <img src={assets.pen} alt="Choose photo" className="w-8 h-8 mb-2" />
              <p className="text-sm font-bold">Choose photo</p>
            </div>
          )}

          {/* Hidden File Input */}
          <input 
            type="file" 
            id="imageInput" 
            hidden 
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        {/* Playlist Details */}
        <div className="flex flex-col text-white mb-4 cursor-pointer" onClick={openModal}> 
            <p className="text-sm font-bold">{playlist.isPublic ? "Public Playlist" : "Private Playlist"}</p>
            <h1 className="font-bold text-7xl">{playlist.name}</h1>
            {playlist.desc && <p className="text-sm mt-2 text-gray-300">{playlist.desc}</p>}
            <p className="text-sm mt-1">
              <span className="font-bold">{playlist.owner}</span>
              {/* Add number of songs and duration here if available */}
              {/* <span className="text-gray-300"> • X songs, Y min Z sec</span> */}
            </p>
        </div>
      </div>

      {/* Content Area Below Header */}
      {/* Add padding top to push content down when sticky header is active */}
      {/* This padding might need adjustment or be applied differently if sticky header is not absolutely positioned over content */}
      <div className="mt-8 px-8"> {/* Keep original margin/padding */}
        
        {/* Action Icons */}
        <div className="flex items-center gap-6 mb-8 text-gray-400"> 
          <FontAwesomeIcon icon={faUserPlus} className="text-2xl cursor-pointer hover:text-white" title="Add collaborators" />
          <FontAwesomeIcon icon={faEllipsisH} className="text-2xl cursor-pointer hover:text-white" title="More options" />
        </div>

        {/* Search for songs */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Let's find something for your playlist</h2>
          <div className="flex items-center bg-[#2a2a2a] rounded-md px-4 py-2 w-full max-w-md">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search for songs or episodes"
              className="bg-transparent outline-none text-white placeholder-gray-400 flex-grow"
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Song List (Placeholder) */}
        {[...Array(20)].map((_, index) => (
          <div key={index} className="text-white py-2 border-b border-gray-700">{`Song Placeholder ${index + 1}`}</div>
        ))}

      </div>

      {/* Render the Edit Playlist Modal */}
      <EditPlaylistModal isOpen={isModalOpen} onClose={closeModal} playlist={playlist} />

    </div>
  );
};

export default CreatePlaylist;