import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { HotelProvider } from "@/contexts/HotelContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SiteHeader from "./components/layout/SiteHeader";
import Footer from "./components/layout/Footer";
import UserPortal from "./pages/UserPortal";
import AdminPortal from "./pages/AdminPortal";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import HotelPage from "@/pages/HotelPage";
import HotelForecast from "./pages/HotelForecast";

import ChatWidget from "@/components/ChatWidget";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <HotelProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SiteHeader />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user" element={<UserPortal />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/hotels/:id" element={<HotelPage />} />
              <Route path="/forecast" element={<HotelForecast />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />

            {/* Chat widget persists across routes */}
            <ChatWidget />
          </BrowserRouter>
        </HotelProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
