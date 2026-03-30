export function PlaylistItem({ playlist, onClick }: PlaylistItemProps) {
  return (
    <div onClick={onClick} className="p-4 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
      <h3 className="text-white text-lg">{playlist.name}</h3>
      {playlist.description && <p className="text-gray-400">{playlist.description}</p>}
    </div>
  );
}

interface PlaylistItem {
  _id: string;
  name: string;
  description?: string;
}

interface PlaylistItemProps {
  playlist: PlaylistItem;
  onClick?: () => void;
}
