import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ThreatReference {
  title?: string;
  url: string;
}

export interface Threat {
  id: string;
  name: string;
  icon: string;
  summary: string;
  description: string;
  howItWorks: string[];
  howItWorksIntro: string | null;
  warningSigns: string[];
  warningSignsIntro: string | null;
  prevention: string[];
  preventionIntro: string | null;
  category: 'social' | 'technical' | 'network';
  source_references: ThreatReference[];
  whyItMatters: string | null;
  realWorldExample: string | null;
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
        howItWorksIntro: threat.how_it_works_intro,
        warningSigns: threat.warning_signs as string[],
        warningSignsIntro: threat.warning_signs_intro,
        prevention: threat.prevention as string[],
        preventionIntro: threat.prevention_intro,
        category: threat.category as 'social' | 'technical' | 'network',
        source_references: (threat.source_references || []) as unknown as ThreatReference[],
        whyItMatters: threat.why_it_matters,
        realWorldExample: threat.real_world_example,
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
        howItWorksIntro: data.how_it_works_intro,
        warningSigns: data.warning_signs as string[],
        warningSignsIntro: data.warning_signs_intro,
        prevention: data.prevention as string[],
        preventionIntro: data.prevention_intro,
        category: data.category as 'social' | 'technical' | 'network',
        source_references: (data.source_references || []) as unknown as ThreatReference[],
        whyItMatters: data.why_it_matters,
        realWorldExample: data.real_world_example,
      } as Threat;
    },
    enabled: !!id,
  });
}
