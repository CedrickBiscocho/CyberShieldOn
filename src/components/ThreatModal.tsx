import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Threat } from "@/data/threatsData";
import { useNavigate } from "react-router-dom";

interface ThreatModalProps {
  threat: Threat | null;
  open: boolean;
  onClose: () => void;
}

export const ThreatModal = ({ threat, open, onClose }: ThreatModalProps) => {
  const navigate = useNavigate();

  if (!threat) return null;

  const handleLearnMore = () => {
    onClose();
    navigate(`/module/${threat.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{threat.icon}</span>
            <div>
              <DialogTitle className="text-3xl text-foreground">{threat.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                {threat.summary}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-primary mb-3">What is this threat?</h3>
            <p className="text-foreground/90 leading-relaxed">{threat.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="text-warning">⚠️</span> Key Warning Signs:
            </h4>
            <ul className="space-y-1 text-foreground/80 text-sm">
              {threat.warningSigns.slice(0, 3).map((sign, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {sign}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="text-accent">🛡️</span> Quick Prevention Tips:
            </h4>
            <ul className="space-y-1 text-foreground/80 text-sm">
              {threat.prevention.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleLearnMore} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              Learn More in Detail
            </Button>
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
