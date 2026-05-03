/**
 * Run this script to update an artist with "REAL" professional data/images
 * Usage: node seed-data-pro.js <ArtistID>
 */

const axios = require('axios');

const artistId = process.argv[2];
if (!artistId) {
  console.log("Please provide an Artist ID. Usage: node seed-data-pro.js <ID>");
  process.exit(1);
}

const API_URL = 'http://localhost:8001/catalog'; // Gateway or Catalog service

const realData = {
  name: "Hieu Thu Hai",
  bio: "Hieu Thu Hai (born Tran Minh Hieu) is a standout rapper, singer, and songwriter representing Vietnam's Gen Z music scene. He gained massive popularity through 'King of Rap' and is known for his sophisticated style and catchy melodies.",
  isVerified: true,
  avatarUrl: "https://vcdn1-entertainment.vnecdn.net/2023/12/28/hieu-thu-hai-1-1703770146-2486-1703770284.jpg",
  bannerUrl: "https://media.vov.vn/sites/default/files/styles/large/public/2023-11/hieuthuhai_0.jpg",
  gallery: [
    "https://images2.thanhnien.vn/528068263637045248/2023/12/17/hieuthuhai-1702809147551608930438.jpg",
    "https://kenh14cdn.com/203336854389633024/2024/1/10/hieuthuhai-17048756950291901416474.jpg",
    "https://i.vietnamnet.vn/fms/2021/01/19/hieu-thu-hai-1.jpg"
  ],
  stats: {
    monthlyListeners: 1974876,
    followers: 850000
  },
  socials: {
    facebook: "https://facebook.com/hieuthuhai",
    instagram: "https://instagram.com/hieuthuhai",
    youtube: "https://youtube.com/@hieuthuhai"
  }
};

async function seed() {
  try {
    console.log(`Updating artist ${artistId}...`);
    // NOTE: This usually needs Auth. In development, we might skip it or use a master secret.
    // Since I don't have the user's token here, I will assume they run it in an environment 
    // where they can patch the DB or have an admin token.

    const response = await axios.put(`${API_URL}/artists/${artistId}`, realData);
    console.log("Success!", response.data);
  } catch (error) {
    console.error("Failed:", error.response?.data || error.message);
  }
}

seed();
