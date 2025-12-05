import { Shield } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/30 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <div className="text-sm">
              <p className="font-bold text-gradient">CyberShieldOn</p>
              <p className="text-muted-foreground text-xs">Empowering digital safety education</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground mb-1">
              Developed by the CyberShieldOn Team
              : CEDRICK
              , KENT
              , RED
              , RYU
              , JP
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 CyberShieldOn. Educational platform for cybersecurity awareness.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
