import React from "react";
import { Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { VerifyEmailPage } from "../pages/VerifyEmailPage";
import { AccountPage } from "../pages/AccountPage";
import { ListingsPage } from "../pages/ListingsPage";
import { ListingDetailPage } from "../pages/ListingDetailPage";
import { FavouritesPage } from "../pages/FavouritesPage";
import { AddVehiclePage } from "../pages/AddVehiclePage";
import { ProtectedRoute } from "../context/ProtectedRoute";
import { AddListingPage } from "../pages/AddListingPage";
import { AnalyticsDashboardPage } from "../pages/AnalyticsDashboardPage";
import { SellerAnalyticsPage } from "../pages/SellerAnalyticsPage";
import { EditListingPage } from "../pages/EditListingPage";
import { useAuth } from "../context/AuthContext";
import AdminUsersPage from "../pages/AdminUsersPage";
// Restored routes - these pages still exist and are referenced by frontend
import { HeatMapPage } from "../pages/HeatMapPage";
import { YouWonPage } from "../pages/YouWonPage";
import { VehicleDetailPage } from "../pages/VehicleDetailPage";
import { EditVehiclePage } from "../pages/EditVehiclePage";
import { AddCardPage } from "../pages/AddCardPage";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISH_KEY);

// 🔒 Admin Route Wrapper (INLINE - no new file needed)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== "admin") {
    return <div className="p-10 text-center">Not authorized</div>;
  }

  return <>{children}</>;
};



export const AppRouter: React.FC = () => {
  console.log("APP ROUTER LOADED");

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Public browsing */}
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/listings/:id" element={<ListingDetailPage />} />
      <Route path="/favourites" element={<FavouritesPage />} />
      <Route path="/analytics" element={<AnalyticsDashboardPage />} />

      {/* Admin listing management view */}
      <Route
        path="/admin/listings"
        element={
          <AdminRoute>
            <ListingsPage />
          </AdminRoute>
        }
      />

      {/* Admin users management */}
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />

      {/* Auth-only routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/you-won/:listingId" element={<YouWonPage />} />
        <Route path="/vehicle/:vehicleId" element={<VehicleDetailPage />} />
        <Route path="/add-vehicle" element={<AddVehiclePage />} />
        <Route
          path="/add-card"
          element={
            <Elements stripe={stripePromise}>
              <AddCardPage />
            </Elements>
          }
        />
        <Route path="/edit-vehicle/:vehicleId" element={<EditVehiclePage />} />
        <Route path="/add-listing" element={<AddListingPage />} />
        <Route path="/heatmap" element={<HeatMapPage />} />
        <Route path="/seller/:sellerId/analytics" element={<SellerAnalyticsPage />} />
        <Route path="/edit-listing/:listingId" element={<EditListingPage />} />
      </Route>
    </Routes>
  );
};