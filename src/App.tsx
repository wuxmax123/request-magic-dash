import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthWrapper } from "./components/auth/AuthWrapper";
import Index from "./pages/Index";
import RFQ from "./pages/RFQ";
import RFQList from "./pages/RFQList";
import QuotationRequestList from "./pages/QuotationRequestList";
import Admin from "./pages/Admin";
import ShippingEstimator from "./pages/ShippingEstimator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthWrapper>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rfq" element={<RFQ />} />
            <Route path="/rfq-list" element={<RFQList />} />
            <Route path="/quotation-requests" element={<QuotationRequestList />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/shipping-estimator" element={<ShippingEstimator />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
