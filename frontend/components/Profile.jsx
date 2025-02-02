import { useNavigate } from "react-router-dom";

const UserProfile = ({ user }) => {
  const navigate = useNavigate();

  // If user is null or undefined, redirect to home page
  if (!user) {
    navigate("/");
    return null; // Prevent rendering errors
  }

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.name || "Guest"}!</h1>
      <div className="profile-header">
        <img src={user?.profilePicture || "/uploads/images/default-avatar.png"} alt="Profile" className="w-24 h-24 rounded-full" />
      </div>
      <div className="profile-card bg-white p-4 shadow rounded mt-4">
        <h2 className="text-lg font-semibold">Your Profile</h2>
        <ul className="list-disc pl-6">
          <li><strong>Name:</strong> {user?.name || "N/A"}</li>
          <li><strong>Email:</strong> {user?.email || "N/A"}</li>
          <li><strong>Role:</strong> {user?.role || "N/A"}</li>
          {user?.degree && <li><strong>Degree:</strong> {user.degree}</li>}
          {user?.researchPaper && (
            <li><strong>Research Paper:</strong> <a href={user.researchPaper} target="_blank" rel="noopener noreferrer">View Paper</a></li>
          )}
          <li><strong>Account Approved:</strong> {user?.isApproved ? "Yes" : "No"}</li>
          <li><strong>Created At:</strong> {user?.createdAt ? new Date(user.createdAt).toDateString() : "N/A"}</li>
        </ul>
        <div className="actions mt-4">
          <a href={`/profile/${user?._id}/edit-profile`} className="btn">Edit Profile</a>
          <button onClick={handleLogout} className="btn bg-red-600 text-white px-4 py-2 rounded">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
