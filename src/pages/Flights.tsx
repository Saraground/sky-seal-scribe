import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, LogOut, Clock, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddFlightDialog } from "@/components/AddFlightDialog";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [flightToDelete, setFlightToDelete] = useState<string | null>(null);
  const [sealCounts, setSealCounts] = useState<Record<string, number>>({});

  const fetchFlights = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    // Calculate timestamp for 6 hours ago
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .gte("created_at", sixHoursAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load flights",
        variant: "destructive",
      });
      return;
    }

    setFlights((data || []) as Flight[]);
    
    // Fetch seal counts for all flights
    if (data && data.length > 0) {
      const { data: sealData } = await supabase
        .from("seal_scans")
        .select("flight_id");
      
      if (sealData) {
        const counts: Record<string, number> = {};
        sealData.forEach(scan => {
          counts[scan.flight_id] = (counts[scan.flight_id] || 0) + 1;
        });
        setSealCounts(counts);
      }
    }
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

  const handleDeleteFlight = async () => {
    if (!flightToDelete) return;

    const { error } = await supabase
      .from("flights")
      .delete()
      .eq("id", flightToDelete);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete flight",
        variant: "destructive",
      });
      setFlightToDelete(null);
      return;
    }

    toast({
      title: "Success",
      description: "Flight deleted successfully",
    });
    setFlightToDelete(null);
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
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
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

        <div className="grid gap-4 max-h-[40vh] overflow-y-auto">
          {flights.map((flight) => (
            <Card
              key={flight.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/equipment/${flight.id}`)}
            >
              <CardHeader className="pb-2 py-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{flight.flight_number}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{flight.destination}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(flight.status)}>
                      {flight.status.replace("-", " ")}
                    </Badge>
                    {flight.status === "pending" && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlightToDelete(flight.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2 py-1">
                <p className="text-xs text-muted-foreground">
                  Total Seals Scanned: <span className="font-semibold text-foreground">{sealCounts[flight.id] || 0}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <AlertDialog open={!!flightToDelete} onOpenChange={(open) => !open && setFlightToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this flight and all associated seal scan records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFlight} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Flights;
