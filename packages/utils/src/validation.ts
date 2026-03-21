import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  honeypot: z.string().max(0),
});

export type ContactFormData = z.infer<typeof ContactSchema>;
