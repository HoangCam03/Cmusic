import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự'),
    avatarUrl: z.string().url('URL ảnh đại diện không hợp lệ').optional(),
    role: z.enum(['user', 'artist', 'admin']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
  }),
});
