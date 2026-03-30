import { useState } from "react";

interface Playlist {
  _id: string;
  name: string;
}

interface EditPlaylistModalProps {
  playlist?: Playlist;
  onClose?: () => void;
  onSave?: (name: string) => void;
}

export function EditPlaylistModal({ playlist, onClose, onSave }: EditPlaylistModalProps) {
  const [name, setName] = useState(playlist?.name || "");

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSave?.(name);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="p-6 bg-gray-900 rounded text-white w-96">
        <h2 className="text-2xl mb-4">Chỉnh Sửa Playlist</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-green-500 p-2 rounded hover:bg-green-600">
              Lưu
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-600 p-2 rounded hover:bg-gray-700">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
