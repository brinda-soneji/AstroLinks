import React from 'react';

const UserProfile = ({ user }) => {
  return (
    <>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <div className="container">
      <h1>Welcome, {user.name}!</h1>
      <div className="profile-header">
        <img
          src={user.profilePicture || '/uploads/images/default-avatar.png'}
          alt="Profile Picture"
          className="profile-picture"
        />
      </div>

      <div className="profile-card">
        <h2>Your Profile</h2>
        <ul>
          <li><strong>Name:</strong> {user.name}</li>
          <li><strong>Email:</strong> {user.email}</li>
          <li><strong>Role:</strong> {user.role}</li>
          {user.degree && <li><strong>Degree:</strong> {user.degree}</li>}
          {user.researchPaper && (
            <li><strong>Research Paper:</strong> <a href={user.researchPaper} target="_blank" rel="noopener noreferrer">View Paper</a></li>
          )}
          <li><strong>Account Approved:</strong> {user.isApproved ? 'Yes' : 'No'}</li>
          <li><strong>Account Created At:</strong> {new Date(user.createdAt).toDateString()}</li>
        </ul>

        <div className="actions">
          <a href={`/profile/${user._id}/edit-profile`} className="btn">Edit Profile</a>
          <a href="/logout" className="btn bg-red-800">Logout</a>
        </div>
      </div>
    </div>
    </>
  );
};

export default UserProfile;
