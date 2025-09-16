import image1 from './images/singer/ViPoP.jpg';
import image2 from './images/singer/Sibun.jpg';
import t2 from './images/singer/T2.jpg';
import t3 from './images/singer/Mikelody.jpg';
import image3 from './images/singer/Rosie1.jpg';
import itaewon from './images/singer/itaewon.jpg';
import DailyMix6 from './images/singer/Album/DailyMix6.jpg'

import song1 from './images/music/song1.mp3';
import song2 from './images/music/song2.mp3';
import song3 from './images/music/song3.mp3';
import number_one_girl from './images/music/number_one_girl.mp3';
import pause from './images/icon/pause.svg'
import search from './images/icon/search.svg'
import logoGreen from "./images/icon/logoGreen.svg";
import logo from './images/icon/logo.svg'
import home_icon from './images/icon/home.svg';
import library from './images/icon/library.svg';
import microphone from './images/icon/microphone.svg';
import queue from './images/icon/list.png';
import headphone from './images/icon/headphone.svg';
import volume from './images/icon/volume.png';
import miniplayer from './images/icon/miniplayer.png';
import zoom from './images/icon/zoom.png';
import angleRight from './images/icon/angleRight.svg';
import angleLeft from './images/icon/angleLeft.svg';
import home from './images/icon/home.svg';
import google from './images/icon/google.svg';
import fb from './images/icon/fbIcon.svg';
import apple from './images/icon/apple.svg';
import eyeOpen from "./images/icon/eye-open.svg";
import pen from "./images/icon/pen.svg";

export const assets = {
  image1,
  image2,
  image3,
  t2,
  t3,
  itaewon,
  DailyMix6,
  song1,
  song2,
  song3,
  number_one_girl,
  pause,
  search,
  logoGreen,
  logo,
  home,
  queue,
  headphone,
  microphone,
  home_icon,
  library,
  volume,
  miniplayer,
  zoom,
  angleRight,
  angleLeft,
  google,
  fb,
  apple,
  eyeOpen,
  pen,
};

export const albumsData = [
  {
    id: 0,
    name: "vpop",
    image: image1,
    desc: "덴 바우의 음악을 듣고 싶다면, 여기를 클릭하세요!",
    bgcolor: "#808080",
    // file: song1 add music
  },
  {
    id: 1,
    name: "sibun",
    image: image2,
    desc: "SOOBIN의 음악을 듣고 싶다면, 여기를 클릭하세요!",
    bgcolor: "#59afe0",
    // file: song2 add music
  },
  {
    id: 2,
    name: "Daily Mix",
    image: DailyMix6,
    desc: "내면의 이야기를 담은 감성적인 곡들.",
    bgcolor: "#59afe0",
    // file: song1 add music
  },
  {
    id: 3,
    name: "VietNamese Music",
    image: image2, /// ảnh trending vietnamese music ??
    desc: "요즘 유행하는 베트남 음악",
    bgcolor: "#0ecba1",
  },
];

export const songsData = [
  {
    id: 0,
    name: "Number one girl",
    image: image3,
    file: number_one_girl, /// number one girl
    desc: `로제`,
    duration: "3:01",
    // file: song1 add music
  },
  {
    id: 1,
    name: "Thanh Âm Da Vàng",
    image: t3,
    file: song1,
    desc: "Mikelodic",
    duration: "3:02",
    // file: song2 add music
  },
  {
    id: 2,
    name: "An",
    image: t2,
    file: song2, /// An
    desc: "Lil Wuyn", ////???
    duration: "3:01",
    // file: song1 add music
  },
  {
    id: 3,
    name: "그때 그 아인",
    image: itaewon,
    file: song3, ///kim feel
    desc: "김필",///???
    duration: "4:44",
  },
];