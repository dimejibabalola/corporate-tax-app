import { z } from 'zod';

export const TextbookSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string(),
    file_name: z.string(),
    total_pages: z.number().int(),
    upload_date: z.string(),
    processed: z.boolean().default(false),
});

export type Textbook = z.infer<typeof TextbookSchema>;
