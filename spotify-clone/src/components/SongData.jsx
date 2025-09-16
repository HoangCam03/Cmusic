import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";


const SongData = ({images, name, desc, id}) => {
  // const navigate = useNavigate();
  // const handleSongClick = () => {
  //   navigate(`/songs/${id}`);
  // };

  // Removed splitDesc function as it's not suitable for truncating names

  const {playWithId} = useContext(PlayerContext);
  const handleSongClick = () =>(
    playWithId(id)
  )

  return (
    <div
      onClick={handleSongClick}
      className="min-w-[180px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26]"
    >
      <img className="rounded w-[180px] h-[180px] object-cover" src={images} alt="" />
      {/* Applied truncate and max-width for song name */}
      <p className="font-bold mt-2 mb-1 truncate max-w-[160px]"> {name}</p>
      <p className="text-slate-200 text-sm truncate max-w-[160px]">{desc}</p>
    </div>
  );
}

export default SongData