import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, BookOpen, Brain, LogIn, LogOut, Trophy, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <Shield className="h-8 w-8 text-primary group-hover:text-accent transition-smooth" />
            <div>
              <h1 className="text-xl font-bold text-gradient">CyberShieldOn</h1>
              <p className="text-xs text-muted-foreground">Strong Defense Against Online Threats</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant={isActive('/modules') ? 'default' : 'ghost'}
              onClick={() => navigate('/modules')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Modules
            </Button>
            <Button
              variant={isActive('/quiz') ? 'default' : 'ghost'}
              onClick={() => navigate('/quiz')}
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              Quizzes
            </Button>
            {user && (
              <Button
                variant={isActive('/leaderboard') ? 'default' : 'ghost'}
                onClick={() => navigate('/leaderboard')}
                className="gap-2"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Button>
            )}
            {user ? (
              <Button
                variant="secondary"
                onClick={handleSignOut}
                className="gap-2 ml-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="gap-2 ml-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </nav>

          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                    className="justify-start gap-2"
                  >
                    <Shield className="h-4 w-4" /> Home
                  </Button>
                  <Button
                    variant={isActive('/modules') ? 'default' : 'ghost'}
                    onClick={() => { navigate('/modules'); setMobileMenuOpen(false); }}
                    className="justify-start gap-2"
                  >
                    <BookOpen className="h-4 w-4" /> Modules
                  </Button>
                  <Button
                    variant={isActive('/quiz') ? 'default' : 'ghost'}
                    onClick={() => { navigate('/quiz'); setMobileMenuOpen(false); }}
                    className="justify-start gap-2"
                  >
                    <Brain className="h-4 w-4" /> Quizzes
                  </Button>
                  {user && (
                    <Button
                      variant={isActive('/leaderboard') ? 'default' : 'ghost'}
                      onClick={() => { navigate('/leaderboard'); setMobileMenuOpen(false); }}
                      className="justify-start gap-2"
                    >
                      <Trophy className="h-4 w-4" /> Leaderboard
                    </Button>
                  )}
                  <div className="border-t border-border my-2" />
                  {user ? (
                    <Button
                      variant="secondary"
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                      className="justify-start gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                      className="justify-start gap-2"
                    >
                      <LogIn className="h-4 w-4" /> Sign In
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
