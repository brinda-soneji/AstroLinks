import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AuthPage({ setUser }) {
  const [activeTab, setActiveTab] = useState("login");
  const [role, setRole] = useState("enthusiast");
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashType, setFlashType] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e, type) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);
    
    try {
      const response = await axios.post(`/api/auth/${type}`, userData);
      
      if (response.data.success) {
        setUser(response.data.user);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        navigate("/profile");
      } else {
        setFlashMessage(response.data.message || "Authentication failed");
        setFlashType("error");
      }
    } catch (error) {
      setFlashMessage(error.response?.data?.message || "Authentication failed!");
      setFlashType("error");
    }
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        {flashMessage && (
          <div className={`border-l-4 ${flashType === "success" ? "border-green-500" : "border-red-500"} p-4`}>
            <p>{flashMessage}</p>
          </div>
        )}

        <div className="flex mb-8 border-b">
          <button 
            className={`flex-1 py-3 text-lg font-semibold ${activeTab === "login" ? "border-b-2 border-blue-500" : ""}`} 
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-3 text-lg font-semibold ${activeTab === "register" ? "border-b-2 border-blue-500" : ""}`} 
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {activeTab === "login" && (
          <form onSubmit={(e) => handleAuth(e, "login")} className="space-y-4">
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              className="w-full p-2 border rounded" 
              required 
            />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              className="w-full p-2 border rounded" 
              required 
            />
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        )}

        {activeTab === "register" && (
          <form onSubmit={(e) => handleAuth(e, "register")} className="space-y-4">
            <input 
              type="text" 
              name="name" 
              placeholder="Name" 
              className="w-full p-2 border rounded" 
              required 
            />
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              className="w-full p-2 border rounded" 
              required 
            />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              className="w-full p-2 border rounded" 
              required 
            />
            <select 
              name="role" 
              className="w-full p-2 border rounded" 
              value={role} 
              onChange={handleRoleChange}
            >
              <option value="enthusiast">Enthusiast</option>
              <option value="researcher">Researcher</option>
              <option value="scientist">Scientist</option>
            </select>

            {/* Conditional fields for researcher and scientist */}
            {(role === "researcher" || role === "scientist") && (
              <>
                <input 
                  type="file" 
                  name="degree" 
                  placeholder="Degree/Qualification" 
                  className="w-full p-2 border rounded" 
                  required 
                />
                <input 
                  type="url" 
                  name="researchPaper" 
                  placeholder="Link to Research Paper" 
                  className="w-full p-2 border rounded" 
                  required 
                />
                <p className="text-sm text-gray-600">
                  Note: Please provide a link to your published research paper or academic work.
                </p>
              </>
            )}

            <button 
              type="submit" 
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors"
            >
              Register
            </button>
          </form>
        )}
      </div>
    </div>
  );
}