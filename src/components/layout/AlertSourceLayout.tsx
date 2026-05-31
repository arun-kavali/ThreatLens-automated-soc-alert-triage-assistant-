import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AlertSourceLayout() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth", { replace: true });
      } else if (role && role !== "alert_source") {
        // Non-alert-source users shouldn't access this
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  // Show loading only while actually loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, render nothing (redirect will happen)
  if (!user) {
    return null;
  }

  // If role is still null (not yet fetched), show loading
  if (role === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If user has wrong role, render nothing (redirect will happen)
  if (role !== "alert_source") {
    return null;
  }

  return <Outlet />;
}
