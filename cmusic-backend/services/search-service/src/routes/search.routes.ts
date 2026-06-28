import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

router.get('/', searchController.searchAll as any);
router.get('/suggest', searchController.suggest as any);

export default router;
