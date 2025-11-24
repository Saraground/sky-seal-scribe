import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Flights from "./pages/Flights";
import Equipment from "./pages/Equipment";
import Scan from "./pages/Scan";
import Preview from "./pages/Preview";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TemplateEditor from "./pages/TemplateEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/equipment/:flightId" element={<Equipment />} />
          <Route path="/scan/:flightId/:equipmentType" element={<Scan />} />
          <Route path="/preview/:flightId" element={<Preview />} />
          <Route path="/template-editor/:flightId" element={<TemplateEditor />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
