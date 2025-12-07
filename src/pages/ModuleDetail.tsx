import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useThreat, useThreats } from "@/hooks/useThreats";
import { useModuleProgress, useSaveModuleProgress } from "@/hooks/useModuleProgress";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Brain } from "lucide-react";
import { saveSessionModuleProgress, getSessionModuleProgress } from "@/utils/sessionProgress";
import { saveLocalModuleProgress, getLocalModuleProgress } from "@/utils/localProgress";

const ModuleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: threat, isLoading: threatLoading } = useThreat(id || '');
  const { data: allThreats } = useThreats();
  const { data: savedProgress } = useModuleProgress(id);
  const { saveProgress } = useSaveModuleProgress();
  
  // Local state for THIS module only - keyed by id
  const [scrollProgress, setScrollProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentModuleIdRef = useRef<string | undefined>(id);

  // Reset and scroll to top when module changes
  useEffect(() => {
    // Clear any pending saves for the previous module
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Update the current module ref
    currentModuleIdRef.current = id;
    
    // Reset state for new module
    setScrollProgress(0);
    setMaxProgress(0);
    setIsReady(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Delay ready state to let DOM settle
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, [id]);

  // Load saved progress after ready - only increase, never decrease
  useEffect(() => {
    if (!isReady || !id) return;
    
    // For logged-in users, use database progress
    if (savedProgress?.progress_percentage !== undefined) {
      setMaxProgress(prev => Math.max(prev, savedProgress.progress_percentage));
    } else if (!user) {
      // For guests, load from both session memory and localStorage
      const sessionProgress = getSessionModuleProgress(id);
      const localProgress = getLocalModuleProgress(id);
      const bestProgress = Math.max(sessionProgress, localProgress);
      if (bestProgress > 0) {
        setMaxProgress(prev => Math.max(prev, bestProgress));
      }
    }
  }, [savedProgress, isReady, id, user]);

  // Window scroll tracking
  useEffect(() => {
    if (!isReady || !contentRef.current || !id) return;

    const handleScroll = () => {
      const content = contentRef.current;
      if (!content) return;

      const contentRect = content.getBoundingClientRect();
      const contentTop = content.offsetTop;
      const contentHeight = content.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate how much of the content has been scrolled past
      const scrolledPast = scrollY + viewportHeight - contentTop;
      const totalScrollable = contentHeight;
      
      if (totalScrollable <= 0) return;

      const currentProgress = Math.round((scrolledPast / totalScrollable) * 100);
      const clampedProgress = Math.min(100, Math.max(0, currentProgress));
      
      setScrollProgress(clampedProgress);
      
      setMaxProgress(prev => {
        const newMax = Math.max(prev, clampedProgress);
        
        if (newMax > prev && currentModuleIdRef.current === id) {
          // For guests, save to both session memory and localStorage
          if (!user) {
            saveSessionModuleProgress(id, newMax);
            saveLocalModuleProgress(id, newMax);
          }
          
          // Save to database if user is logged in
          if (user) {
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
            }
            const moduleToSave = id; // Capture current id
            saveTimeoutRef.current = setTimeout(() => {
              // Double-check we're still on the same module
              if (currentModuleIdRef.current === moduleToSave) {
                saveProgress(moduleToSave, newMax);
              }
            }, 1000);
          }
        }
        
        return newMax;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial calculation after mount
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, user, saveProgress, isReady]);

  // Save progress on unmount - use ref to get latest values
  const maxProgressRef = useRef(maxProgress);
  maxProgressRef.current = maxProgress;
  
  useEffect(() => {
    const moduleId = id;
    return () => {
      // Clear any pending timeouts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save final progress for this specific module
      if (moduleId && maxProgressRef.current > 0) {
        // For guests, save to both session memory and localStorage
        if (!user) {
          saveSessionModuleProgress(moduleId, maxProgressRef.current);
          saveLocalModuleProgress(moduleId, maxProgressRef.current);
        }
        // Save to database if logged in
        if (user) {
          saveProgress(moduleId, maxProgressRef.current);
        }
      }
    };
  }, [user, id, saveProgress]);

  if (threatLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div>Loading module...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!threat) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Module not found</h1>
          <Button onClick={() => navigate("/modules")}>Back to Modules</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const currentIndex = allThreats?.findIndex(t => t.id === id) ?? -1;
  const previousThreat = currentIndex > 0 && allThreats ? allThreats[currentIndex - 1] : null;
  const nextThreat = allThreats && currentIndex < allThreats.length - 1 ? allThreats[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="gradient-cyber border-b border-border/50 py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/modules')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Modules
          </Button>
          <div className="flex items-start gap-6">
            <span className="text-7xl">{threat.icon}</span>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">{threat.name}</span>
              </h1>
              <p className="text-lg text-foreground/80 mb-4">{threat.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Progress</span>
                  <span className="text-primary font-semibold">{maxProgress}%</span>
                </div>
                <Progress value={maxProgress} className="h-2" />
                {!user && (
                  <p className="text-xs text-muted-foreground">
                    <button 
                      onClick={() => navigate('/auth')} 
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </button>
                    {' '}to save your progress
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={contentRef} className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Why It Matters */}
          {threat.whyItMatters && (
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20" data-section="why-it-matters">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">💡</span>
                Why It Matters
              </h2>
              <p className="text-foreground/90 leading-relaxed text-lg">{threat.whyItMatters}</p>
            </Card>
          )}

          {/* Real-World Example */}
          {threat.realWorldExample && (
            <Card className="p-6 bg-gradient-to-r from-muted/50 to-muted/30 border-border/50" data-section="real-world-example">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">📖</span>
                Real-World Example
              </h2>
              <p className="text-foreground/80 leading-relaxed italic">{threat.realWorldExample}</p>
            </Card>
          )}

          {/* How It Works */}
          <Card className="p-6 bg-card border-border/50" data-section="0">
            <h2 className="text-2xl font-bold mb-4 text-primary">How the Attack Works</h2>
            {threat.howItWorksIntro && (
              <p className="text-foreground/80 mb-6 leading-relaxed">{threat.howItWorksIntro}</p>
            )}
            <h3 className="text-lg font-semibold mb-3 text-foreground/90">Key Steps:</h3>
            <ol className="space-y-3">
              {threat.howItWorks.slice(0, 5).map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <p className="text-foreground/90 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </Card>

          {/* Warning Signs */}
          <Card className="p-6 gradient-threat border-border/50" data-section="1">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-3xl">⚠️</span>
              Warning Signs to Watch For
            </h2>
            {threat.warningSignsIntro && (
              <p className="text-foreground/80 mb-6 leading-relaxed">{threat.warningSignsIntro}</p>
            )}
            <h3 className="text-lg font-semibold mb-3 text-foreground/90">Key Indicators:</h3>
            <ul className="space-y-3">
              {threat.warningSigns.slice(0, 5).map((sign, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-warning text-xl flex-shrink-0">•</span>
                  <p className="text-foreground/90">{sign}</p>
                </li>
              ))}
            </ul>
          </Card>

          {/* Prevention Methods */}
          <Card className="p-6 gradient-safe border-border/50" data-section="2">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-3xl">🛡️</span>
              Prevention & Protection
            </h2>
            {threat.preventionIntro && (
              <p className="text-foreground/80 mb-6 leading-relaxed">{threat.preventionIntro}</p>
            )}
            <h3 className="text-lg font-semibold mb-3 text-foreground/90">Key Prevention Tips:</h3>
            <ul className="space-y-3">
              {threat.prevention.slice(0, 5).map((method, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-accent text-xl flex-shrink-0">✓</span>
                  <p className="text-foreground/90">{method}</p>
                </li>
              ))}
            </ul>
          </Card>

          {/* References & Sources */}
          {threat.source_references && threat.source_references.length > 0 && (
            <Card className="p-6 bg-card border-border/50" data-section="references">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">📚</span>
                References & Sources
              </h2>
              <ul className="space-y-2">
                {threat.source_references.map((ref, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <a 
                      href={ref.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {ref.title || ref.url}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Quiz Button */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30" data-section="3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Ready to test your knowledge?</h3>
                <p className="text-sm text-muted-foreground">Take the quiz to reinforce what you've learned</p>
              </div>
              <Button 
                onClick={() => navigate(`/quiz/${threat.id}`)}
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Brain className="h-5 w-5" />
                Start Quiz
              </Button>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            {previousThreat ? (
              <Button
                variant="secondary"
                onClick={() => navigate(`/module/${previousThreat.id}`)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {previousThreat.name}
              </Button>
            ) : <div />}
            
            {nextThreat && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/module/${nextThreat.id}`)}
                className="gap-2"
              >
                {nextThreat.name}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ModuleDetail;
