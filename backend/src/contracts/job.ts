import { z } from "zod";

export const JOB_STATUSES = ["wishlist", "applied", "interviewing", "offer", "rejected", "ghosted"] as const;
export const JobStatusSchema = z.enum(JOB_STATUSES);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const CreateJobSchema = z
  .object({
    company: z.string().trim().min(1).max(160),
    position: z.string().trim().min(1).max(200),
    location: z.string().trim().max(160).default(""),
    url: z.string().trim().max(500).default(""),
    status: JobStatusSchema.default("wishlist"),
    notes: z.string().trim().max(4_000).default(""),
  })
  .strict();

export const UpdateJobSchema = z
  .object({
    company: z.string().trim().min(1).max(160).optional(),
    position: z.string().trim().min(1).max(200).optional(),
    location: z.string().trim().max(160).optional(),
    url: z.string().trim().max(500).optional(),
    status: JobStatusSchema.optional(),
    notes: z.string().trim().max(4_000).optional(),
  })
  .strict();

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
