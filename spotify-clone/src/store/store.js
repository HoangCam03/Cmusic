import { configureStore } from '@reduxjs/toolkit';
import songReducer from './slices/songSlice';
import playlistReducer from './slices/playlistSlice';

export const store = configureStore({
  reducer: {
    songs: songReducer,
    playlists: playlistReducer,
  },
}); 