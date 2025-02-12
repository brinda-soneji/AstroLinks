import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";

// Redirect Home component to /login by default
export default function Home() {
  return <Navigate to="/login" replace />;
}