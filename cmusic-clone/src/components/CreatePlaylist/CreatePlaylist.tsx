import { useState } from "react";

interface CreatePlaylistProps {
  onClose?: () => void;
}

export function CreatePlaylist({ onClose }: CreatePlaylistProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log("Tạo playlist:", name);
    setName("");
    onClose?.();
  };

  return (
    <div className="p-4 bg-gray-900 rounded text-white">
      <h2 className="text-2xl mb-4">Tạo Playlist Mới</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên playlist"
          className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
          required
        />
        <button type="submit" className="w-full bg-green-500 p-2 rounded hover:bg-green-600">
          Tạo
        </button>
      </form>
    </div>
  );
}
