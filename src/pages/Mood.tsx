import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type MoodType = Database["public"]["Enums"]["mood_type"];

const MOODS: { value: MoodType; emoji: string; label: string }[] = [
  { value: "great", emoji: "😊", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "low", emoji: "😔", label: "Low" },
  { value: "bad", emoji: "😢", label: "Bad" },
];

const ACTIVITIES = [
  "Exercise", "Work", "Social", "Nature", "Reading",
  "Meditation", "Family", "Cooking", "Music", "Rest",
];

export default function Mood() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState("");
  const [activities, setActivities] = useState<string[]>([]);

  const { data: entries } = useQuery({
    queryKey: ["mood-entries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedMood) return;
      const { error } = await supabase.from("mood_entries").insert({
        user_id: user.id,
        mood: selectedMood,
        note: note || null,
        activities,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mood logged! 🌟" });
      setSelectedMood(null);
      setNote("");
      setActivities([]);
      queryClient.invalidateQueries({ queryKey: ["mood-entries"] });
      queryClient.invalidateQueries({ queryKey: ["recent-moods"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActivity = (a: string) => {
    setActivities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  return (
    <div className="px-5 pt-12 pb-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-2xl font-semibold text-foreground mb-2">How are you?</h1>
      <p className="text-muted-foreground mb-6">Take a moment to check in with yourself.</p>

      {/* Mood Selector */}
      <div className="flex justify-between mb-6">
        {MOODS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => setSelectedMood(value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
              selectedMood === value
                ? "bg-secondary scale-110 shadow-sm"
                : "hover:bg-muted"
            }`}
          >
            <span className="text-3xl">{emoji}</span>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>

      {selectedMood && (
        <div className="space-y-4 animate-fade-in">
          {/* Activities */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">What have you been doing?</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleActivity(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activities.includes(a)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Any thoughts? (optional)</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full rounded-xl h-12"
          >
            {mutation.isPending ? "Saving..." : "Log Mood"}
          </Button>
        </div>
      )}

      {/* History */}
      {entries && entries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Recent Check-ins</h2>
          <div className="space-y-2">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-3 rounded-xl border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {MOODS.find((m) => m.value === entry.mood)?.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{entry.mood}</p>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground truncate">{entry.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(entry.created_at), "MMM d")}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
