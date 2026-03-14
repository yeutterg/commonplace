import { z } from "zod";

export const authRequestSchema = z.object({
  slug: z.string().min(1),
  password: z.string().min(1),
  email: z.string().email()
});

export const createCommentSchema = z.object({
  authorEmail: z.string().email().max(200),
  body: z.string().trim().min(1).max(2000),
  anchorText: z.string().max(500),
  anchorStart: z.coerce.number().int().min(0),
  anchorEnd: z.coerce.number().int().min(0),
  honeypot: z.string().optional()
});

export const updateCommentSchema = z.object({
  status: z.enum(["open", "resolved"])
});
