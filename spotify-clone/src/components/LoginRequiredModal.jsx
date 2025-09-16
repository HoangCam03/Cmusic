import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginRequiredModal = ({ isVisible, onClose, buttonRef }) => {
  const navigate = useNavigate();
  const [modalStyle, setModalStyle] = useState({});

  useEffect(() => {
    if (isVisible && buttonRef && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();

      // Approximate modal dimensions (can be refined with dynamic measurement if needed)
      const modalWidth = 280; 
      const modalHeight = 140; 

      // Calculate target position for the bubble pointer tip relative to the viewport
      // Aim for the bubble tip to be slightly to the right of the button's right edge and vertically centered on the button.
      const targetBubbleTipX = buttonRect.right + 5; // 5px margin to the right of the button
      const targetBubbleTipY = buttonRect.top + buttonRect.height / 2;

      // Bubble pointer is located at (left: -10px, top: 10px) relative to modal's top-left corner.
      // We need to find modalStyle.left and modalStyle.top such that:
      // modalStyle.left + (-10) = targetBubbleTipX  => modalStyle.left = targetBubbleTipX + 10
      // modalStyle.top + 10 = targetBubbleTipY      => modalStyle.top = targetBubbleTipY - 10
      let finalLeft = targetBubbleTipX + 200;
      let finalTop = targetBubbleTipY - 50;

      // Basic boundary checks to prevent modal going off-screen
       const viewportWidth = window.innerWidth;
       const viewportHeight = window.innerHeight;

       if (finalLeft + modalWidth > viewportWidth - 20) { 
         finalLeft = viewportWidth - modalWidth - 20;
       }
       if (finalLeft < 20) { 
           finalLeft = 20;
       }
       if (finalTop + modalHeight > viewportHeight - 20) { 
           finalTop = viewportHeight - modalHeight - 20;
       }
        if (finalTop < 20) { 
            finalTop = 20;
        }

      setModalStyle({
        position: 'fixed', 
        top: `${finalTop}px`,
        left: `${finalLeft}px`,
        zIndex: 50,
        width: `${modalWidth}px`, 
      });
    }
  }, [isVisible, buttonRef]);

  const handleLoginClick = () => {
    onClose();
    navigate('/login');
  };

  if (!isVisible) return null;

   // Calculate bubble position relative to the modal's left edge
   // We want the bubble to be positioned such that its tip is near the button.
   // The bubble base is at left: -10px.
   // Its vertical position (`top`) should be calculated to point towards the button.
   let bubbleTop = '10px'; // Default top position for the bubble
   if (buttonRef && buttonRef.current && modalStyle.top) {
     const buttonRect = buttonRef.current.getBoundingClientRect();
     // Calculate the vertical center of the button relative to the viewport's top edge.
     const buttonCenterY = buttonRect.top + buttonRect.height / 2;
     // Calculate the vertical position within the modal where the bubble should be,
     // so that it aligns with the button's center vertically.
     // modalStyle.top is the modal's top edge relative to the viewport.
     // The bubble's top position inside the modal should be buttonCenterY - parseFloat(modalStyle.top) - half of bubble height (8px)
     const calculatedBubbleTop = buttonCenterY - parseFloat(modalStyle.top) - 8;
     bubbleTop = `${calculatedBubbleTop}px`;
   }


  return (
    <div
      className="bg-[#69bfff] text-black rounded-lg p-4 text-sm shadow-lg transition-opacit duration-300"
      style={{ ...modalStyle, opacity: isVisible ? 1 : 0 }}
    >
      {/* Bubble pointer - points left */}
      <div
        className="absolute w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-[#69bfff]"
        style={{
          top: bubbleTop, // Position vertically based on calculation
          left: "-10px", // Position to the left, outside the modal
        }}
      ></div>

      <h2 className="font-bold mb-2">Create a playlist</h2>
      <p className="mb-4">Log in to create and share playlists.</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-3 py-1 border border-white text-[13px] rounded-full text-white font-semibold hover:scale-105 transition-transform duration-200 cursor-pointer"
        >
          Not now
        </button>
        <button
          onClick={handleLoginClick}
          className="px-4 py-1 bg-white text-black text-[13px] rounded-full font-semibold hover:scale-105 transition-transform duration-200 cursor-pointer"
        >
          Log in
        </button>
      </div>
    </div>
  );
};

export default LoginRequiredModal; 