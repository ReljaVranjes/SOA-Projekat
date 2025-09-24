import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { toursService, Tour, KeyPoint, Review, TourLevel } from '../services/toursService';
import { useAuth } from '../contexts/AuthContext';
import { useApiHandler } from '../utils/handleApi';
import Modal from '../components/Modal';
import { resolveImageUrl } from '../utils/resolveImageUrl';

// Leaflet imports
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet markers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
(L.Marker as any).prototype.options.icon = DefaultIcon;

const TourDetails: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { user } = useAuth();
  const { loading, error, success, handleApi } = useApiHandler();

  const [tour, setTour] = useState<Tour | null>(null);
  const [keypoints, setKeypoints] = useState<KeyPoint[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isCreateReviewModalOpen, setIsCreateReviewModalOpen] = useState(false);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // State for purchased tours
  const [purchasedTourIds, setPurchasedTourIds] = useState<string[]>([]);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rate: 5,
    comment: '',
    tourDate: '',
    images: [] as File[]
  });

  useEffect(() => {
    if (tourId) {
      loadTourData();
      loadKeypoints();
      loadReviews();
    }
    // Fetch purchased tours for the user
    if (user?.role === 'Tourist') {
      toursService.getPurchasedTours()
        .then(data => setPurchasedTourIds(data.map((t: any) => t.id)))
        .catch(() => setPurchasedTourIds([]));
    }
  }, [tourId, user]);

  const loadTourData = async () => {
    const result = await handleApi(
      () => toursService.getTourById(tourId!),
      { errorMessage: 'Failed to load tour details' }
    );
    if (result) {
      setTour(result);
    }
  };

  const loadKeypoints = async () => {
    const result = await handleApi(
      () => toursService.getKeyPointsByTour(tourId!),
      { errorMessage: 'Failed to load keypoints' }
    );
    if (result) {
      setKeypoints(result);
    }
  };

  const loadReviews = async () => {
    const result = await handleApi(
      () => toursService.getReviewsByTour(tourId!),
      { errorMessage: 'Failed to load reviews' }
    );
    if (result) {
      setReviews(result);
    }
  };

  const handleCreateReview = async () => {
    if (!user?.id || !tourId) return;

    const formData = new FormData();
    formData.append('rate', reviewForm.rate.toString());
    formData.append('comment', reviewForm.comment);
    formData.append('tourDate', reviewForm.tourDate);
    
    reviewForm.images.forEach(image => {
      formData.append('images', image);
    });

    const result = await handleApi(
      () => toursService.createReview(tourId, formData),
      {
        successMessage: 'Review created successfully!',
        errorMessage: 'Failed to create review'
      }
    );

    if (result) {
      setIsCreateReviewModalOpen(false);
      setReviewForm({ rate: 5, comment: '', tourDate: '', images: [] });
      loadReviews();
    }
  };

  const handleEditReview = async () => {
    if (!editingReview?.id) return;

    const formData = new FormData();
    formData.append('rate', reviewForm.rate.toString());
    formData.append('comment', reviewForm.comment);
    formData.append('tourDate', reviewForm.tourDate);
    
    reviewForm.images.forEach(image => {
      formData.append('images', image);
    });

    const result = await handleApi(
      () => toursService.updateReview(editingReview.id, formData),
      {
        successMessage: 'Review updated successfully!',
        errorMessage: 'Failed to update review'
      }
    );

    if (result) {
      setIsEditReviewModalOpen(false);
      setEditingReview(null);
      setReviewForm({ rate: 5, comment: '', tourDate: '', images: [] });
      loadReviews();
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    const result = await handleApi(
      () => toursService.deleteReview(reviewId),
      {
        successMessage: 'Review deleted successfully!',
        errorMessage: 'Failed to delete review'
      }
    );

    if (result !== null) {
      loadReviews();
    }
  };

  const openEditReviewModal = (review: Review) => {
    setEditingReview(review);
    setReviewForm({
      rate: review.rate,
      comment: review.comment,
      tourDate: review.tourDate.split('T')[0], // Convert to YYYY-MM-DD format
      images: []
    });
    setIsEditReviewModalOpen(true);
  };

  // Helper to check if tour is purchased
  const isTourPurchased = (tourId: string) => {
    return purchasedTourIds.includes(tourId);
  };

  // Create map markers - only show markers for visible keypoints
  const markers = useMemo(() => {
    const visibleKeypoints = user?.role === 'Tourist' && !isTourPurchased(tourId!)
      ? (keypoints || []).slice(0, 1)
      : (keypoints || []);

    return visibleKeypoints
      .map((kp, i) => {
        const anyKp: any = kp;
        const lat = Number(anyKp.latitude);
        const lng = Number(anyKp.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return {
          index: i + 1,
          id: anyKp.id ?? i,
          name: anyKp.name ?? `Key Point ${i + 1}`,
          lat,
          lng
        };
      })
      .filter(Boolean) as Array<{index: number, id: any, name: string, lat: number, lng: number}>;
  }, [keypoints]);

  const mapCenter: [number, number] = markers.length > 0 
    ? [markers[0].lat, markers[0].lng] 
    : [44.7866, 20.4489]; // Belgrade default

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to format travel time
  const formatTravelTime = (hours: number): string => {
    if (hours === 0) return 'N/A';
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}min`;
    }
    if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return minutes > 0 ? `${wholeHours}h ${minutes}min` : `${wholeHours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rate, 0) / reviews.length 
    : 0;

  // Check if current user has already reviewed this tour
  const userHasReviewed = user && reviews.some(review => review.touristID === user.id);

  if (loading && !tour) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Tour not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tour Header */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{tour.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(tour.level)}`}>
                {tour.level}
              </span>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(averageRating))}
                  <span className="text-gray-600">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">${tour.price}</div>
            <div className="text-gray-600">{tour.duration} hours</div>
            <div className="text-gray-600">Max {tour.maxPeople} people</div>
            {tour.distance && tour.distance > 0 && (
              <div className="text-gray-600">{tour.distance.toFixed(1)} km</div>
            )}
          </div>
        </div>
        
        <p className="text-gray-700 text-lg leading-relaxed mb-6">{tour.description}</p>
        
        {tour.tags && tour.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tour.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Travel Times Section */}
        {tour.distance && tour.distance > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Travel Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-1">🚶‍♂️</div>
                <div className="text-sm text-gray-600">Walking</div>
                <div className="font-medium">{formatTravelTime(tour.travelTimeOnFoot || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🚴‍♂️</div>
                <div className="text-sm text-gray-600">Cycling</div>
                <div className="font-medium">{formatTravelTime(tour.travelTimeBike || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🚗</div>
                <div className="text-sm text-gray-600">Driving</div>
                <div className="font-medium">{formatTravelTime(tour.travelTimeCar || 0)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Points Section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Points</h2>
        
        {keypoints && keypoints.length > 0 ? (
          <>
            {/* Show message about keypoints visibility for tourists */}
            {user?.role === 'Tourist' && !isTourPurchased(tourId!) && keypoints.length > 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-3">
                    🔒
                  </div>
                  <div>
                    <h4 className="text-yellow-800 font-medium">Limited Preview</h4>
                    <p className="text-yellow-700 text-sm">
                      You're seeing only the first key point. Purchase this tour to see all {keypoints.length} key points and their details.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {(user?.role === 'Tourist' && !isTourPurchased(tourId!) ? keypoints.slice(0, 1) : keypoints).map((kp, index) => {
                const anyKp: any = kp;
                const imageUrl = anyKp.imageURL ?? anyKp.image ?? null;
                return (
                  <div key={anyKp.id ?? index} className="bg-gray-50 rounded-lg border overflow-hidden">
                    {imageUrl && (
                      <img 
                        src={resolveImageUrl(imageUrl)} 
                        alt={anyKp.name} 
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {anyKp.name || `Key Point ${index + 1}`}
                      </h3>
                      {anyKp.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {anyKp.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500">
                        Coordinates: {Number(anyKp.latitude).toFixed(4)}, {Number(anyKp.longitude).toFixed(4)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map */}
            <div className="border rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                className="h-[400px] w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map(m => (
                  <Marker key={m.id} position={[m.lat, m.lng]} />
                ))}
              </MapContainer>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No key points available for this tour.</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-gray-600">Average: {averageRating.toFixed(1)} ({reviews.length} reviews)</span>
              </div>
            )}
          </div>
          {user && user.role === 'Tourist' && !userHasReviewed && (
            <button 
              onClick={() => setIsCreateReviewModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Write Review
            </button>
          )}
          {user && user.role === 'Tourist' && userHasReviewed && (
            <div className="text-gray-500 text-sm">
              You have already reviewed this tour
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {renderStars(review.rate)}
                    <span className="font-medium">({review.rate}/5)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">
                      {formatDate(review.createdAt)}
                    </span>
                    {user && user.id === review.touristID && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditReviewModal(review)}
                          className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-800 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <div className="text-sm text-gray-500">
                  Tour Date: {formatDate(review.tourDate)}
                </div>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={resolveImageUrl(image)}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet for this tour.</p>
        )}
      </div>

      {/* Create Review Modal */}
      <Modal 
        isOpen={isCreateReviewModalOpen} 
        onClose={() => setIsCreateReviewModalOpen(false)} 
        title="Write Review"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewForm({ ...reviewForm, rate: i + 1 })}
                  className={`text-2xl transition-colors ${
                    i < reviewForm.rate ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">({reviewForm.rate}/5)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tour Date
            </label>
            <input
              type="date"
              value={reviewForm.tourDate}
              onChange={(e) => setReviewForm({ ...reviewForm, tourDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (optional)
            </label>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={(e) => setReviewForm({ ...reviewForm, images: Array.from(e.target.files || []) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            {reviewForm.images.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Selected: {reviewForm.images.length} image(s)
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsCreateReviewModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateReview}
              disabled={!reviewForm.comment.trim() || !reviewForm.tourDate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Submit Review
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Review Modal */}
      <Modal 
        isOpen={isEditReviewModalOpen} 
        onClose={() => {
          setIsEditReviewModalOpen(false);
          setEditingReview(null);
          setReviewForm({ rate: 5, comment: '', tourDate: '', images: [] });
        }} 
        title="Edit Review"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewForm({ ...reviewForm, rate: i + 1 })}
                  className={`text-2xl transition-colors ${
                    i < reviewForm.rate ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">({reviewForm.rate}/5)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tour Date
            </label>
            <input
              type="date"
              value={reviewForm.tourDate}
              onChange={(e) => setReviewForm({ ...reviewForm, tourDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add More Images (optional)
            </label>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={(e) => setReviewForm({ ...reviewForm, images: Array.from(e.target.files || []) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            {reviewForm.images.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Selected: {reviewForm.images.length} new image(s)
              </div>
            )}
            {editingReview && editingReview.images && editingReview.images.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Existing images:</p>
                <div className="flex gap-2">
                  {editingReview.images.map((image, index) => (
                    <img
                      key={index}
                      src={resolveImageUrl(image)}
                      alt={`Current image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Note: New images will be added to existing ones
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsEditReviewModalOpen(false);
                setEditingReview(null);
                setReviewForm({ rate: 5, comment: '', tourDate: '', images: [] });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditReview}
              disabled={!reviewForm.comment.trim() || !reviewForm.tourDate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Update Review
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TourDetails;