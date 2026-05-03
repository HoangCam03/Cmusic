import { Request, Response } from 'express';
import { Permission } from '../../../../libs/database/schemas/permission.schema';

// GET /permissions
export const listPermissions = async (_req: Request, res: Response) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, order: 1 });
    return res.json({ success: true, data: permissions });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /permissions
export const createPermission = async (req: Request, res: Response) => {
  try {
    const { id, label, description, category, guard, roles, order } = req.body;

    if (!id || !label || !category) {
      return res.status(400).json({ success: false, message: 'id, label và category là bắt buộc' });
    }

    const existing = await Permission.findOne({ id });
    if (existing) {
      return res.status(409).json({ success: false, message: `Quyền "${id}" đã tồn tại` });
    }

    const perm = await Permission.create({
      id,
      label,
      description,
      category,
      guard: guard ?? 'authenticate',
      roles: {
        admin: true, // Admin luôn có toàn quyền — không thể tắt
        artist: roles?.artist ?? false,
        user: roles?.user ?? false,
      },
      order: order ?? 0,
    });

    return res.status(201).json({ success: true, data: perm });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /permissions/:id
export const updatePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, description, category, guard, roles, order } = req.body;

    const perm = await Permission.findOne({ id });
    if (!perm) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quyền' });
    }

    if (label !== undefined) perm.label = label;
    if (description !== undefined) perm.description = description;
    if (category !== undefined) perm.category = category;
    if (guard !== undefined) perm.guard = guard;
    if (order !== undefined) perm.order = order;
    if (roles) {
      perm.roles = {
        admin: true, // Admin không thể bị tắt quyền
        artist: roles.artist ?? perm.roles.artist,
        user: roles.user ?? perm.roles.user,
      };
    }

    await perm.save();
    return res.json({ success: true, data: perm });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /permissions/:id
export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Permission.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quyền' });
    }
    return res.json({ success: true, message: `Đã xóa quyền "${id}"` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
