import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useRef } from 'react';

interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export function useModuleProgress(moduleId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['module-progress', moduleId, user?.id],
    queryFn: async () => {
      if (!user || !moduleId) return null;
      
      const { data, error } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ModuleProgress | null;
    },
    enabled: !!user && !!moduleId,
  });
}

export function useAllModuleProgress() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-module-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as ModuleProgress[];
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useSaveModuleProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastSavedRef = useRef<{ moduleId: string; progress: number } | null>(null);
  
  const mutation = useMutation({
    mutationFn: async ({ moduleId, progressPercentage }: { moduleId: string; progressPercentage: number }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if we already have progress for this module
      const { data: existing } = await supabase
        .from('module_progress')
        .select('id, progress_percentage')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      
      // Only update if new progress is higher
      if (existing && existing.progress_percentage >= progressPercentage) {
        return existing;
      }
      
      const { data, error } = await supabase
        .from('module_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          progress_percentage: progressPercentage,
        }, {
          onConflict: 'user_id,module_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ moduleId, progressPercentage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['all-module-progress', user?.id] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<ModuleProgress[]>(['all-module-progress', user?.id]);
      
      // Optimistically update cache
      queryClient.setQueryData<ModuleProgress[]>(['all-module-progress', user?.id], (old) => {
        if (!old) return old;
        const existing = old.find(p => p.module_id === moduleId);
        if (existing) {
          return old.map(p => 
            p.module_id === moduleId 
              ? { ...p, progress_percentage: Math.max(p.progress_percentage, progressPercentage) }
              : p
          );
        }
        // Add new entry if doesn't exist
        return [...old, { 
          id: crypto.randomUUID(),
          module_id: moduleId, 
          progress_percentage: progressPercentage, 
          user_id: user!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }];
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['all-module-progress', user?.id], context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['module-progress', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['all-module-progress'] });
    },
  });

  // Debounced save function to avoid too many API calls
  const saveProgress = useCallback((moduleId: string, progressPercentage: number) => {
    // Skip if same progress was just saved
    if (
      lastSavedRef.current?.moduleId === moduleId &&
      lastSavedRef.current?.progress === progressPercentage
    ) {
      return;
    }
    
    lastSavedRef.current = { moduleId, progress: progressPercentage };
    mutation.mutate({ moduleId, progressPercentage });
  }, [mutation]);

  return { saveProgress, isLoading: mutation.isPending };
}
