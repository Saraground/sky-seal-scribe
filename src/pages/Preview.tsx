import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, FileText, Edit, RotateCcw } from "lucide-react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import satsLogo from "@/assets/sats-logo.png";
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
  padlock_total: string | null;
  driver_name: string | null;
  driver_id: string | null;
}
const Preview = () => {
  const navigate = useNavigate();
  const {
    flightId
  } = useParams();
  const [sealScans, setSealScans] = useState<SealScan[]>([]);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorUsername, setCreatorUsername] = useState<string>("");
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [hiLiftDialogOpen, setHiLiftDialogOpen] = useState(false);
  const [selectedHiLift, setSelectedHiLift] = useState<1 | 2>(1);
  const [hiLiftNumber, setHiLiftNumber] = useState("");
  const [hiLiftSealNumber, setHiLiftSealNumber] = useState("");
  const equipmentNames: Record<string, string> = {
    "full-trolley": "Full Size Trolley",
    "half-trolley": "Half Size Trolley",
    "food-container": "Food Container",
    "service-container": "Service Container"
  };
  useEffect(() => {
    fetchData();
    
    // Listen for print completion
    const handleAfterPrint = async () => {
      // Update flight status to "printed" after print dialog closes
      if (flightId) {
        await supabase
          .from("flights")
          .update({ status: "printed" })
          .eq("id", flightId);
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [flightId]);
  const fetchData = async () => {
    setLoading(true);

    // Fetch current user
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (user) {
      const {
        data: currentProfile
      } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (currentProfile) {
        setCurrentUsername(currentProfile.username || "");
      }
    }

    // Fetch flight data
    const {
      data: flight
    } = await supabase.from("flights").select("flight_number, departure_time, created_at, user_id, hilift_1_seal, hilift_2_seal, hilift_1_rear_seal, hilift_2_rear_seal, hilift_1_number, hilift_2_number, padlock_total, driver_name, driver_id").eq("id", flightId!).single();
    if (flight) {
      setFlightData(flight);

      // Fetch creator's profile
      const {
        data: creatorProfile
      } = await supabase.from("profiles").select("username").eq("id", flight.user_id).single();
      if (creatorProfile) {
        setCreatorUsername(creatorProfile.username || "");
      }
    }

    // Fetch seal scans
    const {
      data: scans
    } = await supabase.from("seal_scans").select("*").eq("flight_id", flightId!).order("scanned_at", {
      ascending: true
    });
    if (scans) {
      setSealScans(scans);
    }
    setLoading(false);
  };
  const groupedScans = sealScans.reduce((acc, scan) => {
    if (!acc[scan.equipment_type]) {
      acc[scan.equipment_type] = [];
    }
    acc[scan.equipment_type].push(scan);
    return acc;
  }, {} as Record<string, SealScan[]>);
  const handleReset = () => {
    fetchData();
  };
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
      return;
    }
    const updateData = selectedHiLift === 1 ? {
      hilift_1_seal: hiLiftSealNumber,
      hilift_1_number: hiLiftNumber
    } : {
      hilift_2_seal: hiLiftSealNumber,
      hilift_2_number: hiLiftNumber
    };
    const {
      error
    } = await supabase.from("flights").update(updateData).eq("id", flightId!);
    if (error) {
      console.error("Error updating Hi-Lift:", error);
      return;
    }
    setFlightData(prev => prev ? {
      ...prev,
      ...(selectedHiLift === 1 ? {
        hilift_1_seal: hiLiftSealNumber,
        hilift_1_number: hiLiftNumber
      } : {
        hilift_2_seal: hiLiftSealNumber,
        hilift_2_number: hiLiftNumber
      })
    } : null);
    setHiLiftDialogOpen(false);
  };
  return <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/flights")} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flights
            </Button>
            <ConnectionStatus />
          </div>
          <h1 className="text-xl font-bold">Preview & Print</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl print:max-w-full">
        <div className="mb-6 print:hidden">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <Button variant="outline" onClick={handleReset} className="col-span-2">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Print Template - Excel Format */}
        <div className="print:block hidden">
          <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { 
                margin: 0.5cm; 
                size: A4 portrait; 
              }
              body { 
                print-color-adjust: exact; 
                -webkit-print-color-adjust: exact; 
              }
            }
          `
        }} />
          
          <div className="p-2">
            {/* Header Section - Exactly as Excel */}
            <table className="w-full border-collapse mb-0" style={{borderCollapse: 'collapse'}}>
              <tbody>
                <tr>
                  <td colSpan={7} className="border border-black text-right p-1 text-sm font-bold" style={{height: '20px'}}>Date</td>
                  <td colSpan={3} className="border border-black p-1 text-sm">
                    {flightData ? new Date(flightData.departure_time).toLocaleDateString('en-GB') : ''}
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} className="border border-black text-center p-2 text-xl font-bold" style={{height: '30px'}}>SCOOT</td>
                  <td colSpan={3} className="border border-black p-1" style={{height: '30px'}}></td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black p-1 text-sm" style={{height: '25px'}}>SATS Security Services Pte Ltd</td>
                  <td colSpan={3} className="border border-black p-1" style={{height: '25px'}}></td>
                  <td colSpan={2} className="border border-black text-right p-1 text-sm font-bold" style={{height: '25px'}}>Flight No.</td>
                  <td className="border border-black p-1 text-sm">{flightData?.flight_number || ''}</td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-sm font-bold" style={{width: '10%', height: '25px'}}>Hi-Lift</td>
                  <td className="border border-black text-center p-1 text-sm font-bold" style={{width: '5%'}}>1</td>
                  <td colSpan={5} className="border border-black p-1" style={{width: '45%'}}></td>
                  <td colSpan={2} className="border border-black text-right p-1 text-sm font-bold" style={{width: '20%'}}>Seal No.</td>
                  <td className="border border-black p-1 text-sm" style={{width: '20%'}}>
                    {flightData?.hilift_1_seal || ''}
                  </td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-sm font-bold" style={{height: '25px'}}>Hi-Lift</td>
                  <td className="border border-black text-center p-1 text-sm font-bold">2</td>
                  <td colSpan={5} className="border border-black p-1"></td>
                  <td colSpan={2} className="border border-black text-right p-1 text-sm font-bold">Seal No.</td>
                  <td className="border border-black p-1 text-sm">
                    {flightData?.hilift_2_seal || ''}
                  </td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={5} className="border border-black p-1 text-xs font-bold" style={{height: '20px'}}>SSS sticker nos. for loose items</td>
                  <td colSpan={2} className="border border-black p-1 text-xs">Colour :</td>
                  <td colSpan={2} className="border border-black p-1 text-xs">From :</td>
                  <td className="border border-black p-1 text-xs">Ends :</td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black p-1 text-xs" style={{height: '20px'}}>Name of APO / SO</td>
                  <td colSpan={3} className="border border-black p-1 text-xs font-bold">FORM PREPARED BY</td>
                  <td colSpan={3} className="border border-black p-1 text-xs font-bold">FORM FINALISED BY</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black p-1" style={{height: '30px'}}></td>
                  <td colSpan={3} className="border border-black p-1 text-xs">Signatures</td>
                  <td colSpan={3} className="border border-black p-1 text-xs">Signatures</td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black p-1 text-xs font-bold" style={{height: '20px'}}>Time-commences & Time-end checking of meal cart :</td>
                  <td colSpan={6} className="border border-black p-1 text-xs text-right">__________ hrs - __________ hrs</td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
              </tbody>
            </table>

            {/* Main Data Table - Exactly as Excel */}
            <table className="w-full border-collapse" style={{borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th className="border border-black p-1 text-xs font-bold text-center" style={{width: '5%', height: '20px'}}>S/n</th>
                  <th className="border border-black p-1 text-xs font-bold text-center" style={{width: '15%'}}>Cart No.</th>
                  <th className="border border-black p-1 text-xs font-bold text-center" style={{width: '60%'}}>Seal / Sticker No.</th>
                  <th className="border border-black p-1 text-xs font-bold text-center" style={{width: '20%'}}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = [];
                  let serialNumber = 1;
                  
                  // Add equipment data rows
                  Object.entries(groupedScans).forEach(([equipmentType, scans]) => {
                    const sealNumbers = scans.map(scan => scan.seal_number).join(', ');
                    const count = scans.length;
                    const displayCount = equipmentType === 'full-trolley' ? count / 2 : count;
                    
                    rows.push(
                      <tr key={`data-${equipmentType}`}>
                        <td className="border border-black p-1 text-xs text-center" style={{height: '25px'}}>{serialNumber}</td>
                        <td className="border border-black p-1 text-xs text-center">{displayCount} {equipmentNames[equipmentType]}</td>
                        <td className="border border-black p-1 text-xs">{sealNumbers}</td>
                        <td className="border border-black p-1 text-xs"></td>
                      </tr>
                    );
                    serialNumber++;
                  });
                  
                  // Add empty rows to fill the page (Excel has about 25-30 data rows)
                  const totalRows = 25;
                  const emptyRowsCount = totalRows - rows.length;
                  
                  for (let i = 0; i < emptyRowsCount; i++) {
                    rows.push(
                      <tr key={`empty-${i}`}>
                        <td className="border border-black p-1" style={{height: '25px'}}></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    );
                  }
                  
                  return rows;
                })()}
              </tbody>
            </table>

            {/* Footer Section - Exactly as Excel */}
            <table className="w-full border-collapse mt-0" style={{borderCollapse: 'collapse'}}>
              <tbody>
                <tr>
                  <td colSpan={7} className="border border-black p-1" style={{height: '10px'}}></td>
                  <td colSpan={2} className="border border-black text-right p-1 text-xs font-bold" style={{height: '10px'}}>TOTAL NO. OF TR PADLOCKS :</td>
                  <td className="border border-black p-1 text-xs">{flightData?.padlock_total || ''}</td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={7} className="border border-black p-1" style={{height: '10px'}}></td>
                  <td colSpan={2} className="border border-black text-right p-1 text-xs font-bold" style={{height: '10px'}}>ACKNOWLEDGE BY :</td>
                  <td className="border border-black p-1 text-xs">
                    {flightData?.driver_name && <div>Name: {flightData.driver_name}</div>}
                    {flightData?.driver_id && <div>ID: {flightData.driver_id}</div>}
                  </td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1" style={{height: '10px'}}></td>
                </tr>
                <tr>
                  <td colSpan={10} className="border border-black p-1 text-xs" style={{height: '20px'}}>All Other Airlines Meal Cart Check 01 / 25</td>
                </tr>
              </tbody>
            </table>
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
                <Input id="hilift-number" value={hiLiftNumber} onChange={e => setHiLiftNumber(e.target.value)} placeholder="Enter Hi-Lift number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seal-number">Hi-Lift Seal Number</Label>
                <Input id="seal-number" value={hiLiftSealNumber} onChange={e => setHiLiftSealNumber(e.target.value)} placeholder="Scan or enter seal number" autoFocus />
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
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80" onClick={() => handleHiLiftClick(1)}>
                <div>
                  <p className="font-semibold">Hi-Lift 1</p>
                  <p className="text-sm text-muted-foreground">
                    {flightData?.hilift_1_number && `Hi-Lift Number: ${flightData.hilift_1_number} | `}
                    Seal No: {flightData?.hilift_1_seal || "Not set"}
                  </p>
                </div>
                <Edit className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold">PADLOCK</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {flightData?.padlock_total || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                <div>
                  <p className="font-semibold">Driver Name & ID</p>
                  <p className="text-sm text-muted-foreground">
                    Not set
                  </p>
                </div>
                <Edit className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : Object.keys(groupedScans).length === 0 ? <p className="text-center text-muted-foreground py-8">
                No seal data recorded for this flight
              </p> : <div className="space-y-6">
                {Object.entries(groupedScans).map(([equipmentType, scans]) => <div key={equipmentType}>
                    <h3 className="font-semibold text-lg mb-3 text-primary">
                      {equipmentNames[equipmentType]}
                    </h3>
                    <div className="grid gap-2">
                      {scans.map((scan, index) => <div key={scan.id} className="flex items-center p-3 bg-muted rounded-lg">
                          <span className="text-xs text-muted-foreground mr-2">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground mr-2">-</span>
                          <span className="text-2xl font-bold font-mono">
                            {scan.seal_number}
                          </span>
                        </div>)}
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </main>
    </div>;
};
export default Preview;