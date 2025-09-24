import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants/routes";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 relative">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to SOA Tours
        </h1>
        <p className="text-gray-600">
          Hello {user?.email}, you are logged in as a {user?.role}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-blue-600">
            Browse Tours
          </h3>
          <p className="text-gray-600 mb-4">
            Discover amazing tours and experiences
          </p>
          <Link
            to={ROUTES.TOURS}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View Tours
          </Link>
        </div>

        {user?.role === "Guide" && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-green-600">
              My Tours
            </h3>
            <p className="text-gray-600 mb-4">
              Manage your tours and create new ones
            </p>
            <Link
              to={ROUTES.MY_TOURS}
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Manage Tours
            </Link>
          </div>
        )}

        {user?.role === "Admin" && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              Admin Panel
            </h3>
            <p className="text-gray-600 mb-4">
              Manage users and system settings
            </p>
            <Link
              to={ROUTES.ADMIN}
              className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-purple-600">
            Follow Users
          </h3>
          <p className="text-gray-600 mb-4">
            Connect with other users and discover content
          </p>
          <Link
            to={ROUTES.FOLLOW_USERS}
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
          >
            Follow Users
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-indigo-600">
            Profile
          </h3>
          <p className="text-gray-600 mb-4">
            Update your profile and preferences
          </p>
          <Link
            to={ROUTES.PROFILE}
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        {user?.role === "Tourist" && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-orange-600">
              Purchased Tours
            </h3>
            <p className="text-gray-600 mb-4">
              View tours you have purchased
            </p>
            <Link
              to={ROUTES.PURCHASED_TOURS}
              className="inline-block bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
            >
              My Purchased Tours
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
