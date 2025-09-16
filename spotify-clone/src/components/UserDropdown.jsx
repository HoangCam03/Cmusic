import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserDropdown = ({ onLogout, onClose }) => {
    const navigate = useNavigate();

    const handleMenuItemClick = (path) => {
        navigate(path);
        onClose(); // Close dropdown after clicking a menu item
    };

    return (
      <div className="absolute right-4 top-[64px] w-48 bg-[#282828] rounded shadow-xl z-50">
        <ul className="py-1 text-sm text-gray-100 font-bold">
          <li>
            <button
              onClick={() => handleMenuItemClick("/account")}
              className="flex justify-between items-center w-full px-4 py-2 hover:bg-[#3e3e3e] cursor-pointer"
            >
              Account
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m4-5a2 2 0 100-4m-4 4a2 2 0 110-4m-4-4H9m4 0h2m-8 0H6m4 0v4"
                ></path>
              </svg>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleMenuItemClick("/profile")}
              className="flex justify-between items-center w-full px-4 py-2 hover:bg-[#3e3e3e] cursor-pointer"
            >
              Profile
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m4-5a2 2 0 100-4m-4 4a2 2 0 110-4m-4-4H9m4 0h2m-8 0H6m4 0v4"
                ></path>
              </svg>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleMenuItemClick("/premium")}
              className="flex justify-between items-center w-full px-4 py-2 hover:bg-[#3e3e3e] cursor-pointer"
            >
              Upgrade to Premium
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m4-5a2 2 0 100-4m-4 4a2 2 0 110-4m-4-4H9m4 0h2m-8 0H6m4 0v4"
                ></path>
              </svg>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleMenuItemClick("/support")}
              className="flex justify-between items-center w-full px-4 py-2 hover:bg-[#3e3e3e] cursor-pointer"
            >
              Support
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m4-5a2 2 0 100-4m-4 4a2 2 0 110-4m-4-4H9m4 0h2m-8 0H6m4 0v4"
                ></path>
              </svg>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleMenuItemClick("/download")}
              className="flex justify-between items-center w-full px-4 py-2 hover:bg-[#3e3e3e] cursor-pointer"
            >
              Download
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m4-5a2 2 0 100-4m-4 4a2 2 0 110-4m-4-4H9m4 0h2m-8 0H6m4 0v4"
                ></path>
              </svg>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleMenuItemClick("/settings")}
              className="flex justify-between items-center w-full px-4 py-2 hover:bg-[#3e3e3e] cursor-pointer"
            >
              Settings
            </button>
          </li>
          <li className="border-t border-gray-700 my-1"></li> {/* Divider */}
          <li>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 hover:bg-[#3e3e3e] cursor-pointer"
            >
              Log out
            </button>
          </li>
        </ul>
      </div>
    );
};

export default UserDropdown; 