import React from 'react'


const Navbar = () => {
    return (
      <div>
        
          <div className="flex w-full items-center gap-2 sticky top-0 left-0 right-0 z-0">  
              <p className="bg-white text-black px-4 py-1 rounded-2xl cursor-pointer">All</p>
              <p className="bg-black text-white px-4 py-1 rounded-2xl cursor-pointer">Music</p>
              <p className="bg-black text-white px-4 py-1 rounded-2xl cursor-pointer">Podcast</p>
          </div>
      </div>
    );
}

export default Navbar