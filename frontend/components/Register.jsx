import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from 'prop-types';
import axios from '../src/config/axios';

export default function Register({ setUser }) {
  const [role, setRole] = useState("enthusiast");
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashType, setFlashType] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);
    
    console.log('Sending registration data:', userData);

    try {
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        const { user, token } = response.data;
        setUser({ ...user, token });
        localStorage.setItem('token', token);
        navigate("/profile");
      } else {
        setFlashMessage(response.data.message || "Registration failed");
        setFlashType("error");
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      setFlashMessage(error.response?.data?.message || "Registration failed!");
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
          <h2 className="text-2xl font-bold mb-4">Register</h2>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="text" 
            name="username" 
            placeholder="Username" 
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
            value={role}
            onChange={handleRoleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="enthusiast">Enthusiast</option>
            <option value="researcher">Researcher</option>
            <option value="scientist">Scientist</option>
          </select>

          {/* Conditional fields for researcher and scientist */}
          {(role === "researcher" || role === "scientist") && (
            <>
              <input 
                type="text" 
                name="degree" 
                placeholder="Highest Degree Obtained" 
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
            </>
          )}

          <button 
            type="submit" 
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors"
          >
            Register
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            Already have an account? Login here
          </Link>
        </div>
      </div>
    </div>
  );
} 

Register.propTypes = {
    setUser: PropTypes.func.isRequired
};
