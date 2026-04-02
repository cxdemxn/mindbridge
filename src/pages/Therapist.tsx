import { Heart, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Therapist() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-12 pb-4 max-w-lg mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
          <Heart className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Find a Therapist</h1>
        <p className="text-muted-foreground mt-2">Professional support, when you need it</p>
      </div>

      <Card className="p-6 rounded-2xl border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-lavender mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          We're building a curated directory of licensed therapists to help you find the right match. Stay tuned!
        </p>
        <p className="text-xs text-muted-foreground">
          In the meantime, you can visit{" "}
          <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Psychology Today
          </a>{" "}
          to find a therapist near you.
        </p>
      </Card>

      <div className="mt-6 p-4 rounded-2xl bg-secondary/50 text-center">
        <p className="text-sm text-secondary-foreground font-medium">Need immediate help?</p>
        <p className="text-xs text-muted-foreground mt-1">
          Call or text <strong>988</strong> — Suicide & Crisis Lifeline (24/7)
        </p>
      </div>
    </div>
  );
}
