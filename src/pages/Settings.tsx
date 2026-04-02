import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Heart } from "lucide-react";

export default function Settings() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.preferred_name || profile?.display_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_name: name, display_name: name })
      .eq("user_id", profile.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved! ✨" });
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="px-5 pt-12 pb-4 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Settings</h1>

      <Card className="p-5 rounded-2xl mb-4 border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
            <User className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Profile</p>
            <p className="text-xs text-muted-foreground">Update your display name</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl"
          />
          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      <Card className="p-5 rounded-2xl mb-4 border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center">
            <Heart className="w-5 h-5 text-lavender-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">About MindBridge</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          MindBridge is a wellness companion designed to help you track your mood, journal your thoughts, and find moments of calm. It is not a medical device and is not a substitute for professional mental health treatment.
        </p>
      </Card>

      <Button
        variant="outline"
        onClick={signOut}
        className="w-full rounded-xl h-12 text-destructive hover:text-destructive"
      >
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
