import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, FileText, Edit } from "lucide-react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SealScan {
  id: string;
  seal_number: string;
  equipment_type: string;
  scanned_at: string;
}

interface FlightData {
  flight_number: string;
  departure_time: string;
  created_at: string;
  user_id: string;
  hilift_1_seal: string | null;
  hilift_2_seal: string | null;
  hilift_1_rear_seal: string | null;
  hilift_2_rear_seal: string | null;
  hilift_1_number: string | null;
  hilift_2_number: string | null;
}

const Preview = () => {
  const navigate = useNavigate();
  const { flightId } = useParams();
  const [sealScans, setSealScans] = useState<SealScan[]>([]);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorUsername, setCreatorUsername] = useState<string>("");
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [hiLiftDialogOpen, setHiLiftDialogOpen] = useState(false);
  const [selectedHiLift, setSelectedHiLift] = useState<1 | 2>(1);
  const [hiLiftNumber, setHiLiftNumber] = useState("");
  const [hiLiftSealNumber, setHiLiftSealNumber] = useState("");
  const { toast } = useToast();

  const equipmentNames: Record<string, string> = {
    "full-trolley": "Full Size Trolley",
    "half-trolley": "Half Size Trolley",
    "food-container": "Food Container",
    "service-container": "Service Container",
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        
        if (currentProfile) {
          setCurrentUsername(currentProfile.username || "");
        }
      }
      
      // Fetch flight data
      const { data: flight } = await supabase
        .from("flights")
        .select("flight_number, departure_time, created_at, user_id, hilift_1_seal, hilift_2_seal, hilift_1_rear_seal, hilift_2_rear_seal, hilift_1_number, hilift_2_number")
        .eq("id", flightId!)
        .single();
      
      if (flight) {
        setFlightData(flight);
        
        // Fetch creator's profile
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", flight.user_id)
          .single();
        
        if (creatorProfile) {
          setCreatorUsername(creatorProfile.username || "");
        }
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

  const handleHiLiftClick = (hiLiftNum: 1 | 2) => {
    setSelectedHiLift(hiLiftNum);
    setHiLiftNumber(hiLiftNum === 1 ? flightData?.hilift_1_number || "" : flightData?.hilift_2_number || "");
    setHiLiftSealNumber(hiLiftNum === 1 ? flightData?.hilift_1_seal || "" : flightData?.hilift_2_seal || "");
    setHiLiftDialogOpen(true);
  };

  const handleSaveHiLift = async () => {
    if (!hiLiftSealNumber) {
      toast({
        title: "Error",
        description: "Please enter a seal number",
        variant: "destructive",
      });
      return;
    }

    const updateData = selectedHiLift === 1 
      ? { hilift_1_seal: hiLiftSealNumber, hilift_1_number: hiLiftNumber }
      : { hilift_2_seal: hiLiftSealNumber, hilift_2_number: hiLiftNumber };

    const { error } = await supabase
      .from("flights")
      .update(updateData)
      .eq("id", flightId!);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update Hi-Lift information",
        variant: "destructive",
      });
      return;
    }

    setFlightData(prev => prev ? {
      ...prev,
      ...(selectedHiLift === 1 
        ? { hilift_1_seal: hiLiftSealNumber, hilift_1_number: hiLiftNumber } 
        : { hilift_2_seal: hiLiftSealNumber, hilift_2_number: hiLiftNumber })
    } : null);

    toast({
      title: "Success",
      description: `Hi-Lift ${selectedHiLift} information updated`,
    });

    setHiLiftDialogOpen(false);
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
              @page { margin: 0.3cm; size: A4; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              table { page-break-inside: avoid; font-size: 0.85rem; }
              tr { page-break-inside: avoid; page-break-after: avoid; }
              * { page-break-inside: avoid; }
            }
          `}} />
          
          <div className="border-2 border-black">
            {/* Header Section */}
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td rowSpan={2} className="border border-black p-2 w-1/3 align-top">
                    <div className="text-center">
                      <div className="text-red-600 font-bold text-2xl mb-1">SATS</div>
                      <div className="text-xs font-semibold">SATS Security Services Pte Ltd</div>
                    </div>
                  </td>
                  <td className="border border-black p-1 text-center font-semibold">Date</td>
                  <td className="border border-black p-1 text-center text-lg font-bold">
                    {flightData ? new Date(flightData.departure_time).toLocaleDateString() : ''}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center font-semibold">
                    Flight No.
                  </td>
                  <td className="border border-black p-1 text-center text-lg font-bold">
                    {flightData?.flight_number || ''}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Equipment Section */}
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black p-1 w-32">
                    Hi-Lift 1{flightData?.hilift_1_number ? <span style={{ fontSize: '20px', fontWeight: 'bold' }}> - {flightData.hilift_1_number}</span> : ""}
                  </td>
                  <td className="border border-black p-1 w-8 text-center font-bold">1</td>
                  <td className="border border-black p-1 text-left font-bold" style={{ fontSize: '22px' }}>
                    Rear Seal: {flightData?.hilift_1_rear_seal || ""}, Front Seal: {flightData?.hilift_1_seal || ""}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black p-1 bg-black text-white text-xs">
                    SSS sticker nos. for loose items
                  </td>
                  <td className="border border-black p-1 text-xs">
                    <span className="font-semibold">Colour:</span>
                  </td>
                  <td className="border border-black p-1 text-xs">
                    <span className="font-semibold">From:</span>
                  </td>
                  <td className="border border-black p-1 text-xs">
                    <span className="font-semibold">Ends:</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature Section */}
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black p-1 text-xs w-1/3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">FORM PREPARED BY:</div>
                        <div className="mt-1 text-lg font-bold">{creatorUsername}</div>
                      </div>
                      <div className="font-semibold">Signature:</div>
                    </div>
                  </td>
                  <td className="border border-black p-1 text-xs w-1/3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">FORM FINALISED BY:</div>
                        <div className="mt-1 text-lg font-bold">{currentUsername}</div>
                      </div>
                      <div className="font-semibold">Signature:</div>
                    </div>
                  </td>
                  <td className="border border-black p-1 w-1/3 text-center font-bold" style={{ fontSize: '40px' }}>Scoot</td>
                </tr>
              </tbody>
            </table>

            {/* Time Section */}
            <div className="border border-black p-1 bg-blue-900 text-white text-xs font-semibold flex justify-between">
              <span>Time-commences & Time-end checking of meal cart:</span>
              <span>
                {flightData ? new Date(flightData.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '_______'} hrs - {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} hrs
              </span>
            </div>

            {/* Main Data Table */}
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-sm font-bold w-[50px]">S/n</th>
                  <th className="border border-black p-1 text-sm font-bold w-[150px]">Cart No.</th>
                  <th className="border border-black p-1 text-sm font-bold w-[300px]">Seal / Sticker No.</th>
                  <th className="border border-black p-1 text-sm font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedScans).flatMap(([equipmentType, scans], index) => {
                  const sealNumbers = scans.map(scan => scan.seal_number).join(', ');
                  const maxCharsPerLine = 35; // Reduced to prevent overflow into Remarks column
                  const sealLines: string[] = [];
                  
                  // Split seal numbers into chunks without wrapping
                  let currentLine = '';
                  const sealsArray = sealNumbers.split(', ');
                  
                  sealsArray.forEach((seal, idx) => {
                    const testLine = currentLine + (currentLine ? ', ' : '') + seal;
                    if (testLine.length <= maxCharsPerLine) {
                      currentLine = testLine;
                    } else {
                      if (currentLine) sealLines.push(currentLine);
                      currentLine = seal;
                    }
                    if (idx === sealsArray.length - 1 && currentLine) {
                      sealLines.push(currentLine);
                    }
                  });

                  // Create rows: first row with equipment info, additional rows for overflow, then empty row
                  const equipmentRows = sealLines.map((line, lineIdx) => (
                    <tr key={`${equipmentType}-${lineIdx}`} style={{ height: '26px' }}>
                      <td className="border border-black p-1 text-center text-xs">
                        {lineIdx === 0 ? index + 1 : ''}
                      </td>
                      <td className="border border-black p-1 text-center text-xs">
                        {lineIdx === 0 ? equipmentNames[equipmentType] : ''}
                      </td>
                      <td className="border border-black p-1 text-left px-2 whitespace-nowrap">
                        <span className="font-bold text-sm">
                          {line}
                        </span>
                      </td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  ));
                  
                  // Add empty row after each equipment type
                  const emptyRow = (
                    <tr key={`${equipmentType}-empty`} style={{ height: '26px' }}>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  );
                  
                  return [...equipmentRows, emptyRow];
                })}
                {/* Fixed 16 empty rows */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ height: '26px' }}>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-right text-xs font-semibold">TOTAL NO. OF TR PADLOCKS:</td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-right text-xs font-semibold">ACKNOWLEDGE BY:</td>
                  <td className="border border-black p-1"></td>
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

        {/* Hi-Lift Edit Dialog */}
        <Dialog open={hiLiftDialogOpen} onOpenChange={setHiLiftDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Hi-Lift {selectedHiLift}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hilift-number">Hi-Lift Number</Label>
                <Input
                  id="hilift-number"
                  value={hiLiftNumber}
                  onChange={(e) => setHiLiftNumber(e.target.value)}
                  placeholder="Enter Hi-Lift number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seal-number">Hi-Lift Seal Number</Label>
                <Input
                  id="seal-number"
                  value={hiLiftSealNumber}
                  onChange={(e) => setHiLiftSealNumber(e.target.value)}
                  placeholder="Scan or enter seal number"
                  autoFocus
                />
              </div>
              <Button onClick={handleSaveHiLift} className="w-full">
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Screen Preview */}
        <Card className="print:hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Trolley Seal Report</CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              <p>Flight: {flightData?.flight_number || "N/A"}</p>
              <p>Date: {flightData ? new Date(flightData.departure_time).toLocaleDateString() : new Date().toLocaleDateString()}</p>
              <p>Time: {flightData ? new Date(flightData.departure_time).toLocaleTimeString() : new Date().toLocaleTimeString()}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div 
                className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                onClick={() => handleHiLiftClick(1)}
              >
                <div>
                  <p className="font-semibold">Hi-Lift 1</p>
                  <p className="text-sm text-muted-foreground">
                    {flightData?.hilift_1_number && `Hi-Lift Number: ${flightData.hilift_1_number} | `}
                    Seal No: {flightData?.hilift_1_seal || "Not set"}
                  </p>
                </div>
                <Edit className="w-4 h-4" />
              </div>
              <div 
                className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                onClick={() => handleHiLiftClick(2)}
              >
                <div>
                  <p className="font-semibold">Hi-Lift 2</p>
                  <p className="text-sm text-muted-foreground">
                    {flightData?.hilift_2_number && `Hi-Lift Number: ${flightData.hilift_2_number} | `}
                    Seal No: {flightData?.hilift_2_seal || "Not set"}
                  </p>
                </div>
                <Edit className="w-4 h-4" />
              </div>
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
