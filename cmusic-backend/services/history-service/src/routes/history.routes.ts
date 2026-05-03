import { Router } from 'express';
import { historyController } from '../controllers/history.controller';

const router = Router();

// POST /history/play → Ghi lại lịch sử nghe
router.post('/play', historyController.recordPlay);

// GET /history/recently-played → Lấy danh sách vừa nghe
router.get('/recently-played', historyController.getRecentlyPlayed);

// GET /history/stats → Lấy thống kê lượt nghe cá nhân
router.get('/stats', historyController.getUserStats);

// GET /history/global-stats → Lấy thống kê tổng quan (Admin)
router.get('/global-stats', historyController.getGlobalStats);

// GET /history/artist-stats → Lấy thống kê chuyên sâu cho Nghệ sĩ (Studio)
router.get('/artist-stats', historyController.getArtistStats);

export default router;
