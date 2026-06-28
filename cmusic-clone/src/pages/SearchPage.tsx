import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { searchAll, SearchResults } from "../services/SearchService/SearchService";

import { SongCard } from "../components/SongCard";
import { AlbumCard } from "../components/AlbumCard";
import { PlaylistCard } from "../components/PlaylistCard";
import { ArtistCard } from "../components/ArtistCard";

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [searchTerm, setSearchTerm] = useState(query);
  const [debouncedTerm, setDebouncedTerm] = useState(query);
  
  const [results, setResults] = useState<SearchResults>({ tracks: [], artists: [], albums: [], playlists: [] });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup");
    }
  }, [navigate]);

  // Sync state if URL changes externally
  useEffect(() => {
    if (query !== searchTerm) {
      setSearchTerm(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      if (searchTerm) {
        setSearchParams({ q: searchTerm });
      } else {
        setSearchParams({});
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, setSearchParams]);

  // Fetch results when debounced term changes
  useEffect(() => {
    if (debouncedTerm.trim()) {
      setLoading(true);
      searchAll(debouncedTerm)
        .then(data => {
          setResults(data);
        })
        .catch(err => {
          console.error("Search failed:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setResults({ tracks: [], artists: [], albums: [], playlists: [] });
    }
  }, [debouncedTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const hasResults = 
    results.tracks.length > 0 || 
    results.artists.length > 0 || 
    results.albums.length > 0 || 
    results.playlists.length > 0;

  return (
    <div className="flex-1 bg-transparent p-8 md:px-12 pb-32">
      {/* Search Header */}
      <div className="max-w-4xl mb-12">
        <h1 className="text-white text-4xl font-black mb-6 tracking-tight">
          Tìm kiếm
        </h1>
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin className="text-purple-400 transition-colors" />
            ) : (
              <FontAwesomeIcon icon={faSearch} className="text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
            )}
          </div>
          <input 
            type="text" 
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Bài hát, nghệ sĩ, hoặc podcast..." 
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] border border-transparent text-white text-base rounded-full py-4 pl-14 pr-12 focus:outline-none focus:ring-2 focus:ring-white focus:bg-[#242424] transition-all placeholder:text-zinc-400 font-medium"
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-white transition-colors p-2"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg" />
            </button>
          )}
        </div>
      </div>

      {/* Results Content */}
      <div className="space-y-12">
        {debouncedTerm && !loading && !hasResults ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
             <p className="text-white text-xl font-bold mb-2">Không tìm thấy kết quả cho "{debouncedTerm}"</p>
             <p className="text-zinc-500 text-sm">Vui lòng kiểm tra lại chính tả hoặc thử các từ khóa khác.</p>
          </div>
        ) : null}

        {/* Categories / Default Browse (When empty) */}
        {!debouncedTerm && (
          <section>
             <h3 className="text-white text-2xl font-bold mb-6 tracking-tight">Duyệt tìm tất cả</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[
                  { name: "V-Pop", bg: "bg-pink-600" },
                  { name: "K-Pop", bg: "bg-purple-700" },
                  { name: "US-UK", bg: "bg-blue-600" },
                  { name: "Lo-Fi", bg: "bg-orange-600" },
                  { name: "Hip-Hop", bg: "bg-rose-600" },
                  { name: "Chill", bg: "bg-indigo-600" }
                ].map(cat => (
                  <div 
                    key={cat.name} 
                    onClick={() => {
                      setSearchTerm(cat.name);
                    }}
                    className={`${cat.bg} aspect-square rounded-xl p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group`}
                  >
                     <span className="text-white font-black text-2xl tracking-tighter">{cat.name}</span>
                     <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-black/20 rotate-[25deg] rounded-lg shadow-2xl" />
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Tracks Section */}
        {results.tracks.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-6">Bài hát</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.tracks.map((track: any) => (
                <SongCard key={track._id} song={track} />
              ))}
            </div>
          </section>
        )}

        {/* Artists Section */}
        {results.artists.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-6">Nghệ sĩ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.artists.map((artist: any) => (
                <ArtistCard key={artist._id} artist={artist} />
              ))}
            </div>
          </section>
        )}

        {/* Albums Section */}
        {results.albums.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-6">Album</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.albums.map((album: any) => (
                <AlbumCard key={album._id} album={album} />
              ))}
            </div>
          </section>
        )}

        {/* Playlists Section */}
        {results.playlists.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-6">Playlist</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.playlists.map((playlist: any) => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
