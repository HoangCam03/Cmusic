import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getAllSongs } from "../../services/SongServices/ListSongs";

interface Song {
  _id: string;
  name: string;
  artist: string;
  file: string;
  image: string;
  [key: string]: any;
}

interface SongState {
  items: Song[];
  currentTrack: Song | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const getInitialTrack = () => {
  try {
    const saved = localStorage.getItem('cmusic_current_track');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialState: SongState = {
  items: [],
  currentTrack: getInitialTrack(),
  status: "idle",
  error: null,
};

export const fetchSongs = createAsyncThunk("songs/fetchSongs", async () => {
  const result = await getAllSongs();

  if (result && result.success && result.data && result.data.tracks) {
    return result.data.tracks.map((track: any) => {
      // Đảm bảo tương thích với mọi Component (SongCard, Player, v.v.)
      const officialArtist = Array.isArray(track.officialArtistId) ? track.officialArtistId[0] : null;

      return {
        ...track,
        name: track.title,
        title: track.title,
        artist: officialArtist?.name || track.artist || track.artistId?.displayName || "Nghệ sĩ CMusic",
        artistAvatar: officialArtist?.avatarUrl || track.artistId?.avatarUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
        artistBio: officialArtist?.bio || track.artistId?.bio,
        monthlyListeners: officialArtist?.stats?.monthlyListeners || track.artistId?.monthlyListeners || 1234567,
        followerCount: officialArtist?.stats?.followerCount || track.artistId?.followerCount || 0,
        file: track.audioUrl,
        audioUrl: track.audioUrl,
        image: track.coverUrl,
        coverUrl: track.coverUrl,
        coverImage: track.coverUrl,
      };
    });
  }

  return [];
});


const songSlice = createSlice({
  name: "songs",
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Song>) => {
      state.currentTrack = action.payload;
      try {
        localStorage.setItem('cmusic_current_track', JSON.stringify(action.payload));
      } catch (e) { }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSongs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSongs.fulfilled, (state, action: PayloadAction<Song[]>) => {
        state.status = "succeeded";
        state.items = action.payload;
        if (action.payload.length > 0 && !state.currentTrack) {
          state.currentTrack = action.payload[0];
        }
      })
      .addCase(fetchSongs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch songs";
      });
  },
});

export const { setCurrentTrack } = songSlice.actions;
export default songSlice.reducer;
