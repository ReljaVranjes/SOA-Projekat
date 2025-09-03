import React, { useState, useEffect } from 'react';
import { toursService, Tour } from '../services/toursService';
import { useApiHandler } from '../utils/handleApi';
import { useAuth } from '../contexts/AuthContext';

const MyTours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const { user } = useAuth();
  const { loading, error, success, handleApi } = useApiHandler();

  useEffect(() => {
    if (user?.id) {
      loadMyTours();
    }
  }, [user]);

  const loadMyTours = async () => {
    if (!user?.id) return;
    
    const result = await handleApi(
      () => toursService.getToursByGuide(user.id),
      {
        errorMessage: 'Failed to load your tours'
      }
    );
    
    if (result) {
      setTours(result);
    }
  };

  const handlePublish = async (tourId: string) => {
    const result = await handleApi(
      () => toursService.publishTour(tourId),
      {
        successMessage: 'Tour published successfully!',
        errorMessage: 'Failed to publish tour'
      }
    );
    
    if (result !== null) {
      loadMyTours();
    }
  };

  const handleArchive = async (tourId: string) => {
    const result = await handleApi(
      () => toursService.archiveTour(tourId),
      {
        successMessage: 'Tour archived successfully!',
        errorMessage: 'Failed to archive tour'
      }
    );
    
    if (result !== null) {
      loadMyTours();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Published': return 'bg-green-100 text-green-800';
      case 'Archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'bg-blue-100 text-blue-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tours</h1>
          <p className="text-gray-600">Manage your tours and create new ones</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          Create New Tour
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {tours.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 mb-4">You haven't created any tours yet.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
            Create Your First Tour
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <div key={tour._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-green-500 to-blue-600"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{tour.name}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tour.status)}`}>
                      {tour.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(tour.level)}`}>
                      {tour.level}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{tour.description}</p>
                
                {tour.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tour.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">{tour.duration} hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Max People:</span>
                    <span className="font-medium">{tour.maxPeople}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium text-green-600">${tour.price}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                    Edit
                  </button>
                  
                  {tour.status === 'Draft' && (
                    <button 
                      onClick={() => handlePublish(tour._id)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Publish
                    </button>
                  )}
                  
                  {tour.status === 'Published' && (
                    <button 
                      onClick={() => handleArchive(tour._id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTours;