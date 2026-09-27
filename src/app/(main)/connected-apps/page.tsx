import { Navigate } from "react-router";

export default function ConnectedAppsPage() {
  return <Navigate to="/settings?tab=tokens" replace />;
}
