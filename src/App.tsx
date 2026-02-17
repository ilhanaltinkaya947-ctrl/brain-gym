import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { initialize as initializeDespia } from "@/utils/despia";
import { initializeAds } from "@/utils/adManager";
import { AppProvider } from "@/contexts/AppContext";

const queryClient = new QueryClient();

// Initialize native features on app load (safe — won't crash if Capacitor isn't ready)
try { initializeDespia(); } catch (e) { console.warn('[Despia] Init failed:', e); }

// Initialize ad system
try { initializeAds(); } catch (e) { console.warn('[Ads] Init failed:', e); }

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
