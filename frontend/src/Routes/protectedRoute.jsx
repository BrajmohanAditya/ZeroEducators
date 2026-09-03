import { useUserStore } from "@/store/user.store";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export const ProtectedRoutes = ({ children, requireAdmin = false }) => {
  const { user, isCheckingAuth } = useUserStore();

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== "admin") {
    console.warn("Access Denied: You are not an admin!");
    return <Navigate to="/" replace />; // Kick them back to the homepage
  }

  return children;
};
