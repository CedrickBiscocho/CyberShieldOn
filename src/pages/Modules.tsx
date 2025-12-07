import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useThreats } from "@/hooks/useThreats";
import { useAllModuleProgress } from "@/hooks/useModuleProgress";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { BookOpen, Filter } from "lucide-react";
import { getSessionModuleProgress } from "@/utils/sessionProgress";

const Modules = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'social' | 'technical' | 'network'>('all');
  const { data: threats, isLoading } = useThreats();
  const { data: allProgress } = useAllModuleProgress();

  const filteredThreats = filter === 'all' 
    ? threats || []
    : threats?.filter(t => t.category === filter) || [];

  const getModuleProgress = (moduleId: string) => {
    // For logged-in users, use database progress
    if (user && allProgress) {
      const progress = allProgress.find(p => p.module_id === moduleId);
      return progress?.progress_percentage || 0;
    }
    // For guests, use session memory (resets on reload)
    return getSessionModuleProgress(moduleId);
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      social: { color: 'bg-warning/20 text-warning border-warning/30', label: 'Social Engineering' },
      technical: { color: 'bg-destructive/20 text-destructive border-destructive/30', label: 'Technical' },
      network: { color: 'bg-primary/20 text-primary border-primary/30', label: 'Network' }
    };
    return badges[category as keyof typeof badges];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="gradient-cyber border-b border-border/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Learning Modules</span>
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Deep dive into each cyber threat with comprehensive lessons, real-world examples, 
            and actionable prevention strategies.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <Button
            variant={filter === 'all' ? 'default' : 'secondary'}
            onClick={() => setFilter('all')}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            All Threats
          </Button>
          <Button
            variant={filter === 'social' ? 'default' : 'secondary'}
            onClick={() => setFilter('social')}
          >
            Social Engineering
          </Button>
          <Button
            variant={filter === 'technical' ? 'default' : 'secondary'}
            onClick={() => setFilter('technical')}
          >
            Technical
          </Button>
          <Button
            variant={filter === 'network' ? 'default' : 'secondary'}
            onClick={() => setFilter('network')}
          >
            Network
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading modules...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {filteredThreats.map((threat) => {
              const badge = getCategoryBadge(threat.category);
              const progress = getModuleProgress(threat.id);
              return (
                <Card 
                  key={threat.id}
                  className="p-6 bg-card border-border/50 hover:border-primary/50 transition-smooth hover:shadow-glow space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <span className="text-5xl">{threat.icon}</span>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">{threat.name}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-foreground/80 line-clamp-2">{threat.summary || threat.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-primary">What you'll learn:</h4>
                    <ul className="text-sm text-foreground/70 space-y-1">
                      <li>• How the attack works</li>
                      <li>• Warning signs to identify threats</li>
                      <li>• Prevention and protection methods</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => navigate(`/module/${threat.id}`)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                  </Button>
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

export default Modules;
