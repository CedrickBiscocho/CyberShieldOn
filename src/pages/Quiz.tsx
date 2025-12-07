import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useThreats } from "@/hooks/useThreats";
import { useUserProgress } from "@/hooks/useQuizzes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Brain, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSessionQuizProgress } from "@/utils/sessionProgress";

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: threats, isLoading: threatsLoading } = useThreats();
  const { data: progressData } = useUserProgress();
  
  
  
  const getQuizProgress = (threatId: string) => {
    // For logged-in users, use database progress
    if (user) {
      const userProgress = Array.isArray(progressData)
        ? progressData.find((p: any) => p.threat_id === threatId)
        : progressData?.threat_id === threatId
        ? progressData
        : null;
      return userProgress ? { bestScore: userProgress.best_score, completed: userProgress.completed } : null;
    }
    
    // For guests, show session-based progress (resets on reload)
    const sessionProgress = getSessionQuizProgress(threatId);
    if (sessionProgress) {
      return { bestScore: sessionProgress.score, completed: sessionProgress.completed };
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="gradient-cyber border-b border-border/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Cybersecurity Quizzes</span>
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Test your knowledge and track your progress. Each quiz has 10 questions 
            covering key concepts from the module.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {threatsLoading ? (
          <div className="text-center py-12">Loading quizzes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {threats?.map((threat) => {
              const quizProgress = getQuizProgress(threat.id);
              const bestScore = quizProgress?.bestScore || 0;
              const progressPercent = (bestScore / 10) * 100;
            
              return (
                <Card 
                  key={threat.id}
                  className="p-6 bg-card border-border/50 hover:border-primary/50 transition-smooth hover:shadow-glow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-5xl">{threat.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{threat.name}</h3>
                      <p className="text-sm text-muted-foreground">10 multiple choice questions</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Best Score</span>
                      <span className="text-primary font-medium">{bestScore}/10</span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>

                  {quizProgress && quizProgress.bestScore > 0 && (
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-accent">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          Best Score: {bestScore}/10 ({Math.round(progressPercent)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button 
                      onClick={() => navigate(`/quiz/${threat.id}`)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {quizProgress && quizProgress.bestScore > 0 ? 'Retake Quiz' : 'Start Quiz'}
                    </Button>
                    <Button 
                      onClick={() => navigate(`/module/${threat.id}`)}
                      variant="secondary"
                      className="w-full"
                    >
                      Review Module
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Quiz;
