import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_module_progress: number;
  total_quiz_score: number;
  modules_completed: number;
  quizzes_completed: number;
  total_score: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard');
      
      if (error) throw error;
      
      return (data || []).map((entry: any, index: number) => ({
        ...entry,
        total_score: Number(entry.total_module_progress) + Number(entry.total_quiz_score),
        rank: index + 1
      })) as (LeaderboardEntry & { rank: number })[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
