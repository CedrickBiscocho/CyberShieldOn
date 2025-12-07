import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  threatId: string;
  questions: QuizQuestion[];
}

export function useQuizzes(threatId?: string) {
  return useQuery({
    queryKey: ['quizzes', threatId],
    queryFn: async () => {
      let query = supabase.from('quizzes').select('*');
      
      if (threatId) {
        query = query.eq('threat_id', threatId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((quiz) => ({
        id: quiz.id,
        threatId: quiz.threat_id,
        questions: (Array.isArray(quiz.questions) ? quiz.questions : []) as unknown as QuizQuestion[],
      }));
    },
  });
}

export function useUserProgress(threatId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-progress', user?.id, threatId],
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async () => {
      if (!user) return null;

      let query = supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (threatId) {
        query = query.eq('threat_id', threatId);
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }
    },
    enabled: !!user,
  });
}

export function useSaveProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threatId,
      score,
      completed,
    }: {
      threatId: string;
      score: number;
      completed: boolean;
    }) => {
      if (!user) throw new Error('User must be logged in');

      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('threat_id', threatId)
        .maybeSingle();

      const newBestScore = existing?.best_score
        ? Math.max(existing.best_score, score)
        : score;

      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: user.id,
            threat_id: threatId,
            score,
            best_score: newBestScore,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          },
          {
            onConflict: 'user_id,threat_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      queryClient.refetchQueries({ queryKey: ['user-progress'] });
    },
  });
}
