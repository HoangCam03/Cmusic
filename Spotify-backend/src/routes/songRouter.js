import express from "express";
import SongController from "../controllers/SongController.js";
const router = express.Router();

import upload from "../middleware/multer.js";

router.post("/add-song", upload.fields([{name:'image', maxCount:1},{name:'audio', maxCount:1}],), SongController.addSong);

router.get("/list-songs", SongController.listSong);

router.delete("/delete-song/:_id", SongController.deleteSong);

router.put("/update-song/:_id", upload.fields([{name:'image', maxCount:1},{name:'audio', maxCount:1}],), SongController.editSong);

export default router;