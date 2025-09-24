import React, { useState, useEffect } from "react";
import {
  toursService,
  Tour,
  TourLevel,
  TourStatus,
  KeyPoint,
} from "../services/toursService";
import { useApiHandler } from "../utils/handleApi";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

// Leaflet / react-leaflet for map
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

// Map click helper
const MapClickPicker: React.FC<{
  active: boolean;
  onPick: (ll: L.LatLng) => void;
}> = ({ active, onPick }) => {
  useMapEvents({
    click: (e) => {
      if (!active) return;
      onPick(e.latlng);
    },
  });
  return null;
};

interface KeyPointForm {
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  imageFile: File | null;
}

const MyTours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const { user } = useAuth();
  const { loading, error, success, handleApi } = useApiHandler();
  const navigate = useNavigate();
  const [publishRequirements, setPublishRequirements] = useState<
    Record<string, { canPublish: boolean; missingRequirements: string[] }>
  >({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tourForm, setTourForm] = useState({
    name: "",
    description: "",
    level: TourLevel.Easy,
    price: 0,
    duration: 0,
    maxPeople: 0,
    tags: "",
  });

  // Key points state
  const [keyPoints, setKeyPoints] = useState<KeyPointForm[]>([]);
  const [activeKeyPointIndex, setActiveKeyPointIndex] = useState<number | null>(
    null
  );

  const emptyKeyPoint: KeyPointForm = {
    name: "",
    description: "",
    latitude: null,
    longitude: null,
    imageFile: null,
  };

  const mapCenter: [number, number] = [43.8563, 18.4131]; // Sarajevo default

  // Helper function to format travel time
  const formatTravelTime = (hours: number): string => {
    if (hours === 0) return "N/A";
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
        errorMessage: "Failed to load your tours",
      }
    );

    if (result) {
      setTours(result);

      // Check publish requirements for draft and archived tours
      const requirements: Record<
        string,
        { canPublish: boolean; missingRequirements: string[] }
      > = {};
      for (const tour of result) {
        if (tour.status === "Draft" || tour.status === "Archived") {
          try {
            const req = await toursService.checkPublishRequirements(tour.id);
            requirements[tour.id] = req;
          } catch (error) {
            console.error(
              `Failed to check requirements for tour ${tour.id}:`,
              error
            );
            requirements[tour.id] = {
              canPublish: false,
              missingRequirements: ["Error checking requirements"],
            };
          }
        }
      }
      setPublishRequirements(requirements);
    }
  };

  const handlePublish = async (tourId: string) => {
    // Check if tour can be published before attempting
    if (
      publishRequirements[tourId] &&
      !publishRequirements[tourId].canPublish
    ) {
      alert(
        `Cannot publish tour. Missing requirements: ${publishRequirements[
          tourId
        ].missingRequirements.join(", ")}`
      );
      return;
    }

    const result = await handleApi(() => toursService.publishTour(tourId), {
      successMessage: "Tour published successfully!",
      errorMessage: "Failed to publish tour",
    });
    if (result !== null) {
      loadMyTours();
    }
  };

  const handleArchive = async (tourId: string) => {
    const result = await handleApi(() => toursService.archiveTour(tourId), {
      successMessage: "Tour archived successfully!",
      errorMessage: "Failed to archive tour",
    });

    if (result !== null) {
      loadMyTours();
    }
  };

  // Key points management functions
  const addKeyPoint = () => {
    setKeyPoints([...keyPoints, { ...emptyKeyPoint }]);
  };

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
    if (activeKeyPointIndex === index) {
      setActiveKeyPointIndex(null);
    }
  };

  const updateKeyPoint = (index: number, updates: Partial<KeyPointForm>) => {
    const updatedKeyPoints = [...keyPoints];
    updatedKeyPoints[index] = { ...updatedKeyPoints[index], ...updates };
    setKeyPoints(updatedKeyPoints);
  };

  const handleMapClick = (latlng: L.LatLng) => {
    if (activeKeyPointIndex !== null) {
      updateKeyPoint(activeKeyPointIndex, {
        latitude: latlng.lat,
        longitude: latlng.lng,
      });
    }
  };

  const handleCreateTour = async () => {
    if (!user?.id) return;

    console.log("DEBUG: handleCreateTour called with keyPoints:", keyPoints);
    console.log("DEBUG: keyPoints.length:", keyPoints.length);

    // If there are key points, use multipart form data approach
    if (keyPoints.length > 0) {
      console.log("DEBUG: Using multipart approach");
      const formData = new FormData();

      // Add tour data
      formData.append("name", tourForm.name);
      formData.append("description", tourForm.description);
      formData.append("level", tourForm.level);
      formData.append("price", tourForm.price.toString());
      formData.append("duration", tourForm.duration.toString());
      formData.append("maxPeople", tourForm.maxPeople.toString());

      // Add tags array
      const tags = tourForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });

      // Add key points data
      keyPoints.forEach((keyPoint, index) => {
        if (
          keyPoint.name &&
          keyPoint.latitude !== null &&
          keyPoint.longitude !== null
        ) {
          console.log(`DEBUG: Adding key point ${index}:`, {
            name: keyPoint.name,
            description: keyPoint.description || "",
            latitude: keyPoint.latitude,
            longitude: keyPoint.longitude,
            hasImage: !!keyPoint.imageFile,
          });

          formData.append("keyPointNames[]", keyPoint.name);
          formData.append("keyPointDescriptions[]", keyPoint.description || "");
          formData.append("keyPointLatitudes[]", keyPoint.latitude.toString());
          formData.append(
            "keyPointLongitudes[]",
            keyPoint.longitude.toString()
          );

          if (keyPoint.imageFile) {
            formData.append("keyPointImages[]", keyPoint.imageFile);
          }
        }
      });

      const result = await handleApi(
        () => toursService.createTourWithKeyPoints(formData),
        {
          successMessage: "Tour with key points created successfully!",
          errorMessage: "Failed to create tour with key points",
        }
      );

      if (result) {
        setIsModalOpen(false);
        setTourForm({
          name: "",
          description: "",
          level: TourLevel.Easy,
          price: 0,
          duration: 0,
          maxPeople: 0,
          tags: "",
        });
        setKeyPoints([]);
        setActiveKeyPointIndex(null);
        loadMyTours();
      }
    } else {
      console.log("DEBUG: Using JSON approach (no key points)");
      // Original JSON approach for tours without key points
      const tourData = {
        name: tourForm.name,
        description: tourForm.description,
        level: tourForm.level,
        price: tourForm.price,
        duration: tourForm.duration,
        maxPeople: tourForm.maxPeople,
        tags: tourForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        status: TourStatus.Draft,
        guideID: user.id,
      };

      const result = await handleApi(() => toursService.createTour(tourData), {
        successMessage: "Tour created successfully!",
        errorMessage: "Failed to create tour",
      });

      if (result) {
        setIsModalOpen(false);
        setTourForm({
          name: "",
          description: "",
          level: TourLevel.Easy,
          price: 0,
          duration: 0,
          maxPeople: 0,
          tags: "",
        });
        loadMyTours();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Published":
        return "bg-green-100 text-green-800";
      case "Archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Easy":
        return "bg-blue-100 text-blue-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
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
          <p className="text-gray-500 mb-4">
            You haven't created any tours yet.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Create Your First Tour
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {tour.name}
                  </h3>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        tour.status
                      )}`}
                    >
                      {tour.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(
                        tour.level
                      )}`}
                    >
                      {tour.level}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{tour.description}</p>

                {tour.tags && tour.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tour.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
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
                    <span className="text-gray-500">Distance:</span>
                    <span className="font-medium text-blue-600">
                      {tour.distance
                        ? `${tour.distance.toFixed(2)} km`
                        : "No route"}
                    </span>
                  </div>
                  {tour.distance > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">🚶 On foot:</span>
                        <span className="font-medium text-gray-700">
                          {formatTravelTime(tour.travelTimeOnFoot || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">🚴 By bike:</span>
                        <span className="font-medium text-gray-700">
                          {formatTravelTime(tour.travelTimeBike || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">🚗 By car:</span>
                        <span className="font-medium text-gray-700">
                          {formatTravelTime(tour.travelTimeCar || 0)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium text-green-600">
                      ${tour.price}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/tour/${tour.id}`)}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    View
                  </button>

                  {tour.status === "Draft" && (
                    <div className="flex-1">
                      {publishRequirements[tour.id] &&
                      !publishRequirements[tour.id].canPublish ? (
                        <div>
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white px-3 py-2 rounded text-sm cursor-not-allowed"
                            title={`Missing: ${publishRequirements[
                              tour.id
                            ].missingRequirements.join(", ")}`}
                          >
                            Can't Publish
                          </button>
                          <div className="text-xs text-red-600 mt-1">
                            Missing:{" "}
                            {publishRequirements[
                              tour.id
                            ].missingRequirements.join(", ")}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePublish(tour.id)}
                          disabled={!publishRequirements[tour.id]?.canPublish}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  )}

                  {tour.status === "Published" && (
                    <button
                      onClick={() => handleArchive(tour.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Archive
                    </button>
                  )}

                  {tour.status === "Archived" && (
                    <div className="flex-1">
                      {publishRequirements[tour.id] &&
                      !publishRequirements[tour.id].canPublish ? (
                        <div>
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white px-3 py-2 rounded text-sm cursor-not-allowed"
                            title={`Missing: ${publishRequirements[
                              tour.id
                            ].missingRequirements.join(", ")}`}
                          >
                            Can't Republish
                          </button>
                          <div className="text-xs text-red-600 mt-1">
                            Missing:{" "}
                            {publishRequirements[
                              tour.id
                            ].missingRequirements.join(", ")}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePublish(tour.id)}
                          disabled={!publishRequirements[tour.id]?.canPublish}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Republish
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tour Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Tour"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tour Name
            </label>
            <input
              type="text"
              value={tourForm.name}
              onChange={(e) =>
                setTourForm({ ...tourForm, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tour name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={tourForm.description}
              onChange={(e) =>
                setTourForm({ ...tourForm, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tour description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={tourForm.level}
                onChange={(e) =>
                  setTourForm({
                    ...tourForm,
                    level: e.target.value as TourLevel,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={TourLevel.Easy}>Easy</option>
                <option value={TourLevel.Medium}>Medium</option>
                <option value={TourLevel.Hard}>Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                value={tourForm.price}
                onChange={(e) =>
                  setTourForm({
                    ...tourForm,
                    price: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                value={tourForm.duration}
                onChange={(e) =>
                  setTourForm({
                    ...tourForm,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max People
              </label>
              <input
                type="number"
                value={tourForm.maxPeople}
                onChange={(e) =>
                  setTourForm({
                    ...tourForm,
                    maxPeople: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tourForm.tags}
              onChange={(e) =>
                setTourForm({ ...tourForm, tags: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="adventure, hiking, nature"
            />
          </div>

          {/* Key Points Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Key Points (Optional)
              </label>
              <button
                type="button"
                onClick={addKeyPoint}
                className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Key Point
              </button>
            </div>

            {keyPoints.length > 0 && (
              <div className="space-y-3">
                {keyPoints.map((keyPoint, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Key Point {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeKeyPoint(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={keyPoint.name}
                          onChange={(e) =>
                            updateKeyPoint(index, { name: e.target.value })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Key point name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Image (Optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            updateKeyPoint(index, {
                              imageFile: e.target.files?.[0] || null,
                            })
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs text-gray-600 mb-1">
                        Description
                      </label>
                      <textarea
                        value={keyPoint.description}
                        onChange={(e) =>
                          updateKeyPoint(index, { description: e.target.value })
                        }
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Key point description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          value={keyPoint.latitude || ""}
                          onChange={(e) =>
                            updateKeyPoint(index, {
                              latitude: parseFloat(e.target.value) || null,
                            })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.0000"
                          step="any"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          value={keyPoint.longitude || ""}
                          onChange={(e) =>
                            updateKeyPoint(index, {
                              longitude: parseFloat(e.target.value) || null,
                            })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.0000"
                          step="any"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveKeyPointIndex(
                          activeKeyPointIndex === index ? null : index
                        )
                      }
                      className={`w-full px-3 py-2 text-sm rounded transition-colors ${
                        activeKeyPointIndex === index
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {activeKeyPointIndex === index
                        ? "Click map to set location"
                        : "Set location on map"}
                    </button>
                  </div>
                ))}

                {/* Mini Map for setting key point locations */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b">
                    {activeKeyPointIndex !== null
                      ? `Click to set location for Key Point ${
                          activeKeyPointIndex + 1
                        }`
                      : "Select a key point above to set its location"}
                  </div>
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    scrollWheelZoom
                    className="h-[200px] w-full cursor-crosshair"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Show markers for key points with coordinates */}
                    {keyPoints.map((kp, idx) =>
                      kp.latitude !== null && kp.longitude !== null ? (
                        <Marker
                          key={idx}
                          position={[kp.latitude, kp.longitude]}
                        />
                      ) : null
                    )}
                    {/* Click handler for setting location */}
                    <MapClickPicker
                      active={activeKeyPointIndex !== null}
                      onPick={handleMapClick}
                    />
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTour}
              disabled={!tourForm.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Create Tour
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyTours;
