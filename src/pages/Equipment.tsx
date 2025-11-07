import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Box, Container, Eye, Printer } from "lucide-react";
import { ConnectionStatus } from "@/components/ConnectionStatus";

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
                  <p className="text-sm text-muted-foreground">
                    Seals required: <span className="font-semibold text-foreground">{equipment.sealCount}</span>
                  </p>
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
