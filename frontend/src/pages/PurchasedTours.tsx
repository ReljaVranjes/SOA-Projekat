import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toursService } from "../services/toursService";
import { tourExecutionService } from "../services/tourExecutionService";
import { locationService } from "../services/locationService";
import PositionSimulator from "../components/PositionSimulator";

const PurchasedTours: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  type Tour = {
    id: string | number;
    name: string;
    description: string;
  };
  const [tours, setTours] = useState<Tour[]>([]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    toursService.getPurchasedTours()
      .then(data => setTours(data))
      .catch(() => setTours([]));
  }, [user]);

  useEffect(() => {
    // Try to fetch user's current location from backend
    locationService.getLocation()
      .then(loc => {
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          setCurrentLocation({ lat: loc.lat, lng: loc.lng });
        }
        setLocationLoaded(true);
      })
      .catch(() => setLocationLoaded(true));
  }, []);

  const openSimulator = () => setIsSimulatorOpen(true);
  const closeSimulator = () => setIsSimulatorOpen(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    closeSimulator();
  };

  const handleExecuteTour = async (tourId: string | number) => {
    if (!currentLocation) {
      alert("Please select your current location using the Position Simulator before executing a tour.");
      return;
    }
    try {
      const execution = await tourExecutionService.createTourExecution(
        String(tourId),
        currentLocation
      );
      navigate(`/tour-execution/${execution.id}`);
    } catch (error) {
      alert("Failed to start tour execution.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">My Purchased Tours</h2>
      {!locationLoaded ? (
        <div className="mb-4 text-gray-600">Loading location...</div>
      ) : (
        <>
          {!currentLocation ? (
            <button
              onClick={openSimulator}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Select Current Location
            </button>
          ) : (
            <button
              onClick={openSimulator}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Change Location
            </button>
          )}
          <PositionSimulator
            isOpen={isSimulatorOpen}
            onClose={closeSimulator}
            onLocationSelect={handleLocationSelect}
            currentLocation={currentLocation}
          />
          {currentLocation && (
            <div className="mb-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600">
                <div className="font-semibold text-gray-800">Current Location:</div>
                <div>Lat: {currentLocation.lat.toFixed(6)}</div>
                <div>Lng: {currentLocation.lng.toFixed(6)}</div>
              </div>
            </div>
          )}
        </>
      )}
      {(!tours || tours.length === 0) ? (
        <div className="text-gray-600">You have not purchased any tours yet.</div>
      ) : (
        <ul className="space-y-4">
          {tours.map((tour: any) => (
            <li key={tour.id} className="bg-white p-4 rounded shadow border">
              <div className="font-semibold">{tour.name}</div>
              <div className="text-gray-600">{tour.description}</div>
              <div className="flex gap-2 mt-2">
                <Link
                  to={`/tour/${tour.id}/details`}
                  className="text-blue-600 hover:underline"
                >
                  View Tour
                </Link>
                <button
                  onClick={() => handleExecuteTour(tour.id)}
                  className={`bg-green-600 text-white px-3 py-1 rounded transition-colors hover:bg-green-700 ${
                    !currentLocation ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!currentLocation}
                >
                  Execute Tour
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PurchasedTours;