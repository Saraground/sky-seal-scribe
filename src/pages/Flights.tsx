import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, LogOut, Clock } from "lucide-react";

interface Flight {
  id: string;
  flightNumber: string;
  destination: string;
  departureTime: string;
  status: "pending" | "completed" | "in-progress";
}

const Flights = () => {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
      return;
    }

    // Generate mock flights ±6 hours from current time
    const now = new Date();
    const mockFlights: Flight[] = [
      {
        id: "1",
        flightNumber: "TR123",
        destination: "Singapore (SIN)",
        departureTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        status: "pending",
      },
      {
        id: "2",
        flightNumber: "TR456",
        destination: "Bangkok (BKK)",
        departureTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        status: "in-progress",
      },
      {
        id: "3",
        flightNumber: "TR789",
        destination: "Taipei (TPE)",
        departureTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        status: "completed",
      },
      {
        id: "4",
        flightNumber: "TR321",
        destination: "Hong Kong (HKG)",
        departureTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
        status: "pending",
      },
    ];

    setFlights(mockFlights);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
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
          <Button variant="outline" size="sm" onClick={handleLogout} className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Upcoming Flights</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Showing flights ±6 hours from now
          </p>
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
                    <CardTitle className="text-lg">{flight.flightNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{flight.destination}</p>
                  </div>
                  <Badge className={getStatusColor(flight.status)}>
                    {flight.status.replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Departure: {formatTime(flight.departureTime)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Flights;
