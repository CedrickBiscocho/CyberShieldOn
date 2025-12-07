// Local progress storage for guest users

interface LocalModuleProgress {
  [moduleId: string]: {
    progressPercentage: number;
    updatedAt: string;
  };
}

interface LocalQuizProgress {
  [threatId: string]: {
    score: number;
    bestScore: number;
    completed: boolean;
    updatedAt: string;
  };
}

const LOCAL_MODULE_PROGRESS_KEY = 'cybershield_module_progress';
const LOCAL_QUIZ_PROGRESS_KEY = 'cybershield_quiz_progress';

// Module Progress Functions
export function saveLocalModuleProgress(moduleId: string, progressPercentage: number): void {
  const existing = getAllLocalModuleProgress();
  const currentProgress = existing[moduleId]?.progressPercentage || 0;
  
  // Only save if new progress is higher
  if (progressPercentage > currentProgress) {
    existing[moduleId] = {
      progressPercentage,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_MODULE_PROGRESS_KEY, JSON.stringify(existing));
  }
}

export function getLocalModuleProgress(moduleId: string): number {
  const all = getAllLocalModuleProgress();
  return all[moduleId]?.progressPercentage || 0;
}

export function getAllLocalModuleProgress(): LocalModuleProgress {
  try {
    const stored = localStorage.getItem(LOCAL_MODULE_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Quiz Progress Functions
export function saveLocalQuizProgress(threatId: string, score: number, completed: boolean): void {
  const existing = getAllLocalQuizProgress();
  const currentBest = existing[threatId]?.bestScore || 0;
  
  existing[threatId] = {
    score,
    bestScore: Math.max(score, currentBest),
    completed: completed || existing[threatId]?.completed || false,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_QUIZ_PROGRESS_KEY, JSON.stringify(existing));
}

export function getLocalQuizProgress(threatId: string): { score: number; bestScore: number; completed: boolean } | null {
  const all = getAllLocalQuizProgress();
  return all[threatId] || null;
}

export function getAllLocalQuizProgress(): LocalQuizProgress {
  try {
    const stored = localStorage.getItem(LOCAL_QUIZ_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Check if user has any local progress
export function hasAnyLocalProgress(): boolean {
  const moduleProgress = getAllLocalModuleProgress();
  const quizProgress = getAllLocalQuizProgress();
  return Object.keys(moduleProgress).length > 0 || Object.keys(quizProgress).length > 0;
}

// Clear all local progress (call after syncing to database)
export function clearAllLocalProgress(): void {
  localStorage.removeItem(LOCAL_MODULE_PROGRESS_KEY);
  localStorage.removeItem(LOCAL_QUIZ_PROGRESS_KEY);
}
