import React, { useState } from "react";
import { Link } from "react-router-dom";
import React from "react";

const EditProfile = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role || "enthusiast");
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || "/uploads/default-avatar.png");

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfilePicture(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onUpdate({ name, role, password, profilePicture });
  };

  return (
    <>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Edit Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-4">
            <img src={profilePicture} alt="Profile" className="w-32 h-32 rounded-full border-4 border-green-500 object-cover mb-2" />
            <label className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer">
              Choose Profile Picture
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-1">Name:</label>
            <input type="text" className="w-full px-3 py-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-1">Role:</label>
            <select className="w-full px-3 py-2 border rounded" value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="enthusiast">Enthusiast</option>
              <option value="researcher">Researcher</option>
              <option value="scientist">Scientist</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-1">New Password (leave blank if not changing):</label>
            <input type="password" className="w-full px-3 py-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">Save Changes</button>
        </form>
        <Link to="/profile" className="block text-center text-gray-600 mt-4">Cancel</Link>
      </div>
    </div>
    </>
  );
};

export default EditProfile;
