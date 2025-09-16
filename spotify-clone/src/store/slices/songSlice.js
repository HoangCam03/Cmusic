import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAllSongs } from '../../services/SongServices/ListSongs';

export const fetchSongs = createAsyncThunk(
  'songs/fetchSongs',
  async () => {
    const response = await getAllSongs();
    return response;
  }
);

const songSlice = createSlice({
  name: 'songs',
  initialState: {
    items: [],
    currentTrack: null,
    status: 'idle',
    error: null
  },
  reducers: {
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSongs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSongs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        if (action.payload.length > 0 && !state.currentTrack) {
          state.currentTrack = action.payload[0];
        }
      })
      .addCase(fetchSongs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setCurrentTrack } = songSlice.actions;
export default songSlice.reducer; 