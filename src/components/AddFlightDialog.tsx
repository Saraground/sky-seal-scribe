import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AddFlightDialog = ({ onFlightAdded }: { onFlightAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [flightNumber, setFlightNumber] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [status, setStatus] = useState("pending");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flightNumber || !destination || !departureTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add flights",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("flights").insert({
      user_id: user.id,
      flight_number: flightNumber,
      destination,
      departure_time: new Date(departureTime).toISOString(),
      status,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add flight",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Flight added successfully",
    });

    setFlightNumber("");
    setDestination("");
    setDepartureTime("");
    setStatus("pending");
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
              placeholder="e.g., TR123"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="e.g., Singapore (SIN)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departureTime">Departure Time</Label>
            <Input
              id="departureTime"
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Add Flight
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
