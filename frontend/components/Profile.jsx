import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function Profile({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-2xl">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // Format the date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        {/* Basic information shown for all users */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Username</h2>
            <p>{user.username}</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">Email</h2>
            <p>{user.email}</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">Role</h2>
            <p className="capitalize">{user.role}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Account Status</h2>
            <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              user.isApproved 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.isApproved ? 'Approved' : 'Pending Approval'}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Member Since</h2>
            <p>{formatDate(user.createdAt)}</p>
          </div>

          {/* Additional information only shown for researchers and scientists */}
          {(user.role === 'researcher' || user.role === 'scientist') && (
            <>
              <div>
                <h2 className="text-xl font-semibold">Degree</h2>
                <p>{user.degree}</p>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold">Research Paper</h2>
                <a 
                  href={user.researchPaper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Research Paper
                </a>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold">Research Description</h2>
                <p>{user.researchDescription}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Profile.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    isApproved: PropTypes.bool,
    createdAt: PropTypes.string,
    degree: PropTypes.string,
    researchPaper: PropTypes.string,
    researchDescription: PropTypes.string
  })
};