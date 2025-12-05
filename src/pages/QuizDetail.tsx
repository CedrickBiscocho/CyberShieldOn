import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: threat, isLoading: threatLoading } = useThreat(id || '');
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzes(id);
  const saveProgress = useSaveProgress();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const quiz = quizzes?.[0];

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
    
    setScore(correctCount);
    setShowResults(true);

    // Save progress to database only if logged in
    if (user && id) {
      try {
        await saveProgress.mutateAsync({
          threatId: id,
          score: correctCount,
          completed: true,
        });
        toast.success("Quiz completed! Progress saved.");
      } catch (error) {
        console.error('Failed to save progress:', error);
        toast.success("Quiz completed!");
      }
    } else {
      toast.success("Quiz completed! Sign in to save your progress.");
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

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
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
