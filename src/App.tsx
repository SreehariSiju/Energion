import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import Firebase auth
import { onAuthStateChanged } from "firebase/auth";
// Using the '@' alias which is common in Vite projects to point to the 'src' directory
import { auth } from "@/firebase-config.js"; 

// Your page components using the '@' alias
import Index from "@/pages/Index.jsx";
import Auth from "@/pages/Auth.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import Plans from "@/pages/Plans.jsx";
import Charging from "@/pages/Charging.jsx";
import Profile from "@/pages/Profile.jsx";
import NotFound from "@/pages/NotFound.jsx";

const queryClient = new QueryClient();

// A wrapper to protect routes that require a user to be logged in
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    // If user is not logged in, redirect them to the auth page
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const App = () => {
  const [user, setUser] = useState(null); // To store user login info
  const [loading, setLoading] = useState(true); // To show a loading state

  // This is the core of our authentication.
  // It listens for changes in the user's login status.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // While Firebase is checking the auth status, we can show a loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p> {/* You can replace this with a nice spinner */}
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* --- PROTECTED ROUTES --- */}
            {/* These routes will only be accessible if the user is logged in */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute user={user}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plans" 
              element={
                <ProtectedRoute user={user}>
                  <Plans />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/charging" 
              element={
                <ProtectedRoute user={user}>
                  <Charging />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute user={user}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route for pages that don't exist */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

