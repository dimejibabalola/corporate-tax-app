
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { Textbook, TextbookSchema } from '../schemas/textbooks';

export function useTextbooks() {
    return useQuery({
        queryKey: ['textbooks'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('textbooks')
                .select('*');

            if (error) throw error;
            return data.map(t => TextbookSchema.parse(t));
        },
    });
}

export function useCreateTextbook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newTextbook: Omit<Textbook, 'id' | 'upload_date'>) => {
            const { data, error } = await supabase
                .from('textbooks')
                .insert({
                    ...newTextbook,
                    id: crypto.randomUUID(),
                })
                .select()
                .single();

            if (error) throw error;
            return TextbookSchema.parse(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['textbooks'] });
        },
    });
}
