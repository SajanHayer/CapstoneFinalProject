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

      <Route
        path="/admin/listings"
        element={
          <AdminRoute>
            <ListingsPage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />

      {/* Auth-only */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/add-vehicle" element={<AddVehiclePage />} />
        <Route path="/add-listing" element={<AddListingPage />} />
        <Route path="/seller/:sellerId/analytics" element={<SellerAnalyticsPage />} />
        <Route path="/edit-listing/:listingId" element={<EditListingPage />} />
      </Route>
    </Routes>
  );
};