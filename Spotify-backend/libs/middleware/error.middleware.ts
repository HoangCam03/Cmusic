import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors.js';

export const errorMiddleware = (
  err: any,
  req: any,
  res: any,
  next: any
) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      type: err.type,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  // Lỗi không xác định (Internal Server Error)
  console.error('Unhandled Error:', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong',
    type: 'INTERNAL_SERVER_ERROR',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
