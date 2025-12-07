import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_module_progress: number;
  total_quiz_score: number;
  modules_completed: number;
  quizzes_completed: number;
  total_score: number;
  rank: number;
}

export function useLeaderboard() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['leaderboard', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard');
      
      if (error) throw error;
      
      // Map all entries with their ranks and scores
      const allEntries = (data || []).map((entry: any, index: number) => ({
        ...entry,
        total_score: Number(entry.total_module_progress) + Number(entry.total_quiz_score),
        rank: index + 1
      })) as LeaderboardEntry[];
      
      // Get top 10
      const top10 = allEntries.slice(0, 10);
      
      // If current user exists and is not in top 10, add them
      if (user) {
        const currentUserEntry = allEntries.find(e => e.user_id === user.id);
        const isInTop10 = top10.some(e => e.user_id === user.id);
        
        if (currentUserEntry && !isInTop10) {
          return {
            top10,
            currentUser: currentUserEntry
          };
        }
      }
      
      return {
        top10,
        currentUser: null
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
