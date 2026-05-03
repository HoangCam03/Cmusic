import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requirePermission } from '@spotify/libs/middleware/auth.middleware';

const router = Router();

// ─── Public/Self Routes 

// Lấy thông tin cá nhân (đăng nhập là dùng được)
router.get('/me', authenticate, userController.getMyProfile);

// Cập nhật thông tin cá nhân (user tự cập nhật hoặc có quyền edit)
router.put('/:userId', authenticate, userController.updateUser);

// ─── Protected Routes 

// Lấy danh sách tất cả người dùng
router.get('/', authenticate, requirePermission('list_all_users'), userController.getAllUsers);

// Tạo người dùng mới
router.post('/', authenticate, requirePermission('create_user'), userController.createUser);

// Lấy thống kê
router.get('/stats', authenticate, requirePermission('view_stats'), userController.getUserStats);

// Lấy thông tin một người dùng theo ID
router.get('/:userId', authenticate, requirePermission('list_all_users'), userController.getUserById);

// Xóa người dùng
router.delete('/:userId', authenticate, requirePermission('delete_user'), userController.deleteUser);

// Cập nhật vai trò (Nghệ sĩ <-> Người dùng)
router.patch('/:userId/role', authenticate, requirePermission('change_role'), userController.updateUserRole);

export default router;
