import { Card } from "@/components/ui/card";
import { Threat } from "@/data/threatsData";

interface ThreatCardProps {
  threat: Threat;
  onClick: () => void;
}

export const ThreatCard = ({ threat, onClick }: ThreatCardProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'social': return 'from-warning/20 to-warning/5';
      case 'technical': return 'from-destructive/20 to-destructive/5';
      case 'network': return 'from-primary/20 to-primary/5';
      default: return 'from-muted/20 to-muted/5';
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${getCategoryColor(threat.category)} cursor-pointer transition-smooth hover:scale-105 hover:border-primary/50 hover:shadow-glow`}
    >
      <div className="p-6 space-y-4">
        <div className="text-5xl">{threat.icon}</div>
        <div>
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-smooth">
            {threat.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {threat.summary}
          </p>
        </div>
        <div className="text-xs text-primary uppercase tracking-wider">
          Click to learn more →
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-smooth" />
    </Card>
  );
};
