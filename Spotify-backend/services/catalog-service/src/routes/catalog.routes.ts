import { Router } from 'express';
import { catalogController } from '../controllers/catalog.controller.js';

const router = Router();

// /tracks
router.get('/tracks', catalogController.getTracks);

// /tracks/:trackId
router.get('/tracks/:trackId', catalogController.getTrackById);

// /tracks (POST - Artist only, but we verify role at Gateway)
router.post('/tracks', catalogController.createTrack);

export default router;
