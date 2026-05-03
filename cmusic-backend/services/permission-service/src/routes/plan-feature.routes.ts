import { Router } from 'express';
import {
  listPlanFeatures,
  createPlanFeature,
  updatePlanFeature,
  deletePlanFeature,
} from '../controllers/plan-feature.controller';

const router = Router();

router.get('/',       listPlanFeatures);
router.post('/',      createPlanFeature);
router.put('/:id',    updatePlanFeature);
router.delete('/:id', deletePlanFeature);

export default router;
