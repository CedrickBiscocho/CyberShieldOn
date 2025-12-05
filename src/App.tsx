import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Modules from "./pages/Modules";
import ModuleDetail from "./pages/ModuleDetail";
import Quiz from "./pages/Quiz";
import QuizDetail from "./pages/QuizDetail";
import Auth from "./pages/Auth";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/module/:id" element={<ModuleDetail />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/:id" element={<QuizDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signin" element={<Auth />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
