import React, { useState, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import UserDropdown from './UserDropdown';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  useEffect(() => {
    // Check login status and user data from localStorage
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem('userLoggedIn');
      const userDataStr = localStorage.getItem('userData');
      setIsLoggedIn(loginStatus === 'true');
      if (userDataStr) {
        setUserData(JSON.parse(userDataStr));
      }
    };

    // Check initially
    checkLoginStatus();

    // Listen for storage events (in case login status changes in another tab)
    window.addEventListener('storage', checkLoginStatus);

    // Add event listener for clicks outside the dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && avatarRef.current && !avatarRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Chỉ xóa thông tin xác thực và user data
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    
    // Không xóa playlist data từ Redux store
    setIsLoggedIn(false);
    setUserData(null);
    navigate('/');
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handelClickHome = () => (
    navigate("/")
  )

  const handleSignUpClick = () => {
    navigate('/signup');
  };
  const handleLoginClick = () =>{
    navigate('/login')
  }

  return (
    <div className="relative">
      <div className="w-full h-[64px] flex justify-between  items-center font-semibold gap-4 ">
        <div className="flex items-center gap-4 ml-4">
          <img
            onClick={handelClickHome}
            className="w-10 bg-black p-2 rounded-2xl cursor-pointer"
            src={assets.logo}
            alt="logo"
          ></img>
        </div>

        <div className="flex items-center gap-4 bg-black p-2 rounded-full w-full max-w-[500px] ml-20">
          {/* Home Button */}
          <button
            onClick={handelClickHome}
            className="group w-[48px] h-[48px] flex items-center justify-center bg-[#121212] cursor-pointer rounded-full 
                        hover:bg-[#2a2a2a] hover:scale-105 active:scale-95 
                        transition-all duration-200 ease-in-out shadow-md hover:shadow-lg
                        focus:outline-none focus:ring-2 focus:ring-white"
          >
            <img
              src={assets.home}
              alt="home"
              className="w-8 h-8 brightness-75 group-hover:brightness-110 transition duration-200"
            />
          </button>

          {/* Search Box */}

          <div className="flex items-center flex-1 h-[48px] px-4 py-2 rounded-full cursor-text bg-[#1e1e1e] hover:ring-[1.5px] hover:ring-white group">
            <img
              src={assets.search}
              alt="search"
              className="w-6 h-6 mr-2 brightness-75 group-hover:brightness-200 transition duration-200  hover:ring-white"
            />
            <input
              type="text"
              placeholder="What do you want to play?"
              className="bg-transparent outline-none text-sm w-full text-gray-300 placeholder:text-gray-400"
            />
          </div>
        </div>



        <div className="flex items-center gap-4 mr-4">
          {/* These buttons are always visible */}
          <p className="bg-white text-black text-[15px] px-4 py-1 rounded-2xl  cursor-pointer hidden md:block">
            Explore Premium
          </p>
          <p className="bg-black text-white text-[15px] px-4 py-1 rounded-2xl  cursor-pointer hidden md:block">
            Install App
          </p>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              {/* Wrap avatar and tooltip in a relative container */}
              <div className="relative flex items-center">
                <p 
                  ref={avatarRef}
                  onClick={toggleDropdown}
                  onMouseEnter={() => setIsAvatarHovered(true)}
                  onMouseLeave={() => setIsAvatarHovered(false)}
                  className="bg-purple-600 text-black w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-300 transition-colors duration-200"
                >
                  {userData?.username ? userData.username.charAt(0).toUpperCase() : 'C'}
                </p>
                {isAvatarHovered && userData?.username && (
                  <div className="absolute top-full mt-5 left-1/2 transform -translate-x-1/2 -ml-3 bg-[#282828] text-white text-sm px-3 py-1 rounded-md shadow-lg whitespace-nowrap z-50">
                    {userData.username}
                  </div>
                )}
              </div>
            </div>
          ) : (
            
            <>
              <p className="bg-black text-white text-[15px] px-4 py-1 rounded-2xl cursor-pointer
                hover:bg-[#2a2a2a] hover:scale-105 active:scale-95 
                transition-all duration-200 ease-in-out shadow-md hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-white"
                onClick={handleSignUpClick}
                >
                SignUp
              </p>
              <p className="bg-gray-200 text-black text-[15px] px-4 py-1 rounded-2xl cursor-pointer
                hover:bg-white hover:scale-105 active:scale-95 
                transition-all duration-200 ease-in-out shadow-md hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-black"
                onClick={handleLoginClick}
                >
                Log in
              </p>
            </>
          )}
        </div>
      </div>

      {isLoggedIn && isDropdownOpen && (
        <UserDropdown onLogout={handleLogout} onClose={closeDropdown} />
      )}
    </div>
  );
};

export default Header;
