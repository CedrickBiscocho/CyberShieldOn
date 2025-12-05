import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Threat {
  id: string;
  name: string;
  icon: string;
  summary: string;
  description: string;
  howItWorks: string[];
  warningSigns: string[];
  prevention: string[];
  category: 'social' | 'technical' | 'network';
}

export function useThreats() {
  return useQuery({
    queryKey: ['threats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threats')
        .select('*')
        .order('created_at');

      if (error) throw error;

      return data.map((threat) => ({
        id: threat.id,
        name: threat.name,
        icon: threat.icon,
        summary: threat.summary,
        description: threat.description,
        howItWorks: threat.how_it_works as string[],
        warningSigns: threat.warning_signs as string[],
        prevention: threat.prevention as string[],
        category: threat.category as 'social' | 'technical' | 'network',
      })) as Threat[];
    },
  });
}

export function useThreat(id: string) {
  return useQuery({
    queryKey: ['threat', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threats')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        icon: data.icon,
        summary: data.summary,
        description: data.description,
        howItWorks: data.how_it_works as string[],
        warningSigns: data.warning_signs as string[],
        prevention: data.prevention as string[],
        category: data.category as 'social' | 'technical' | 'network',
      } as Threat;
    },
    enabled: !!id,
  });
}
