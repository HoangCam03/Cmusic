import React, { useContext } from 'react'
import { assets} from '../assets/assets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackwardStep, faForwardStep, faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import { faSquareCaretRight } from "@fortawesome/free-regular-svg-icons";
import { PlayerContext } from '../context/PlayerContext';

const Player = () => {
  const { seekBg, seekBar, playStatus, play, pause, track, time, next, previous, seekSong } = useContext(PlayerContext);

  const handleClickNext = () => next();
  const handleClickPrevious = () => previous();

  if (!track) {
    return (
      <div className="h-[10%] bg-black flex justify-between items-center text-white px-4">
        <div className="hidden lg:flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-800 rounded"></div>
          <div>
            <p>No track selected</p>
            <p>Select a track to play</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 m-auto">
          <div className="flex gap-4">
            <FontAwesomeIcon
              className="cursor-not-allowed opacity-50"
              icon={faBackwardStep}
            />
            <FontAwesomeIcon
              className="cursor-not-allowed opacity-50"
              icon={faPlay}
            />
            <FontAwesomeIcon
              className="cursor-not-allowed opacity-50"
              icon={faForwardStep}
            />
          </div>
          <div className="flex items-center gap-5">
            <p>0:00</p>
            <div
              ref={seekBg}
              className="w-[60vw] max-w-[500px] bg-gray-300 rounded-full"
            >
              <hr            
                ref={seekBar}
                className="h-1 border-none w-0 bg-green-800 rounder-full"
              />
            </div>
            <p>0:00</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 opacity-75">
          <FontAwesomeIcon
            className="cursor-pointer"
            icon={faSquareCaretRight}
          />
          <img
            className="w-4 cursor-pointer"
            src={assets.microphone}
            alt="music"
          />
          <img className="w-4 cursor-pointer" src={assets.queue} alt="music" />
          <img
            className="w-4 cursor-pointer"
            src={assets.headphone}
            alt="music"
          />
          <img
            className="w-4 cursor-pointer"
            src={assets.volume}
            alt="music"
          />
          <div className="w-20 bg-slate-50 h-1 rounded"></div>
          <img
            className="w-4 cursor-pointer"
            src={assets.miniplayer}
            alt="miniplayer"
          />
          <img className="w-4 cursor-pointer" src={assets.zoom} alt="zoom" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[10%] bg-black flex justify-between items-center text-white px-4">
      <div className="hidden lg:flex items-center gap-4">
        <img className="w-12" src={track.image} alt="song1" />
        <div>
          <p>{track.name}</p>
          <p>{track.artist}</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-1 m-auto">
        <div className="flex gap-4">
          <FontAwesomeIcon
            onClick={handleClickPrevious}
            className="cursor-pointer"
            icon={faBackwardStep}
          />

          {playStatus ? (
            <FontAwesomeIcon
              onClick={pause}
              className="cursor-pointer"
              icon={faPause}
            />
          ) : (
            <FontAwesomeIcon
              onClick={play}
              className="cursor-pointer"
              icon={faPlay}
            />
          )}
          <FontAwesomeIcon
            onClick={handleClickNext}
            className="cursor-pointer"
            icon={faForwardStep}
          />
        </div>
        <div className="flex items-center gap-5">
          <p>
            {time.currentTime.minute}:{time.currentTime.second}
          </p>
          <div
            onClick={(e) => seekSong(e)}   
            ref={seekBg}
            className="w-[60vw] max-w-[500px] bg-gray-300 rounded-full cursor-pointer"
          >
            <hr            
              ref={seekBar}
              className="h-1 border-none w-0 bg-green-800 rounder-full"
            />
          </div>
          <p>
            {time.totalTime.minute}:{time.totalTime.second}
          </p>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-2 opacity-75">
        <FontAwesomeIcon
          className="cursor-pointer"
          icon={faSquareCaretRight}
        />
        <img
          className="w-4 cursor-pointer"
          src={assets.microphone}
          alt="music"
        />
        <img className="w-4 cursor-pointer" src={assets.queue} alt="music" />
        <img
          className="w-4 cursor-pointer"
          src={assets.headphone}
          alt="music"
        />
        <img
          className="w-4 cursor-pointer"
          src={assets.volume}
          alt="music"
        />
        <div className="w-20 bg-slate-50 h-1 rounded"></div>
        <img
          className="w-4 cursor-pointer"
          src={assets.miniplayer}
          alt="miniplayer"
        />
        <img className="w-4 cursor-pointer" src={assets.zoom} alt="zoom" />
      </div>
    </div>
  );
}

export default Player