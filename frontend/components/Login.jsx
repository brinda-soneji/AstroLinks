import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from '../src/config/axios';
import PropTypes from 'prop-types';


export default function Login({ setUser }) {
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashType, setFlashType] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const userData = {
      email: formData.get('email').toLowerCase().trim(),
      password: formData.get('password')
    };
    
    try {
      setFlashMessage(null);
      setFlashType("");

      const response = await axios.post('/api/auth/login', userData);
      
      const { user, token } = response.data;
      
      if (user && token) {
        setUser({ ...user, token });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        navigate("/profile");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        setFlashMessage(error.response.data.message || "Invalid email or password");
      } else if (error.request) {
        setFlashMessage("Unable to connect to server. Please try again.");
      } else {
        setFlashMessage("An error occurred. Please try again.");
      }
      setFlashType("error");
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        {/* Display Flash Message */}
        {flashMessage && (
          <div className={`border-l-4 p-4 ${flashType === "success" ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}`}>
            <p>{flashMessage}</p>
          </div>
        )}

        <div className="flex mb-8 border-b">
          <h2 className="text-2xl font-bold mb-4">Login</h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAuth} className="space-y-4">
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

        <div className="mt-4 text-center">
          <Link to="/register" className="text-blue-600 hover:text-blue-800">
            Don't have an account? Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  setUser: PropTypes.func.isRequired,
};
