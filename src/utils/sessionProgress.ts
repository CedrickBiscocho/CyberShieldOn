// Session-based progress for guest users (resets on page reload/tab close)
// This uses in-memory storage that clears when the page is refreshed

interface SessionModuleProgress {
  [moduleId: string]: number;
}

interface SessionQuizProgress {
  [threatId: string]: {
    score: number;
    completed: boolean;
  };
}

// In-memory storage - resets on page reload
let sessionModuleProgress: SessionModuleProgress = {};
let sessionQuizProgress: SessionQuizProgress = {};

// Module Progress Functions
export function saveSessionModuleProgress(moduleId: string, progressPercentage: number): void {
  const currentProgress = sessionModuleProgress[moduleId] || 0;
  
  // Only save if new progress is higher
  if (progressPercentage > currentProgress) {
    sessionModuleProgress[moduleId] = progressPercentage;
  }
}

export function getSessionModuleProgress(moduleId: string): number {
  return sessionModuleProgress[moduleId] || 0;
}

export function getAllSessionModuleProgress(): SessionModuleProgress {
  return { ...sessionModuleProgress };
}

// Quiz Progress Functions
export function saveSessionQuizProgress(threatId: string, score: number, completed: boolean): void {
  const existing = sessionQuizProgress[threatId];
  const currentBest = existing?.score || 0;
  
  sessionQuizProgress[threatId] = {
    score: Math.max(score, currentBest),
    completed: completed || existing?.completed || false,
  };
}

export function getSessionQuizProgress(threatId: string): { score: number; completed: boolean } | null {
  return sessionQuizProgress[threatId] || null;
}

export function getAllSessionQuizProgress(): SessionQuizProgress {
  return { ...sessionQuizProgress };
}

// Clear all session progress
export function clearSessionProgress(): void {
  sessionModuleProgress = {};
  sessionQuizProgress = {};
}

// Check if user has any session progress
export function hasAnySessionProgress(): boolean {
  return Object.keys(sessionModuleProgress).length > 0 || Object.keys(sessionQuizProgress).length > 0;
}
