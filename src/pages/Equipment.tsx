import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Box, Container, Eye, Printer, ScanLine, Camera, Truck } from "lucide-react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
const equipmentTypes = [{
  id: "full-trolley",
  name: "Full-Size Trolley",
  description: "2 doors, requires 2 seals",
  icon: Box,
  sealCount: 2
}, {
  id: "half-trolley",
  name: "Half-Size Trolley",
  description: "1 door, requires 1 seal",
  icon: Box,
  sealCount: 1
}, {
  id: "food-container",
  name: "Food Container",
  description: "1 door, requires 1 seal",
  icon: Container,
  sealCount: 1
}, {
  id: "service-container",
  name: "Service Container",
  description: "1 door, requires 1 seal",
  icon: Container,
  sealCount: 1
}];
const Equipment = () => {
  const navigate = useNavigate();
  const {
    flightId
  } = useParams();
  const {
    toast
  } = useToast();
  const [sealCounts, setSealCounts] = useState<Record<string, number>>({});
  const [hilift1Seal, setHilift1Seal] = useState("");
  const [hilift2Seal, setHilift2Seal] = useState("");
  const [hilift1Number, setHilift1Number] = useState("");
  const [hilift2Number, setHilift2Number] = useState("");
  const [hilift1SealInput, setHilift1SealInput] = useState("");
  const [hilift2SealInput, setHilift2SealInput] = useState("");
  const [hilift1NumberInput, setHilift1NumberInput] = useState("");
  const [hilift2NumberInput, setHilift2NumberInput] = useState("");
  const [hilift1DialogOpen, setHilift1DialogOpen] = useState(false);
  const [hilift2DialogOpen, setHilift2DialogOpen] = useState(false);
  useEffect(() => {
    const fetchSealCounts = async () => {
      if (!flightId) return;
      const {
        data,
        error
      } = await supabase.from("seal_scans").select("equipment_type").eq("flight_id", flightId);
      if (error || !data) return;
      const counts: Record<string, number> = {};
      data.forEach(scan => {
        counts[scan.equipment_type] = (counts[scan.equipment_type] || 0) + 1;
      });
      setSealCounts(counts);
    };
    const fetchHiliftData = async () => {
      if (!flightId) return;
      const {
        data
      } = await supabase.from("flights").select("hilift_1_seal, hilift_2_seal, hilift_1_number, hilift_2_number").eq("id", flightId).single();
      if (data) {
        setHilift1Seal(data.hilift_1_seal || "");
        setHilift2Seal(data.hilift_2_seal || "");
        setHilift1Number(data.hilift_1_number || "");
        setHilift2Number(data.hilift_2_number || "");
      }
    };
    fetchSealCounts();
    fetchHiliftData();

    // Subscribe to realtime updates
    const channel = supabase.channel('seal-scans-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'seal_scans',
      filter: `flight_id=eq.${flightId}`
    }, () => {
      fetchSealCounts();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId]);
  const handleSaveHilift1 = async () => {
    const {
      error
    } = await supabase.from("flights").update({
      hilift_1_seal: hilift1SealInput,
      hilift_1_number: hilift1NumberInput
    }).eq("id", flightId!);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save Hi-Lift 1 data",
        variant: "destructive"
      });
      return;
    }
    setHilift1Seal(hilift1SealInput);
    setHilift1Number(hilift1NumberInput);
    setHilift1SealInput("");
    setHilift1NumberInput("");
    setHilift1DialogOpen(false);
    toast({
      title: "Success",
      description: "Hi-Lift 1 data saved"
    });
  };
  const handleSaveHilift2 = async () => {
    const {
      error
    } = await supabase.from("flights").update({
      hilift_2_seal: hilift2SealInput,
      hilift_2_number: hilift2NumberInput
    }).eq("id", flightId!);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save Hi-Lift 2 data",
        variant: "destructive"
      });
      return;
    }
    setHilift2Seal(hilift2SealInput);
    setHilift2Number(hilift2NumberInput);
    setHilift2SealInput("");
    setHilift2NumberInput("");
    setHilift2DialogOpen(false);
    toast({
      title: "Success",
      description: "Hi-Lift 2 data saved"
    });
  };
  return <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/flights")} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flights
            </Button>
            <ConnectionStatus />
          </div>
          <h1 className="text-xl font-bold">Select Equipment Type</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3 space-y-1">
        <div className="grid gap-1 md:grid-cols-2">
          {equipmentTypes.map(equipment => {
          const Icon = equipment.icon;
          return <Card key={equipment.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/scan/${flightId}/${equipment.id}`)}>
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{equipment.name}</CardTitle>
                      <CardDescription className="text-xs">{equipment.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Seals required: <span className="font-semibold text-foreground">{equipment.sealCount}</span>
                    </p>
                    <p className="text-xs font-semibold text-blue-500">
                      {sealCounts[equipment.id] || 0} scanned
                    </p>
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Hi-Lift Seals Section */}
        <div className="grid gap-1 grid-cols-2 mt-1">
          <Dialog open={hilift1DialogOpen} onOpenChange={setHilift1DialogOpen}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Hi-Lift 1</CardTitle>
                      <CardDescription className="text-xs">Scan seal number</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <p className="text-xs font-semibold text-blue-500">
                    {hilift1Number && hilift1Seal ? `#${hilift1Number} - Seal: ${hilift1Seal}` : hilift1Number ? `#${hilift1Number}` : hilift1Seal ? `Seal: ${hilift1Seal}` : "Not configured"}
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Hi-Lift 1</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="hilift1-number">Hi-Lift Number</Label>
                  <Input id="hilift1-number" type="text" placeholder="Enter Hi-Lift number" value={hilift1NumberInput} onChange={e => setHilift1NumberInput(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSaveHilift1()} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hilift1-seal">Hi-Lift Seal Number</Label>
                  <Input id="hilift1-seal" type="text" placeholder="Enter seal number" value={hilift1SealInput} onChange={e => setHilift1SealInput(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSaveHilift1()} />
                </div>
                <Button onClick={handleSaveHilift1} className="w-full">
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={hilift2DialogOpen} onOpenChange={setHilift2DialogOpen}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-md transition-shadow cursor-pointer px-0 py-0">
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Hi-Lift 2</CardTitle>
                      <CardDescription className="text-xs">Scan seal number</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <p className="text-xs font-semibold text-blue-500">
                    {hilift2Number && hilift2Seal ? `#${hilift2Number} - Seal: ${hilift2Seal}` : hilift2Number ? `#${hilift2Number}` : hilift2Seal ? `Seal: ${hilift2Seal}` : "Not configured"}
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Hi-Lift 2</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="hilift2-number">Hi-Lift Number</Label>
                  <Input id="hilift2-number" type="text" placeholder="Enter Hi-Lift number" value={hilift2NumberInput} onChange={e => setHilift2NumberInput(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSaveHilift2()} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hilift2-seal">Hi-Lift Seal Number</Label>
                  <Input id="hilift2-seal" type="text" placeholder="Enter seal number" value={hilift2SealInput} onChange={e => setHilift2SealInput(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSaveHilift2()} />
                </div>
                <Button onClick={handleSaveHilift2} className="w-full">
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-1 mt-1">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/preview/${flightId}`)}>
            <Eye className="w-4 h-4" />
            Preview Report
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => {
          navigate(`/preview/${flightId}`);
          setTimeout(() => window.print(), 500);
        }}>
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </main>
    </div>;
};
export default Equipment;