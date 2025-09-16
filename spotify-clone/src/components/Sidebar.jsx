import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faHouse } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';
import { assets } from '../assets/assets';
import { faAdd } from '@fortawesome/free-solid-svg-icons/faAdd';
import React, { useState, useRef, useEffect } from 'react';
import LoginRequiredModal from './LoginRequiredModal';
import { useNavigate } from 'react-router-dom';


const Sidebar = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const createPlaylistButtonRef = useRef(null);
    const navigate = useNavigate();

    const handleCreatePlaylistClick = () => {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setIsModalVisible(true);
      } else {
        // TODO: Implement playlist creation logic
        // console.log('User is logged in. Proceed with playlist creation.');
        navigate('/create-playlist'); // Navigate to the create playlist page
      }
    };

    const handleCloseModal = () => {
      setIsModalVisible(false);
    };

    // Optional: Log button position if needed for debugging positioning
    // useEffect(() => {
    //   if (createPlaylistButtonRef.current) {
    //     const rect = createPlaylistButtonRef.current.getBoundingClientRect();
    //     console.log('Button position:', rect.top, rect.left);
    //   }
    // }, [isModalVisible]);

    return (
      <div className="relative w-[25%] h-full pl-2 pr-2 flex flex-col gap-2 bg-black text-white">
         
          <div className="bg-[#121212] h-full rounded p-4">
            <div className="flex items-center gap-4 pl-2  justify-between cursor-pointer mb-2">
              <div className="flex items-center gap-3">
                <img className="w-6 h-6 " src={assets.library} alt="library" />
                <p className="font-bold text-white text-base">Library</p>
              </div>
              <div className="flex items-center gap-3 ">
                <FontAwesomeIcon className="w-5" icon={faArrowRight}>
                  {" "}
                </FontAwesomeIcon>
                <FontAwesomeIcon className="w-5" icon={faAdd}></FontAwesomeIcon>
              </div>
            </div>
            <div className="p-4 bg-[#242424] m-2 rounded font-semibold flex flex-col justify-start items-start gap-1 pl-4">
              <h1>Create your first playlist</h1>
              <p className="font-light">it's easy we will help you</p>
              <button 
                ref={createPlaylistButtonRef}
                className="px-4 py-1.5 bg-white text-[15px] text-black rounded-full mt-4 cursor-pointer"
                onClick={handleCreatePlaylistClick}
                >
                Create playlist
              </button>
            </div>
            <div className="p-4 bg-[#242424] m-2 rounded font-semibold flex flex-col justify-start items-start gap-1 pl-4">
              <h1>Let's findsome podcasts to follow</h1>
              <p className="font-light">
                We will keep you update on new episodes
              </p>
              <button className="px-4 py-1.5 bg-white text-[15px] text-black rounded-full mt-4 cursor-pointer">
                Browse podcasts
              </button>
            </div>
          </div>
        
        {isModalVisible && (
          <LoginRequiredModal isVisible={isModalVisible} onClose={handleCloseModal} buttonRef={createPlaylistButtonRef} />
        )}
      </div>
    );

};

export default Sidebar;
