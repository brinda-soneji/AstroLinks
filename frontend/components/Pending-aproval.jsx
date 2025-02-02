import React from "react";
import { Link } from "react-router-dom";

const PendingApproval = ({ message }) => {
  return (
    <>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
        <p className="text-gray-700 mb-4">{message}</p>
        <div className="text-left">
          <p className="text-gray-600 mb-2">While you wait, you can:</p>
          <ul className="list-disc list-inside text-gray-700">
            <li>Review our guidelines</li>
            <li>Prepare your research materials</li>
            <li>Contact support if you have questions</li>
          </ul>
        </div>
        <Link to="/" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Back to Home
        </Link>
      </div>
    </div>
    </>
  );
};

export default PendingApproval;
