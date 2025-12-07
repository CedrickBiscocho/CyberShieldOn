const STORAGE_KEY = 'pendingQuizProgress';
const EXPIRY_HOURS = 24;

export interface PendingQuizProgress {
  threatId: string;
  score: number;
  selectedAnswers: number[];
  completed: boolean;
  savedAt: string;
}

export const savePendingProgress = (progress: Omit<PendingQuizProgress, 'savedAt'>): void => {
  const data: PendingQuizProgress = {
    ...progress,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getPendingProgress = (): PendingQuizProgress | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    const progress: PendingQuizProgress = JSON.parse(data);
    
    // Check if progress has expired (24 hours)
    const savedAt = new Date(progress.savedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > EXPIRY_HOURS) {
      clearPendingProgress();
      return null;
    }
    
    return progress;
  } catch {
    clearPendingProgress();
    return null;
  }
};

export const clearPendingProgress = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
