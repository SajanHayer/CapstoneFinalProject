import React from "react";
import { Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { AccountPage } from "../pages/AccountPage";
import { ListingsPage } from "../pages/ListingsPage";
import { ListingDetailPage } from "../pages/ListingDetailPage";
import { FavouritesPage } from "../pages/FavouritesPage";
import { AddVehiclePage } from "../pages/AddVehiclePage";
import { ProtectedRoute } from "../context/ProtectedRoute";
import { AddListingPage } from "../pages/AddListingPage";
import { HeatMapPage } from "../pages/HeatMapPage";


import { AnalyticsDashboardPage } from "../pages/AnalyticsDashboardPage";
import { SellerAnalyticsPage } from "../pages/SellerAnalyticsPage";
import { EditListingPage } from "../pages/EditListingPage";
import { VehicleDetailPage } from "../pages/VehicleDetailPage";
import { EditVehiclePage } from "../pages/EditVehiclePage";
import { YouWonPage } from "../pages/YouWonPage";

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Public browsing (Guest-friendly) */}
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/listings/:id" element={<ListingDetailPage />} />
      <Route path="/favourites" element={<FavouritesPage />} />
      <Route path="/analytics" element={<AnalyticsDashboardPage />} />

      {/* Auth-only */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/you-won/:listingId" element={<YouWonPage />} />
        <Route path="/vehicle/:vehicleId" element={<VehicleDetailPage />} />
        <Route path="/add-vehicle" element={<AddVehiclePage />} />
        <Route path="/edit-vehicle/:vehicleId" element={<EditVehiclePage />} />
        <Route path="/add-listing" element={<AddListingPage />} />
        <Route path="/heatmap" element={<HeatMapPage />} />
        <Route
          path="/seller/:sellerId/analytics"
          element={<SellerAnalyticsPage />}
        />
        <Route path="/edit-listing/:listingId" element={<EditListingPage />} />
      </Route>
    </Routes>
  );
};
