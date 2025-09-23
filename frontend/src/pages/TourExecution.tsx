// TourExecutionPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { tourExecutionService } from '../services/tourExecutionService';
import PositionSimulator from '../components/PositionSimulator';
import { toursService } from '../services/toursService'; // Import toursService for keypoints
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface KeyPoint {
  keyPointId: string;
  name?: string;
  latitude: number;
  longitude: number;
  completedAt?: string;
}

function isWithinRadius(
  userLoc: { lat: number; lng: number },
  kpLoc: { lat: number; lng: number },
  radiusMeters = 1000
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(kpLoc.lat - userLoc.lat);
  const dLng = toRad(kpLoc.lng - userLoc.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(userLoc.lat)) *
      Math.cos(toRad(kpLoc.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusMeters;
}

// Helper for marker icons
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const keyPointIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [44, 44], // Make keypoints bigger
  iconAnchor: [22, 44],
});

function TourExecutionPage() {
  const { executionId } = useParams<{ executionId: string }>();
  const [execution, setExecution] = useState<any>(null);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [tourInfo, setTourInfo] = useState<any>(null); // Add state for tour info
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const mapRef = useRef<any>(null);

  // Fetch execution details and keypoints once
  useEffect(() => {
    if (executionId) {
      tourExecutionService.getTourExecutionById(executionId)
        .then(async data => {
          setExecution(data);
          const tour = await toursService.getTourById(data.tourId);
          setTourInfo(tour);
          const tourKeyPoints = await toursService.getKeyPointsByTour(data.tourId);
          const visited = (data.keyPoints || []).reduce((acc: Record<string, string>, kp: any) => {
            acc[kp.keyPointId] = kp.completedAt;
            return acc;
          }, {});
          const mergedKeyPoints = tourKeyPoints.map((kp: any) => ({
            keyPointId: kp.id || kp.keyPointId,
            name: kp.name,
            latitude: kp.latitude,
            longitude: kp.longitude,
            completedAt: visited[kp.id || kp.keyPointId],
          }));
          setKeyPoints(mergedKeyPoints);
        });
    }
  }, [executionId]);

  // Check proximity and mark keypoint as completed
  useEffect(() => {
    if (!currentLocation || !execution) return;
    if (checking) return;
    setChecking(true);

    const unresolved = keyPoints.filter(kp => !kp.completedAt);
    const found = unresolved.find(kp =>
      isWithinRadius(currentLocation, { lat: kp.latitude, lng: kp.longitude })
    );

    if (found) {
      tourExecutionService
        .addCompletedKeyPoint(execution.id || execution.ID, found.keyPointId)
        .then(() => {
          setKeyPoints(prev =>
            prev.map(kp =>
              kp.keyPointId === found.keyPointId
                ? { ...kp, completedAt: new Date().toISOString() }
                : kp
            )
          );
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
    // eslint-disable-next-line
  }, [currentLocation]);

  const openSimulator = () => setIsSimulatorOpen(true);
  const closeSimulator = () => setIsSimulatorOpen(false);

  // When user picks location, update state and run proximity check
  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
    closeSimulator();
    // Proximity check will run automatically via useEffect above
  };

  if (!execution) return <div>Učitavanje...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">
        Aktivna tura: {tourInfo ? tourInfo.name : execution.tourId}
      </h2>
      <p className="mb-2">Status: {execution.status}</p>
      <ul className="mb-4">
        {keyPoints.map((kp: any) => (
          <li key={kp.keyPointId}>
            {kp.name} - {kp.completedAt ? 'Kompletirano' : 'Nije kompletirano'}
          </li>
        ))}
      </ul>
      <div style={{ position: "relative" }}>
        {keyPoints.length > 0 && (
          <MapContainer
            center={[
              keyPoints[0].latitude,
              keyPoints[0].longitude
            ]}
            zoom={14}
            style={{ height: 400, width: '100%', borderRadius: 8, marginTop: 16 }}
            whenReady={() => {
              if (mapRef.current === null && window.L) {
                // Get the map instance from Leaflet's internal event
                const map = (window as any).L.Map._lastCreated;
                if (map) {
                  mapRef.current = map;
                }
              }
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {keyPoints.map((kp, idx) => (
              <Marker
                key={kp.keyPointId}
                position={[kp.latitude, kp.longitude]}
                icon={keyPointIcon}
              >
                <Popup>
                  <b>{kp.name}</b><br />
                  {kp.completedAt ? "Kompletirano" : "Nije kompletirano"}
                </Popup>
              </Marker>
            ))}
            {currentLocation && (
              <Marker
                position={[currentLocation.lat, currentLocation.lng]}
                icon={userIcon}
              >
                <Popup>
                  <b>Your Location</b>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
        {isSimulatorOpen && (
          <div style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            padding: "16px"
          }}>
            <PositionSimulator
              isOpen={isSimulatorOpen}
              onClose={closeSimulator}
              onLocationSelect={handleLocationSelect}
              currentLocation={currentLocation}
            />
          </div>
        )}
      </div>
      {currentLocation && (
        <div className="mt-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="font-semibold text-gray-800">Current Location:</div>
            <div>Lat: {currentLocation.lat.toFixed(6)}</div>
            <div>Lng: {currentLocation.lng.toFixed(6)}</div>
          </div>
        </div>
      )}
      <button
        onClick={openSimulator}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Open Position Simulator
      </button>
    </div>
  );
}

export default TourExecutionPage;