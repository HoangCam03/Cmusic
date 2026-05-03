import { Router } from 'express';
import { likesController } from '../controllers/likes.controller';

const router = Router();

router.get('/tracks', likesController.getLikedTracks);
router.get('/tracks/:trackId/check', likesController.checkLiked);
router.post('/tracks/:trackId', likesController.likeTrack);
router.delete('/tracks/:trackId', likesController.unlikeTrack);

export default router;
