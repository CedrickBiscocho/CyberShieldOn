import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThreatCard } from "@/components/ThreatCard";
import { ThreatModal } from "@/components/ThreatModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useThreats, Threat } from "@/hooks/useThreats";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, AlertTriangle, Users, Database, Eye } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { data: threats, isLoading } = useThreats();
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleThreatClick = (threat: Threat) => {
    setSelectedThreat(threat);
    setModalOpen(true);
  };

  const whyMatters = [
    { icon: <Lock className="h-8 w-8" />, text: "90% of breaches involve stolen credentials" },
    { icon: <AlertTriangle className="h-8 w-8" />, text: "1 in 4 people click phishing links" },
    { icon: <Users className="h-8 w-8" />, text: "Human error causes 95% of security incidents" },
    { icon: <Database className="h-8 w-8" />, text: "$4.45M average cost of a data breach" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-cyber border-b border-border/50">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-center mb-6">
              <Shield className="h-20 w-20 text-primary animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-gradient">CyberShieldOn</span>
            </h1>
            <p className="text-2xl md:text-3xl text-primary font-semibold">
              Strong Defense Against Online Threats
            </p>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Master cybersecurity fundamentals through interactive lessons and hands-on quizzes. 
              Learn to identify, prevent, and defend against the most common cyber threats.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/modules')}
                className="text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              >
                <Eye className="mr-2 h-5 w-5" />
                Explore Modules
              </Button>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/quiz')}
                className="text-lg px-8 py-6"
              >
                Test Your Knowledge
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Cybersecurity Matters */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          <span className="text-gradient">Why Cybersecurity Matters</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyMatters.map((item, index) => (
            <Card 
              key={index} 
              className="p-6 bg-card border-border/50 hover:border-primary/50 transition-smooth hover:shadow-glow text-center space-y-4"
            >
              <div className="flex justify-center text-primary">
                {item.icon}
              </div>
              <p className="text-sm text-foreground/90 font-medium">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Threat Cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Learn About Cyber Threats</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Click on any threat card to discover how it works, warning signs to watch for, 
            and proven prevention strategies.
          </p>
        </div>
        {isLoading ? (
          <div className="text-center py-12">Loading threats...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {threats?.map((threat) => (
              <ThreatCard 
                key={threat.id} 
                threat={threat} 
                onClick={() => handleThreatClick(threat)}
              />
            ))}
          </div>
        )}
      </section>

      <ThreatModal 
        threat={selectedThreat} 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />

      <Footer />
    </div>
  );
};

export default Home;
