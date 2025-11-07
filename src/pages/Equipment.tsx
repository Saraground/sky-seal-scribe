import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Box, Container, Eye, Printer } from "lucide-react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { supabase } from "@/integrations/supabase/client";

const equipmentTypes = [
  {
    id: "full-trolley",
    name: "Full-Size Trolley",
    description: "2 doors, requires 2 seals",
    icon: Box,
    sealCount: 2,
  },
  {
    id: "half-trolley",
    name: "Half-Size Trolley",
    description: "1 door, requires 1 seal",
    icon: Box,
    sealCount: 1,
  },
  {
    id: "food-container",
    name: "Food Container",
    description: "1 door, requires 1 seal",
    icon: Container,
    sealCount: 1,
  },
  {
    id: "service-container",
    name: "Service Container",
    description: "1 door, requires 1 seal",
    icon: Container,
    sealCount: 1,
  },
];

const Equipment = () => {
  const navigate = useNavigate();
  const { flightId } = useParams();
  const [sealCounts, setSealCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchSealCounts = async () => {
      if (!flightId) return;

      const { data, error } = await supabase
        .from("seal_scans")
        .select("equipment_type")
        .eq("flight_id", flightId);

      if (error || !data) return;

      const counts: Record<string, number> = {};
      data.forEach((scan) => {
        counts[scan.equipment_type] = (counts[scan.equipment_type] || 0) + 1;
      });
      setSealCounts(counts);
    };

    fetchSealCounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('seal-scans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seal_scans',
          filter: `flight_id=eq.${flightId}`
        },
        () => {
          fetchSealCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/flights")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flights
            </Button>
            <ConnectionStatus />
          </div>
          <h1 className="text-xl font-bold">Select Equipment Type</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {equipmentTypes.map((equipment) => {
            const Icon = equipment.icon;
            return (
              <Card
                key={equipment.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/scan/${flightId}/${equipment.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{equipment.name}</CardTitle>
                      <CardDescription>{equipment.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Seals required: <span className="font-semibold text-foreground">{equipment.sealCount}</span>
                    </p>
                    <p className="text-sm font-semibold text-blue-500">
                      {sealCounts[equipment.id] || 0} scanned
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => navigate(`/preview/${flightId}`)}
          >
            <Eye className="w-4 h-4" />
            Preview Report
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              navigate(`/preview/${flightId}`);
              setTimeout(() => window.print(), 500);
            }}
          >
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Equipment;
