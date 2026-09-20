import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthReadyProvider } from "@/hooks/useAuthReady";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

import Index from "./pages/Index.tsx";
import ProductDetailPage from "./pages/ProductDetailPage.tsx";
import ProductReviewsPage from "./pages/ProductReviewsPage.tsx";
import CollectionPage from "./pages/CollectionPage.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminOrders from "./pages/AdminOrders.tsx";
import AdminProducts from "./pages/AdminProducts.tsx";
import AdminDeliveryCharges from "./pages/AdminDeliveryCharges.tsx";
import AllReviewsPage from "./pages/AllReviewsPage.tsx";
import AdminTrendingProducts from "./pages/AdminTrendingProducts.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminDiscounts from "./pages/AdminDiscounts.tsx";
import AdminHeroSlides from "./pages/AdminHeroSlides.tsx";
import AdminBrands from "./pages/AdminBrands.tsx";
import BrandsPage from "./pages/BrandsPage.tsx";
import BrandCollectionPage from "./pages/BrandCollectionPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import TrackOrderPage from "./pages/TrackOrderPage.tsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.tsx";
import UnsubscribePage from "./pages/UnsubscribePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import MetaPixelPageView from "./components/MetaPixelPageView.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      staleTime: 10_000,
      gcTime: 5 * 60_000,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const App = () => (
  <AppErrorBoundary>
   <QueryClientProvider client={queryClient}>
    <AuthReadyProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <MetaPixelPageView />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/collection/:category" element={<CollectionPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/brands/:slug" element={<BrandCollectionPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/product-reviews/:id" element={<ProductReviewsPage />} />
              <Route path="/reviews" element={<AllReviewsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/delivery-charges" element={<AdminDeliveryCharges />} />
              <Route path="/admin/trending" element={<AdminTrendingProducts />} />
              <Route path="/admin/discounts" element={<AdminDiscounts />} />
              <Route path="/admin/hero-slides" element={<AdminHeroSlides />} />
              <Route path="/admin/brands" element={<AdminBrands />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </AuthReadyProvider>
   </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
