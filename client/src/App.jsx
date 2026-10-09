import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import MyListings from "./pages/MyListings.jsx";
import ListingForm from "./pages/ListingForm.jsx";
import ListingDetails from "./pages/ListingDetails.jsx";
import Chats from "./pages/Chats.jsx";
import Layout from "./components/Layout.jsx";
import { ProtectedRoute, GuestRoute } from "./components/RouteGuards.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Everything below needs a logged-in user and shows the navbar */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/listings/new" element={<ListingForm />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/listings/:id/edit" element={<ListingForm />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/:id" element={<Chats />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
