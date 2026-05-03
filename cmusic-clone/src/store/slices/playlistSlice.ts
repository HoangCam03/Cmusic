import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getMyPlaylists, createPlaylist } from "../../services/PlaylistServices/ListPlaylists";

interface Playlist {
  _id: string;
  name: string;
  thumbnail: string;
  userId: string;
  tracks: string[];
  [key: string]: any;
}

interface PlaylistState {
  items: {
    data: Playlist[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
  };
}

const initialState: PlaylistState = {
  items: {
    data: [],
    status: "idle",
    error: null,
  },
};

export const fetchPlaylists = createAsyncThunk(
  "playlists/fetchPlaylists",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyPlaylists();
      // Backend trả về { success: true, data: [...] }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNewPlaylist = createAsyncThunk(
  "playlists/createNewPlaylist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await createPlaylist();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const playlistSlice = createSlice({
  name: "playlists",
  initialState,
  reducers: {
    clearPlaylists: (state) => {
      state.items.data = [];
      state.items.status = "idle";
      state.items.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaylists.pending, (state) => {
        state.items.status = "loading";
      })
      .addCase(fetchPlaylists.fulfilled, (state, action: PayloadAction<Playlist[]>) => {
        state.items.status = "succeeded";
        state.items.data = action.payload;
      })
      .addCase(fetchPlaylists.rejected, (state, action) => {
        state.items.status = "failed";
        state.items.error = action.payload as string;
      })
      .addCase(createNewPlaylist.fulfilled, (state, action: PayloadAction<Playlist>) => {
        state.items.data.unshift(action.payload); // Thêm playlist mới lên đầu danh sách
      });
  },
});

export const { clearPlaylists } = playlistSlice.actions;
export default playlistSlice.reducer;
