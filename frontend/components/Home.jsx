import { useState, useEffect } from "react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [role, setRole] = useState("enthusiast");
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashType, setFlashType] = useState("");

  useEffect(() => {
    if (flashMessage) {
      setTimeout(() => setFlashMessage(null), 5000);
    }
  }, [flashMessage]);

  return (
    <>
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        {/* Flash Messages */}
        {flashMessage && (
          <div
            className={`fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg transition-opacity duration-300 opacity-100 border-l-4 ${
              flashType === "success" ? "border-green-500" : "border-red-500"
            }`}
          >
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-800">{flashMessage}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex mb-8 border-b">
          <button
            className={`flex-1 py-3 text-lg font-semibold text-center border-b-2 transition-colors duration-200 ${
              activeTab === "login" ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 text-lg font-semibold text-center border-b-2 transition-colors duration-200 ${
              activeTab === "register" ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form action="/login" method="POST" className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">Email</label>
              <input type="email" name="email" className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Password</label>
              <input type="password" name="password" className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
              Login
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form action="/register" method="POST" className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">Name</label>
              <input type="text" name="name" className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Email</label>
              <input type="email" name="email" className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Password</label>
              <input type="password" name="password" className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Role</label>
              <select
                name="role"
                className="w-full px-4 py-2 border rounded-lg"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="enthusiast">Enthusiast</option>
                <option value="researcher">Researcher</option>
                <option value="scientist">Scientist</option>
              </select>
            </div>
            {(role === "researcher" || role === "scientist") && (
              <div>
                <div>
                  <label className="block text-gray-700 font-medium">Degree</label>
                  <input type="file" name="degree" className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium">Research Paper</label>
                  <input type="file" name="researchPaper" className="w-full px-4 py-2 border rounded-lg" required />
                </div>
              </div>
            )}
            <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">
              Register
            </button>
          </form>
        )}
      </div>
    </div>
    </>
  );
}