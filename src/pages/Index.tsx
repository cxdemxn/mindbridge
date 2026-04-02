import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Smile, BookOpen, MessageCircle, TrendingUp, Heart, Phone } from "lucide-react";
import { format } from "date-fns";

const MOOD_EMOJI: Record<string, string> = {
  great: "😊",
  good: "🙂",
  okay: "😐",
  low: "😔",
  bad: "😢",
};

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const name = profile?.preferred_name || profile?.display_name || "there";

  const { data: recentMoods } = useQuery({
    queryKey: ["recent-moods"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(7);
      return data ?? [];
    },
  });

  const { data: journalCount } = useQuery({
    queryKey: ["journal-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const todayMood = recentMoods?.find(
    (m) => format(new Date(m.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );

  return (
    <div className="px-5 pt-12 pb-4 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting()}, {name} 👋
        </h1>
        <p className="text-muted-foreground mt-1">How are you feeling today?</p>
      </div>

      {/* Today's mood status */}
      <Card
        className="p-5 mb-4 rounded-2xl cursor-pointer hover:shadow-md transition-shadow border-border"
        onClick={() => navigate("/mood")}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Today's Mood</p>
            {todayMood ? (
              <p className="text-lg font-semibold text-foreground mt-1">
                {MOOD_EMOJI[todayMood.mood]} Feeling {todayMood.mood}
              </p>
            ) : (
              <p className="text-lg font-semibold text-primary mt-1">Tap to check in</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
            <Smile className="w-6 h-6 text-secondary-foreground" />
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card
          className="p-4 rounded-2xl cursor-pointer hover:shadow-md transition-shadow border-border"
          onClick={() => navigate("/journal")}
        >
          <BookOpen className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground">Write in Journal</p>
          <p className="text-xs text-muted-foreground mt-1">{journalCount} entries</p>
        </Card>

        <Card
          className="p-4 rounded-2xl cursor-pointer hover:shadow-md transition-shadow border-border"
          onClick={() => navigate("/chat")}
        >
          <MessageCircle className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground">Talk to AI Guide</p>
          <p className="text-xs text-muted-foreground mt-1">Wellness companion</p>
        </Card>
      </div>

      {/* Mood Trend */}
      {recentMoods && recentMoods.length > 1 && (
        <Card className="p-5 rounded-2xl mb-4 border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Recent Moods</p>
          </div>
          <div className="flex items-center gap-2">
            {recentMoods.slice(0, 7).reverse().map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-lg">{MOOD_EMOJI[m.mood]}</span>
                <span className="text-[9px] text-muted-foreground">
                  {format(new Date(m.created_at), "EEE")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Find a Therapist CTA */}
      <Card
        className="p-5 rounded-2xl cursor-pointer hover:shadow-md transition-shadow border-border"
        onClick={() => navigate("/therapist")}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center">
            <Heart className="w-5 h-5 text-lavender-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Find a Therapist</p>
            <p className="text-xs text-muted-foreground">Professional support when you need it</p>
          </div>
        </div>
      </Card>

      {/* Crisis Resources */}
      <div className="mt-6 p-4 rounded-2xl bg-secondary/50 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-secondary-foreground">
          <Phone className="w-4 h-4" />
          <span className="font-medium">Crisis? Call or text 988</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Suicide & Crisis Lifeline — available 24/7</p>
      </div>
    </div>
  );
}
