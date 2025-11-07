import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, ScanLine, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { supabase } from "@/integrations/supabase/client";

interface SealEntry {
  id: string;
  sealNumber: string;
}

const Scan = () => {
  const navigate = useNavigate();
  const { flightId, equipmentType } = useParams();
  const { toast } = useToast();
  const [seals, setSeals] = useState<SealEntry[]>([]);
  const [currentSeal, setCurrentSeal] = useState("");
  const [loading, setLoading] = useState(false);

  const equipmentNames: Record<string, string> = {
    "full-trolley": "Full-Size Trolley",
    "half-trolley": "Half-Size Trolley",
    "food-container": "Food Container",
    "service-container": "Service Container",
  };

  // Load existing seals when component mounts
  useEffect(() => {
    const fetchExistingSeals = async () => {
      if (!flightId || !equipmentType) return;

      const { data, error } = await supabase
        .from("seal_scans")
        .select("id, seal_number")
        .eq("flight_id", flightId)
        .eq("equipment_type", equipmentType)
        .order("created_at", { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load existing seals",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        const loadedSeals = data.map((scan) => ({
          id: scan.id,
          sealNumber: scan.seal_number,
        }));
        setSeals(loadedSeals);
      }
    };

    fetchExistingSeals();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('seal-scans-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seal_scans',
          filter: `flight_id=eq.${flightId}`
        },
        () => {
          fetchExistingSeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId, equipmentType]);

  const handleAddSeal = async () => {
    if (currentSeal.trim()) {
      const newSeal = { id: Date.now().toString(), sealNumber: currentSeal };
      setSeals([...seals, newSeal]);
      setCurrentSeal("");
      
      // Save to Supabase immediately
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("seal_scans").insert({
          user_id: user.id,
          flight_id: flightId!,
          equipment_type: equipmentType!,
          seal_number: currentSeal,
        });

        if (error) {
          toast({
            title: "Error",
            description: "Failed to save seal to database",
            variant: "destructive",
          });
          return;
        }
      }
    }
  };

  const handleRemoveSeal = async (id: string, sealNumber: string) => {
    setSeals(seals.filter((seal) => seal.id !== id));
    
    // Remove from Supabase using the actual database ID
    const { error } = await supabase
      .from("seal_scans")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove seal from database",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    toast({
      title: "Data saved",
      description: "All seal information has been recorded",
    });
    
    setLoading(false);
    navigate(`/equipment/${flightId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/equipment/${flightId}`)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <ConnectionStatus />
          </div>
          <h1 className="text-xl font-bold">{equipmentNames[equipmentType!]}</h1>
          <p className="text-sm text-primary-foreground/80">Scan or enter seal numbers</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Add Seal Number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seal-number">Seal Number</Label>
              <div className="flex gap-2">
                <Input
                  id="seal-number"
                  type="text"
                  placeholder="Enter or scan seal number"
                  value={currentSeal}
                  onChange={(e) => setCurrentSeal(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSeal()}
                />
                <Button type="button" variant="outline" size="icon">
                  <ScanLine className="w-4 h-4" />
                </Button>
                <Button type="button" variant="outline" size="icon">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleAddSeal} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Seal
            </Button>
            
            {seals.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Total Seals Scanned</p>
                  <span className="text-lg font-bold text-primary">{seals.length}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Scanned Seal Numbers:</p>
                  <div className="flex flex-wrap gap-2">
                    {seals.map((seal) => (
                      <span
                        key={seal.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-primary/10 text-primary"
                      >
                        {seal.sealNumber}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {seals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recorded Seals ({seals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {seals.map((seal) => (
                  <div
                    key={seal.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-mono font-medium">{seal.sealNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSeal(seal.id, seal.sealNumber)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {seals.length > 0 && (
          <Button onClick={handleSave} className="w-full mt-6" size="lg" disabled={loading}>
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        )}
      </main>
    </div>
  );
};

export default Scan;
