import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Trophy, Medal, Award, User, BookOpen, HelpCircle } from "lucide-react";

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case 2:
        return "bg-gray-400/10 text-gray-400 border-gray-400/20";
      case 3:
        return "bg-amber-600/10 text-amber-600 border-amber-600/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              See how you rank among other learners
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Top Learners
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-grow">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Failed to load leaderboard. Please try again later.
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        entry.user_id === user?.id
                          ? "bg-primary/5 border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-center w-10">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {entry.username}
                          {entry.user_id === user?.id && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {entry.modules_completed} modules
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {entry.quizzes_completed} quizzes
                          </span>
                        </div>
                      </div>

                      <Badge variant="outline" className={getRankBadgeClass(entry.rank)}>
                        {entry.total_score} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data yet.</p>
                  <p className="text-sm">Complete modules and quizzes to appear here!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
