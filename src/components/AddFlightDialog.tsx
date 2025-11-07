import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const AddFlightDialog = ({ onFlightAdded }: { onFlightAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [flightNumber, setFlightNumber] = useState("TR");
  

  const handleFlightNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    
    // Always keep TR prefix
    if (!value.startsWith("TR")) {
      setFlightNumber("TR");
      return;
    }
    
    // Only allow TR followed by numbers
    const numberPart = value.slice(2);
    if (numberPart === "" || /^\d+$/.test(numberPart)) {
      setFlightNumber(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flightNumber || flightNumber === "TR" || flightNumber.length < 4) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    // Set default values for destination and departure_time
    const defaultDepartureTime = new Date();
    defaultDepartureTime.setHours(defaultDepartureTime.getHours() + 2); // Default to 2 hours from now

    const { error } = await supabase.from("flights").insert({
      user_id: user.id,
      flight_number: flightNumber,
      destination: "TBD",
      departure_time: defaultDepartureTime.toISOString(),
      status: "pending",
    });

    if (error) {
      console.error("Error adding flight:", error);
      return;
    }

    setFlightNumber("TR");
    setOpen(false);
    onFlightAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Flight
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Flight</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flightNumber">Flight Number</Label>
            <Input
              id="flightNumber"
              placeholder="TR123"
              value={flightNumber}
              onChange={handleFlightNumberChange}
              maxLength={10}
            />
          </div>
          <Button type="submit" className="w-full">
            Add Flight
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
