import { z } from 'zod';

export const INDUSTRIES = [
  'Hospitality & Tourism',
  'Renewable Energy',
  'Digital Marketing',
  'Finance & Fintech',
  'Healthcare',
  'Education',
  'Construction',
  'Technology',
  'Other',
] as const;

export const VISA_OPTIONS = ['yes', 'no', 'partial'] as const;
export const RELOCATION_OPTIONS = ['yes', 'no', 'allowance_only'] as const;

export const jobInputSchema = z.object({
  title: z.string().min(2).max(200),
  companyName: z.string().min(1).max(200),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companyLogo: z.string().url().optional().or(z.literal('')),
  country: z.string().min(1).max(100),
  industry: z.enum(INDUSTRIES),
  salaryRange: z.string().max(100).optional().or(z.literal('')),
  visaSupport: z.enum(VISA_OPTIONS),
  relocationPkg: z.enum(RELOCATION_OPTIONS),
  workingLanguage: z.string().max(100).optional().or(z.literal('')),
  description: z.string().min(20).max(10000),
  applyUrl: z.string().min(1).max(500),
});

export const checkoutSchema = z.object({
  contactEmail: z.string().email(),
  jobs: z.array(jobInputSchema).min(1).max(50),
  honeypot: z.string().max(0).optional(),
});

export const searchParamsSchema = z.object({
  q: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type JobInput = z.infer<typeof jobInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
