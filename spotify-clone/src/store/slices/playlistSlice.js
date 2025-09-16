import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAllPlaylists } from '../../services/PlaylistServices/ListPlaylists';

// Async thunk để fetch playlists
export const fetchPlaylists = createAsyncThunk(
  'playlists/fetchPlaylists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllPlaylists();
      console.log("Redux fetchPlaylists response:", response); // Debug log
      
      if (response.status === "error") {
        // Nếu có lỗi xác thực, vẫn trả về playlist hệ thống
        if (response.message === "Authentication failed") {
          return {
            status: "success",
            message: "Fetched system playlists only",
            playlists: response.playlists?.filter(p => p.type === 'system') || []
          };
        }
        return rejectWithValue(response.message);
      }
      
      return response;
    } catch (error) {
      console.error("Error in fetchPlaylists:", error);
      return rejectWithValue(error.message);
    }
  }
);

const playlistSlice = createSlice({
  name: 'playlists',
  initialState: {
    items: {
      data: [],
      status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
      error: null
    }
  },
  reducers: {
    clearPlaylists: (state) => {
      // Chỉ xóa playlist cá nhân, giữ lại playlist hệ thống
      const systemPlaylists = state.items.data.filter(p => p.type === 'system');
      state.items.data = systemPlaylists;
      state.items.status = 'idle';
      state.items.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaylists.pending, (state) => {
        state.items.status = 'loading';
        state.items.error = null;
      })
      .addCase(fetchPlaylists.fulfilled, (state, action) => {
        state.items.status = 'succeeded';
        
        if (action.payload && action.payload.playlists) {
          const playlists = action.payload.playlists;
          const systemPlaylists = playlists.filter(p => p.type === 'system');
          const personalPlaylists = playlists.filter(p => p.type === 'personal');
          
          // Luôn giữ lại playlist hệ thống từ state cũ nếu có
          const existingSystemPlaylists = state.items.data.filter(p => p.type === 'system');
          const finalSystemPlaylists = systemPlaylists.length > 0 ? systemPlaylists : existingSystemPlaylists;
          
          // Kết hợp playlist hệ thống và cá nhân
          state.items.data = [...finalSystemPlaylists, ...personalPlaylists];
          
          console.log("Redux state updated:", {
            systemPlaylists: finalSystemPlaylists,
            personalPlaylists,
            total: state.items.data.length
          });
        } else {
          console.error("Invalid playlist data structure:", action.payload);
          // Giữ lại playlist hệ thống nếu có
          state.items.data = state.items.data.filter(p => p.type === 'system');
        }
      })
      .addCase(fetchPlaylists.rejected, (state, action) => {
        state.items.status = 'failed';
        state.items.error = action.payload || action.error.message;
        // Giữ lại playlist hệ thống nếu có
        state.items.data = state.items.data.filter(p => p.type === 'system');
        console.error("Playlist fetch failed:", state.items.error);
      });
  },
});

export const { clearPlaylists } = playlistSlice.actions;
export default playlistSlice.reducer;
