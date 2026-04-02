import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, X, BookOpen } from "lucide-react";

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: entries } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !content.trim()) return;
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: title || null,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Entry saved! 📝" });
      setTitle("");
      setContent("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-count"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="px-5 pt-12 pb-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
          <p className="text-muted-foreground text-sm">Your private space to reflect.</p>
        </div>
        <Button
          size="icon"
          className="rounded-xl"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 rounded-2xl mb-6 border-border animate-slide-up">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="rounded-xl mb-3 border-0 bg-muted text-sm font-medium"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today..."
            className="rounded-xl resize-none border-0 bg-muted min-h-[150px]"
            autoFocus
          />
          <Button
            onClick={() => mutation.mutate()}
            disabled={!content.trim() || mutation.isPending}
            className="w-full rounded-xl h-10 mt-3"
          >
            {mutation.isPending ? "Saving..." : "Save Entry"}
          </Button>
        </Card>
      )}

      {entries && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="p-4 rounded-2xl border-border">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {entry.title || "Untitled"}
                </h3>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {format(new Date(entry.created_at), "MMM d")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
            </Card>
          ))}
        </div>
      ) : !showForm ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No entries yet</p>
          <p className="text-sm text-muted-foreground/60">Tap + to write your first journal entry</p>
        </div>
      ) : null}
    </div>
  );
}
