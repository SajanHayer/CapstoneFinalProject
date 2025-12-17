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

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/favourites" element={<FavouritesPage />} />
        <Route path="/add-vehicle" element={<AddVehiclePage />} />
      </Route>
    </Routes>
  );
};
