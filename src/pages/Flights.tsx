import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, LogOut, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddFlightDialog } from "@/components/AddFlightDialog";
import { ConnectionStatus } from "@/components/ConnectionStatus";

interface Flight {
  id: string;
  flight_number: string;
  destination: string;
  departure_time: string;
  status: "pending" | "completed" | "in-progress";
  user_id: string;
  created_at: string;
  updated_at: string;
}

const Flights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [flights, setFlights] = useState<Flight[]>([]);

  const fetchFlights = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .order("departure_time", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load flights",
        variant: "destructive",
      });
      return;
    }

    setFlights((data || []) as Flight[]);
  };

  useEffect(() => {
    fetchFlights();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('flights-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flights'
        },
        () => {
          fetchFlights();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleDeleteFlight = async (flightId: string) => {
    const { error } = await supabase
      .from("flights")
      .delete()
      .eq("id", flightId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete flight",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Flight deleted successfully",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "in-progress":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="w-6 h-6" />
            <h1 className="text-xl font-bold">Flight Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <Button variant="outline" size="sm" onClick={handleLogout} className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Upcoming Flights</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Manage your flight equipment checks
            </p>
          </div>
          <AddFlightDialog onFlightAdded={fetchFlights} />
        </div>

        <div className="grid gap-4">
          {flights.map((flight) => (
            <Card
              key={flight.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/equipment/${flight.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{flight.flight_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{flight.destination}</p>
                  </div>
                  <Badge className={getStatusColor(flight.status)}>
                    {flight.status.replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {flight.status === "pending" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFlight(flight.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Flight
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Flights;
