import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faPen } from '@fortawesome/free-solid-svg-icons'; // Import faPen

const EditPlaylistModal = ({ isOpen, onClose, playlist }) => {
  // State for form data (optional, depends on how you handle updates)
  const [editedPlaylist, setEditedPlaylist] = useState(playlist); // Initialize with current playlist data
  const [isImageHovered, setIsImageHovered] = useState(false); // State for image hover inside modal

  if (!isOpen) {
    return null; // Don't render if not open
  }

  const handleImageChange = (event) => {
    // TODO: Handle image file upload and update editedPlaylist state
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file in modal:", file);
      // You would typically upload the file and update the image in editedPlaylist state
      // setEditedPlaylist({ ...editedPlaylist, image: URL.createObjectURL(file) }); // Example for preview
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedPlaylist({ ...editedPlaylist, [name]: value });
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving playlist:", editedPlaylist);
    // Call an API to update the playlist, then close the modal
    onClose(); // Close modal after saving (example)
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-[#282828] text-white rounded-lg p-6 w-[500px] max-w-full">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Edit details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl focus:outline-none">&times;</button>
        </div>

        {/* Modal Content */}
        <div className="flex gap-4 mb-6">
          {/* Image Upload Area */}
          <div 
            className="relative w-[180px] h-[180px] bg-[#3e3e3e] rounded-md flex items-center justify-center cursor-pointer group"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
            onClick={() => document.getElementById('modalImageInput').click()} // Trigger hidden file input
          >
            {editedPlaylist.image ? (
              <img 
                src={editedPlaylist.image} 
                alt="Playlist cover" 
                className={`w-full h-full object-cover rounded-md transition-opacity duration-200 ${isImageHovered ? 'opacity-50' : 'opacity-100'}`}
              />
            ) : (
              <FontAwesomeIcon 
                icon={faMusic} 
                className={`text-white text-5xl transition-opacity duration-200 ${isImageHovered ? 'opacity-20' : 'opacity-50'}`}
              />
            )}

            {isImageHovered && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white rounded-md">
                 <FontAwesomeIcon icon={faPen} className="text-2xl mb-1" /> {/* FontAwesome Pen Icon */}
                 <p className="text-xs font-bold">Choose photo</p>
              </div>
            )}

             {/* Hidden File Input for Modal */}
             <input 
              type="file" 
              id="modalImageInput" 
              hidden 
              accept="image/*"
              onChange={handleImageChange}
            />

          </div>

          {/* Name and Description Inputs */}
          <div className="flex flex-col flex-grow ">
            <input 
              type="text" 
              name="name"
              value={editedPlaylist.name}
              onChange={handleInputChange}
              placeholder="My Playlist #1"
              className="bg-[#3e3e3e] h-10 w-70 text-white text-2xl font-bold rounded p-2 mb-4 focus:outline-none focus:ring-1 focus:ring-white"
            />
            <textarea 
              name="desc"
              value={editedPlaylist.desc}
              onChange={handleInputChange}
              placeholder="Add an optional description"
              className="bg-[#3e3e3e] text-gray-300 text-sm rounded p-2 h-31 resize-none focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end">
          <button 
            onClick={handleSave} 
            className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlaylistModal; 