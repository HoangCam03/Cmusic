import { useNavigate } from "react-router-dom";

function splitDesc(desc, maxLen = 50) {
  if (!desc) return "";
  // Tách desc thành các dòng, mỗi dòng tối đa maxLen ký tự
  let result = [];
  for (let i = 0; i < desc.length; i += maxLen) {
    result.push(desc.slice(i, i + maxLen));
  }
  return result.join('\n');
}

const PlaylistItem = ({images, name, desc, id}) => {
  const navigate = useNavigate();
  const handelClickCard = () => {
    navigate(`/playlist/${id}`);
  }
 
  return (
    <div> 
    <div
      onClick={handelClickCard}
      className="w-[200px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26] flex flex-col items-center "
    >
      
        <img
          className="w-[180px] h-[180px] mb-4 object-cover rounded-lg overflow-hidden flex bg-gray-800 "
          src={images}
          alt={name}
        />
    
      
      <p className="text-slate-300 text-sm whitespace-pre-line line-clamp-2 max-w-[160px]">
        {splitDesc(desc, 50)}
      </p>
    </div>
    </div>
  );
}

export default PlaylistItem