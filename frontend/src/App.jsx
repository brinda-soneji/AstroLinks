import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Home from "../components/Home.jsx";
import Profile from "../components/Profile.jsx";

const App = () => {
  const [user, setUser] = useState(null); // Store user state

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home setUser={setUser} />} />
        <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
