import { Router } from 'express';
import {
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from '../controllers/permission.controller';

const router = Router();

router.get('/',       listPermissions);
router.post('/',      createPermission);
router.put('/:id',    updatePermission);
router.delete('/:id', deletePermission);

export default router;
