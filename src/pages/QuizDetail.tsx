import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useThreat } from "@/hooks/useThreats";
import { useQuizzes, useSaveProgress } from "@/hooks/useQuizzes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, Save, LogIn } from "lucide-react";
import { toast } from "sonner";
import { 
  savePendingProgress, 
  getPendingProgress, 
  clearPendingProgress 
} from "@/utils/pendingQuizProgress";
import { saveSessionQuizProgress } from "@/utils/sessionProgress";
import { saveLocalQuizProgress } from "@/utils/localProgress";

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: threat, isLoading: threatLoading } = useThreat(id || '');
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzes(id);
  const saveProgress = useSaveProgress();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [progressRestored, setProgressRestored] = useState(false);

  const quiz = quizzes?.[0];
  const shouldSaveProgress = searchParams.get('saveProgress') === 'true';

  // Handle restoring and saving pending progress when user logs in
  useEffect(() => {
    if (!user || !id || progressRestored) return;

    const pendingProgress = getPendingProgress();
    if (pendingProgress && pendingProgress.threatId === id && shouldSaveProgress) {
      // User just logged in and has pending progress for this quiz
      const savePending = async () => {
        try {
          await saveProgress.mutateAsync({
            threatId: pendingProgress.threatId,
            score: pendingProgress.score,
            completed: pendingProgress.completed,
          });
          clearPendingProgress();
          toast.success("Your previous progress has been saved!");
          
          // Restore the quiz state
          setSelectedAnswers(pendingProgress.selectedAnswers);
          setScore(pendingProgress.score);
          if (pendingProgress.completed) {
            setShowResults(true);
          }
        } catch (error) {
          console.error('Failed to save pending progress:', error);
          toast.error("Failed to save your progress. Please try again.");
        }
      };
      savePending();
      setProgressRestored(true);
    }
  }, [user, id, shouldSaveProgress, progressRestored, saveProgress]);

  const handleSaveProgressForGuest = () => {
    if (!id) return;
    
    // Calculate current score if quiz was completed
    let currentScore = score;
    let completed = showResults;
    
    if (!showResults && quiz) {
      // Calculate partial progress score
      currentScore = 0;
      quiz.questions.forEach((q, index) => {
        if (selectedAnswers[index] === q.correctAnswer) {
          currentScore++;
        }
      });
    }
    
    savePendingProgress({
      threatId: id,
      score: currentScore,
      selectedAnswers,
      completed,
    });
    
    // Navigate to auth with return URL
    navigate(`/auth?returnTo=/quiz/${id}&saveProgress=true`);
    toast.info("Create an account to save your progress!");
  };

  if (threatLoading || quizzesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div>Loading quiz...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!threat || !quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz not found</h1>
          <Button onClick={() => navigate("/quiz")}>Back to Quizzes</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (selectedAnswers[currentQuestion] === undefined) {
      toast.error("Please select an answer");
      return;
    }

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishQuiz = async () => {
    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correctCount++;
      }
    });
    
    console.log('[QuizDetail] Quiz finished - correctCount:', correctCount, 'totalQuestions:', quiz.questions.length);
    
    setScore(correctCount);
    setShowResults(true);

    // For guests, save to both session (for UI) and localStorage (for account sync)
    if (id && !user) {
      saveSessionQuizProgress(id, correctCount, true);
      saveLocalQuizProgress(id, correctCount, true);
      console.log('[QuizDetail] Saved guest progress to session & localStorage:', { threatId: id, score: correctCount });
    }

    // Save progress to database only if logged in
    if (user && id) {
      try {
        console.log('[QuizDetail] Saving to database...', { userId: user.id, threatId: id, score: correctCount });
        const result = await saveProgress.mutateAsync({
          threatId: id,
          score: correctCount,
          completed: true,
        });
        console.log('[QuizDetail] Database save result:', result);
        toast.success("Quiz completed! Progress saved.");
      } catch (error) {
        console.error('[QuizDetail] Failed to save progress:', error);
        toast.success("Quiz completed!");
      }
    } else {
      console.log('[QuizDetail] User not logged in, skipping database save');
      toast.success("Quiz completed! Create an account to save your score.");
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  if (showResults) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 bg-card border-border/50 text-center space-y-6">
              <div className="text-7xl mb-4">{threat.icon}</div>
              
              <div>
                <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                <p className="text-muted-foreground">{threat.name}</p>
              </div>

              <div className={`text-6xl font-bold ${passed ? 'text-accent' : 'text-warning'}`}>
                {score}/{quiz.questions.length}
              </div>

              <div className={`text-2xl font-semibold ${passed ? 'text-accent' : 'text-warning'}`}>
                {percentage}% Correct
              </div>

              <div className="py-4">
                {passed ? (
                  <div className="flex items-center justify-center gap-2 text-accent">
                    <Trophy className="h-8 w-8" />
                    <span className="text-xl font-semibold">Excellent Work!</span>
                  </div>
                ) : (
                  <p className="text-lg text-muted-foreground">
                    Keep learning! Review the module and try again.
                  </p>
                )}
              </div>

              {/* Save Progress CTA for guest users */}
              {!user && (
                <Card className="p-6 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Save className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Want to save your score?</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create an account to track your progress and compete on the leaderboard!
                  </p>
                  <Button 
                    onClick={handleSaveProgressForGuest}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <LogIn className="h-4 w-4" />
                    Create Account & Save Progress
                  </Button>
                </Card>
              )}

              <div className="space-y-4 pt-4">
                {quiz.questions.map((question, index) => {
                  const isCorrect = selectedAnswers[index] === question.correctAnswer;
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${isCorrect ? 'bg-accent/10 border-accent/30' : 'bg-destructive/10 border-destructive/30'}`}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                        )}
                        <div className="text-left flex-1">
                          <p className="font-medium mb-2">{question.question}</p>
                          <p className="text-sm text-muted-foreground">
                            {isCorrect ? 'Correct!' : `Correct answer: ${question.options[question.correctAnswer]}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  onClick={resetQuiz}
                  variant="secondary"
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry Quiz
                </Button>
                <Button
                  onClick={() => navigate(`/module/${threat.id}`)}
                  variant="secondary"
                  className="flex-1"
                >
                  Review Module
                </Button>
                <Button
                  onClick={() => navigate('/quiz')}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  All Quizzes
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="gradient-cyber border-b border-border/50 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/quiz')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{threat.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-gradient">{threat.name} Quiz</span>
              </h1>
              <p className="text-muted-foreground">Question {currentQuestion + 1} of {quiz.questions.length}</p>
            </div>
          </div>

          <Progress value={progress} className="h-2" />
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 bg-card border-border/50">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{question.question}</h2>
            
            <RadioGroup 
              value={selectedAnswers[currentQuestion]?.toString()} 
              onValueChange={(value) => handleAnswerSelect(parseInt(value))}
              className="space-y-4"
            >
              {question.options.map((option, index) => (
                <div 
                  key={index}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-smooth cursor-pointer ${
                    selectedAnswers[currentQuestion] === index 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={handlePrevious}
                variant="secondary"
                disabled={currentQuestion === 0}
                className="flex-1"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {currentQuestion === quiz.questions.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuizDetail;
