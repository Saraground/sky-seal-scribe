import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { supabase } from "@/integrations/supabase/client";
import scootLogo from "@/assets/scoot-logo.png";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    if (error) {
      return;
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify({
        email
      }));
      navigate("/flights");
    }
  };
  const handleLoginRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('send-login-request', {
        body: {
          username,
          email,
          staffNumber
        }
      });

      setLoading(false);

      if (error) {
        return;
      }
      
      // Clear form
      setUsername("");
      setEmail("");
      setStaffNumber("");
    } catch (error: any) {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex items-center justify-center">
            <img src={scootLogo} alt="Scoot Logo" className="w-32 h-32 object-contain" />
          </div>
          <CardTitle className="text-2xl">Mealcart Trolley Seal Management</CardTitle>
          <CardDescription>Airline Catering Service System by SSS Police</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="request">Login Request</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="your.email@airline.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="request">
              <form onSubmit={handleLoginRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="request-username">Username</Label>
                  <Input 
                    id="request-username" 
                    type="text" 
                    placeholder="Your username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-email">Email ID</Label>
                  <Input 
                    id="request-email" 
                    type="email" 
                    placeholder="your.email@sats.com.sg" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-staff">Staff Number</Label>
                  <Input 
                    id="request-staff" 
                    type="text" 
                    placeholder="Your staff number" 
                    value={staffNumber} 
                    onChange={e => setStaffNumber(e.target.value)} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Submitting request..." : "Submit Request"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Login;