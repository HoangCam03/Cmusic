import api from '../api';

export interface SearchResults {
  tracks: any[];
  artists: any[];
  albums: any[];
  playlists: any[];
}

export const searchAll = async (query: string, limit: number = 10): Promise<SearchResults> => {
  if (!query.trim()) {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  }
  const response = await api.get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (response.data?.success) {
    return response.data.data;
  }
  return { tracks: [], artists: [], albums: [], playlists: [] };
};

export const searchSuggest = async (query: string): Promise<SearchResults> => {
  if (!query.trim()) {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  }
  const response = await api.get(`/search/suggest?q=${encodeURIComponent(query)}`);
  if (response.data?.success) {
    return response.data.data;
  }
  return { tracks: [], artists: [], albums: [], playlists: [] };
};
