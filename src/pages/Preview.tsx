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

      <main className="container mx-auto px-4 py-6 max-w-4xl print:max-w-full">
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

        {/* Print Template */}
        <div className="print:block hidden">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { margin: 0.5cm; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          `}} />
          
          <div className="border-2 border-black">
            {/* Header Section */}
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td colSpan={7} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-center font-semibold text-xs">Date</td>
                  <td colSpan={2} className="border border-black p-1 text-center">
                    {flightData ? new Date(flightData.departure_time).toLocaleDateString('en-GB') : ''}
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} className="border border-black p-1"></td>
                  <td rowSpan={2} className="border border-black p-2 align-middle">
                    <div className="text-center font-bold text-2xl">SCOOT</div>
                  </td>
                  <td colSpan={2} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={3} className="border border-black p-2 align-middle">
                    <div className="text-xs font-semibold">SATS Security Services Pte Ltd</div>
                  </td>
                  <td colSpan={4} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-center font-semibold text-xs bg-blue-900 text-white">
                    Flight No.
                  </td>
                  <td className="border border-black p-1 text-center font-bold">
                    {flightData?.flight_number || ''}
                  </td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
                
                {/* Hi-Lift Sections */}
                <tr>
                  <td className="border border-black p-1 text-xs">Hi-Lift</td>
                  <td colSpan={2} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-center font-bold">1</td>
                  <td colSpan={3} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-xs font-semibold">Seal No.</td>
                  <td colSpan={2} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-xs">Hi-Lift</td>
                  <td colSpan={2} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-center font-bold">2</td>
                  <td colSpan={3} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-xs font-semibold">Seal No.</td>
                  <td colSpan={2} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
                
                {/* SSS Sticker Section */}
                <tr>
                  <td colSpan={5} className="border border-black p-1 bg-black text-white text-xs">
                    SSS sticker nos. for loose items
                  </td>
                  <td colSpan={2} className="border border-black p-1 text-xs">
                    <span className="font-semibold">Colour :</span>
                  </td>
                  <td colSpan={2} className="border border-black p-1 text-xs">
                    <span className="font-semibold">From :</span>
                  </td>
                  <td className="border border-black p-1 text-xs">
                    <span className="font-semibold">Ends :</span>
                  </td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>

            {/* Signature Section */}
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black p-1 text-xs" rowSpan={2}>Name of APO / SO</td>
                  <td colSpan={4} className="border border-black p-1 text-xs text-center font-semibold">FORM PREPARED BY</td>
                  <td colSpan={4} className="border border-black p-1 text-xs text-center font-semibold">FORM FINALISED BY</td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black p-1 text-xs text-center">Signatures</td>
                  <td colSpan={4} className="border border-black p-1 text-xs text-center">Signatures</td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>

            {/* Time Section */}
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td colSpan={8} className="border border-black p-1 bg-blue-900 text-white text-xs font-semibold">
                    Time-commences & Time-end checking of meal cart :
                  </td>
                  <td colSpan={2} className="border border-black p-1 bg-blue-900 text-white text-xs font-semibold text-right">
                    __________ hrs - __________ hrs
                  </td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>

            {/* Main Data Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-black p-1 text-xs font-bold">S/n</th>
                  <th colSpan={6} className="border border-black p-1 text-xs font-bold">Cart No.</th>
                  <th colSpan={2} className="border border-black p-1 text-xs font-bold">Seal / Sticker No.</th>
                  <th className="border border-black p-1 text-xs font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedScans).map(([equipmentType, scans], groupIndex) => (
                  <tr key={equipmentType}>
                    <td className="border border-black p-1 text-center text-xs">{groupIndex + 1}</td>
                    <td colSpan={6} className="border border-black p-1 text-center text-xs">{equipmentNames[equipmentType]}</td>
                    <td colSpan={2} className="border border-black p-1 text-center font-bold text-sm">
                      {scans.map(scan => scan.seal_number).join(', ')}
                    </td>
                    <td className="border border-black p-1"></td>
                  </tr>
                ))}
                {/* Empty rows to fill page */}
                {Array.from({ length: Math.max(0, 25 - Object.keys(groupedScans).length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-black p-2"></td>
                    <td colSpan={6} className="border border-black p-2"></td>
                    <td colSpan={2} className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={8} className="border border-black p-1 text-right text-xs font-semibold">TOTAL NO. OF TR PADLOCKS :</td>
                  <td colSpan={2} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={8} className="border border-black p-1 text-right text-xs font-semibold">ACKNOWLEDGE BY :</td>
                  <td colSpan={2} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="text-xs p-1">All Other Airlines Meal Cart Check 01 / 25</div>
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-gray-300 text-9xl font-bold opacity-20">Page 1</div>
            </div>
          </div>
        </div>

        {/* Screen Preview */}
        <Card className="print:hidden">
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
                          className="flex items-center p-3 bg-muted rounded-lg"
                        >
                          <span className="text-xs text-muted-foreground mr-2">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground mr-2">-</span>
                          <span className="text-2xl font-bold font-mono">
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
