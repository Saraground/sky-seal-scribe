import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { supabase } from "@/integrations/supabase/client";

interface SealScan {
  id: string;
  seal_number: string;
  equipment_type: string;
  scanned_at: string;
}

interface FlightData {
  flight_number: string;
  departure_time: string;
}

const Preview = () => {
  const navigate = useNavigate();
  const { flightId } = useParams();
  const [sealScans, setSealScans] = useState<SealScan[]>([]);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(true);

  const equipmentNames: Record<string, string> = {
    "full-trolley": "Full-Size Trolley",
    "half-trolley": "Half-Size Trolley",
    "food-container": "Food Container",
    "service-container": "Service Container",
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch flight data
      const { data: flight } = await supabase
        .from("flights")
        .select("flight_number, departure_time")
        .eq("id", flightId!)
        .single();
      
      if (flight) {
        setFlightData(flight);
      }
      
      // Fetch seal scans
      const { data: scans } = await supabase
        .from("seal_scans")
        .select("*")
        .eq("flight_id", flightId!)
        .order("scanned_at", { ascending: true });
      
      if (scans) {
        setSealScans(scans);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [flightId]);

  const groupedScans = sealScans.reduce((acc, scan) => {
    if (!acc[scan.equipment_type]) {
      acc[scan.equipment_type] = [];
    }
    acc[scan.equipment_type].push(scan);
    return acc;
  }, {} as Record<string, SealScan[]>);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg print:hidden">
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
          <h1 className="text-xl font-bold">Preview & Print</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 print:hidden flex gap-3">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button variant="outline" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        <Card className="print:shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Trolley Seal Report</CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              <p>Flight: {flightData?.flight_number || "N/A"}</p>
              <p>Date: {flightData ? new Date(flightData.departure_time).toLocaleDateString() : new Date().toLocaleDateString()}</p>
              <p>Time: {flightData ? new Date(flightData.departure_time).toLocaleTimeString() : new Date().toLocaleTimeString()}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : Object.keys(groupedScans).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No seal data recorded for this flight
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedScans).map(([equipmentType, scans]) => (
                  <div key={equipmentType}>
                    <h3 className="font-semibold text-lg mb-3 text-primary">
                      {equipmentNames[equipmentType]}
                    </h3>
                    <div className="grid gap-2">
                      {scans.map((scan, index) => (
                        <div
                          key={scan.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">
                              Seal #{index + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(scan.scanned_at).toLocaleString()}
                            </span>
                          </div>
                          <span className="font-mono font-medium">
                            {scan.seal_number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Preview;
