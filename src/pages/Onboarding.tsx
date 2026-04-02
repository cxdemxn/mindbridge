import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, ChevronRight, Sparkles, BookOpen, Brain, Sun, Moon, Coffee, Dumbbell } from "lucide-react";

const GOALS = [
  { id: "reduce-anxiety", label: "Reduce Anxiety", icon: Brain },
  { id: "better-sleep", label: "Better Sleep", icon: Moon },
  { id: "mindfulness", label: "Practice Mindfulness", icon: Sparkles },
  { id: "journaling", label: "Start Journaling", icon: BookOpen },
  { id: "self-care", label: "More Self-Care", icon: Sun },
  { id: "exercise", label: "Exercise More", icon: Dumbbell },
  { id: "routine", label: "Build Routines", icon: Coffee },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [preferredName, setPreferredName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        preferred_name: preferredName || null,
        goals: selectedGoals,
        onboarding_completed: true,
      })
      .eq("user_id", user.id);
    await refreshProfile();
    navigate("/");
  };

  const steps = [
    // Welcome
    <div key="welcome" className="text-center space-y-6 animate-fade-in">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary">
        <Heart className="w-10 h-10 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Welcome to MindBridge</h1>
      <p className="text-muted-foreground leading-relaxed">
        A safe space to track your feelings, reflect on your day, and find calm whenever you need it.
      </p>
      <p className="text-xs text-muted-foreground px-4">
        MindBridge is not a medical device and is not a substitute for professional mental health treatment.
      </p>
      <Button onClick={() => setStep(1)} className="rounded-xl h-12 px-8">
        Get Started <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>,

    // Name
    <div key="name" className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">What should we call you?</h2>
        <p className="text-muted-foreground mt-2">This helps make your experience feel more personal.</p>
      </div>
      <Input
        value={preferredName}
        onChange={(e) => setPreferredName(e.target.value)}
        placeholder="Your preferred name"
        className="rounded-xl h-12 text-center text-lg"
        autoFocus
      />
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-xl h-12">Back</Button>
        <Button onClick={() => setStep(2)} className="flex-1 rounded-xl h-12">
          {preferredName ? "Continue" : "Skip"} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>,

    // Goals
    <div key="goals" className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">What are your goals?</h2>
        <p className="text-muted-foreground mt-2">Select as many as you'd like. You can change these later.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => toggleGoal(id)}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium text-left ${
              selectedGoals.includes(id)
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border bg-card text-card-foreground hover:border-primary/30"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl h-12">Back</Button>
        <Button onClick={handleComplete} className="flex-1 rounded-xl h-12">
          Let's Go! <Sparkles className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
        {steps[step]}
      </div>
    </div>
  );
}
