import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
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
          <h3 className="text-lg font-semibold mb-2 text-blue-600">Browse Tours</h3>
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

        {user?.role === 'Guide' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-green-600">My Tours</h3>
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

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-purple-600">Profile</h3>
          <p className="text-gray-600 mb-4">
            Update your profile and preferences
          </p>
          <button className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Available Tours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-gray-600">Active Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">4.8</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;