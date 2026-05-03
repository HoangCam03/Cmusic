import { Request, Response } from 'express';
import { PlanFeature } from '../../../../libs/database/schemas/plan-feature.schema';

// GET /plan-features
export const listPlanFeatures = async (_req: Request, res: Response) => {
  try {
    const features = await PlanFeature.find().sort({ category: 1, order: 1 });
    return res.json({ success: true, data: features });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /plan-features
export const createPlanFeature = async (req: Request, res: Response) => {
  try {
    const { id, label, category, limits, order } = req.body;

    if (!id || !label || !category) {
      return res.status(400).json({ success: false, message: 'id, label và category là bắt buộc' });
    }

    const existing = await PlanFeature.findOne({ id });
    if (existing) {
      return res.status(409).json({ success: false, message: `Tính năng "${id}" đã tồn tại` });
    }

    const feature = await PlanFeature.create({ id, label, category, limits, order: order ?? 0 });
    return res.status(201).json({ success: true, data: feature });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /plan-features/:id
export const updatePlanFeature = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, category, limits, order } = req.body;

    const feature = await PlanFeature.findOne({ id });
    if (!feature) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tính năng' });
    }

    if (label !== undefined)    feature.label    = label;
    if (category !== undefined) feature.category = category;
    if (order !== undefined)    feature.order    = order;
    if (limits)                 feature.limits   = { ...feature.limits, ...limits };

    await feature.save();
    return res.json({ success: true, data: feature });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /plan-features/:id
export const deletePlanFeature = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await PlanFeature.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tính năng' });
    }
    return res.json({ success: true, message: `Đã xóa tính năng "${id}"` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
