import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import PositionSimulator from '../components/PositionSimulator';
import { locationService } from '../services/locationService';
import { Location } from '../types/user';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load saved location from database and localStorage on component mount
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        // First try to get location from database
        const userProfile = await locationService.getProfile();
        if (userProfile.currentLocation) {
          setCurrentLocation(userProfile.currentLocation);
          localStorage.setItem('userLocation', JSON.stringify(userProfile.currentLocation));
        } else {
          // Fallback to localStorage if no database location
          const savedLocation = localStorage.getItem('userLocation');
          if (savedLocation) {
            try {
              const location = JSON.parse(savedLocation);
              setCurrentLocation(location);
            } catch (error) {
              console.error('Error parsing saved location:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user location:', error);
        // Fallback to localStorage on error
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            const location = JSON.parse(savedLocation);
            setCurrentLocation(location);
          } catch (parseError) {
            console.error('Error parsing saved location:', parseError);
          }
        }
      }
    };

    loadUserLocation();
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    const location: Location = { lat, lng };
    
    try {
      // Save to database
      await locationService.updateLocation(location);
      
      // Update local state and cache
      setCurrentLocation(location);
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      console.log('Location saved successfully to database');
    } catch (error) {
      console.error('Failed to save location to database:', error);
      
      // Fallback: save to localStorage only
      setCurrentLocation(location);
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      // Show user-friendly error message
      alert('Location saved locally. Please check your internet connection and try again to sync with the server.');
    }
  };

  const openSimulator = () => {
    setIsSimulatorOpen(true);
  };

  const closeSimulator = () => {
    setIsSimulatorOpen(false);
  };
  
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

        {user?.role === 'Admin' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Admin Panel</h3>
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
          <h3 className="text-lg font-semibold mb-2 text-purple-600">Profile</h3>
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

      {/* Position Simulator Button - Fixed in bottom right corner */}
      {user?.role === 'Tourist' && (
        <button
          onClick={openSimulator}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          title="Position Simulator"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}

      {/* Current Location Display */}
      {user?.role === 'Tourist' && currentLocation && (
        <div className="fixed bottom-6 left-6 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-40">
          <div className="text-sm text-gray-600">
            <div className="font-semibold text-gray-800">Current Location:</div>
            <div>Lat: {currentLocation.lat.toFixed(6)}</div>
            <div>Lng: {currentLocation.lng.toFixed(6)}</div>
          </div>
        </div>
      )}

      {/* Position Simulator Modal */}
      <PositionSimulator
        isOpen={isSimulatorOpen}
        onClose={closeSimulator}
        onLocationSelect={handleLocationSelect}
        currentLocation={currentLocation}
      />
    </div>
  );
};

export default Dashboard;