import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toursService, Tour } from '../services/toursService';
import { useApiHandler } from '../utils/handleApi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Tours: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cart } = useCart();
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const { loading, error, handleApi } = useApiHandler();

  useEffect(() => {
    loadTours();
  }, []);

  useEffect(() => {
    filterAndSortTours();
  }, [tours, levelFilter, searchTerm, sortBy]);

  const loadTours = async () => {
    const result = await handleApi(
      () => toursService.getAllTours(),
      {
        errorMessage: 'Failed to load tours'
      }
    );

    if (result) {
      const publishedTours = result.filter(tour => tour.status === 'Published');
      setTours(publishedTours);
    }
  };

  const filterAndSortTours = () => {
    let filtered = [...tours];

    // Filter by level
    if (levelFilter) {
      filtered = filtered.filter(tour => tour.level === levelFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tour =>
        tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tour.tags && tour.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Sort tours
    if (sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'duration') {
      filtered.sort((a, b) => a.duration - b.duration);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredTours(filtered);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddToCart = async (tour: Tour) => {
    setAddingToCart(tour.id);
    try {
      await addToCart(tour.id, tour.name, tour.price);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add tour to cart';
      alert(`Error: ${errorMessage}`);
    } finally {
      setAddingToCart(null);
    }
  };

  const isTourInCart = (tourId: string) => {
    const inCart = cart?.items?.some(item => item.tourId === tourId) || false;
    return inCart;
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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Tours</h1>
        <p className="text-gray-600">Discover amazing experiences with our guided tours</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Levels</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sort by</option>
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="duration">Duration</option>
        </select>

        <input
          type="text"
          placeholder="Search tours..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredTours.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tours found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <div key={tour.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{tour.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(tour.level)}`}>
                    {tour.level}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{tour.description}</p>

                {tour.tags && tour.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tour.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">${tour.price}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/tour/${tour.id}/details`)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>

                  {user?.role === 'Tourist' && (
                    <button
                      onClick={() => handleAddToCart(tour)}
                      disabled={addingToCart === tour.id || isTourInCart(tour.id)}
                      className={`flex-1 px-4 py-2 rounded transition-colors ${isTourInCart(tour.id)
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : addingToCart === tour.id
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {addingToCart === tour.id
                        ? 'Adding...'
                        : isTourInCart(tour.id)
                          ? 'In Cart'
                          : 'Add to Cart'
                      }
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

export default Tours;