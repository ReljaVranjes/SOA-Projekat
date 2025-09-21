import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toursService, Tour, KeyPoint, TourLevel, TourStatus } from '../services/toursService';
import Modal from '../components/Modal';
import { useApiHandler } from '../utils/handleApi';

// Leaflet / react-leaflet
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons so they show up in bundlers like Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { resolveImageUrl } from '../utils/resolveImageUrl';

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

// Map click helper (used only in Key Points tab when picking coords)
const MapClickPicker: React.FC<{ active: boolean; onPick: (ll: L.LatLng) => void }> = ({ active, onPick }) => {
  useMapEvents({
    click: (e) => {
      if (!active) return;
      onPick(e.latlng);
    },
  });
  return null;
};

// ===== Side panel form model =====
interface KPForm {
  id?: string | number;
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  imageFile?: File | null;  // for upload
  imageUrl?: string | null; // existing image path from backend
}

const EditTour: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [keypoints, setKeypoints] = useState<KeyPoint[]>([]);
  const { loading: updateLoading, error: updateError, success: updateSuccess, handleApi } = useApiHandler();

  const [activeTab, setActiveTab] = useState<'tour' | 'keypoints'>('tour');

  const [editMode, setEditMode] = useState(false);
  const [isEditTourModalOpen, setIsEditTourModalOpen] = useState(false);
  const [isCreateKeypointModalOpen, setIsCreateKeypointModalOpen] = useState(false);
  const [isEditKeypointModalOpen, setIsEditKeypointModalOpen] = useState(false);
  const [tourForm, setTourForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 0,
    maxPeople: 0,
    level: TourLevel.Easy,
    tags: [] as string[] | string,
  });

  const emptyForm: KPForm = { name: '', description: '', latitude: null, longitude: null, imageFile: null, imageUrl: null };
  const [form, setForm] = useState<KPForm>(emptyForm);
  const [mode, setMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [pickActive, setPickActive] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      const data = await toursService.getTourById(tourId!);
      setTour(data);
      setTourForm({
        name: (data as any).name || '',
        description: (data as any).description || '',
        price: (data as any).price || 0,
        duration: (data as any).duration || 0,
        maxPeople: (data as any).maxPeople || 0,
        level: (data as any).level || TourLevel.Easy,
        tags: (data as any).tags || [],
      });
    };
    const fetchKeypoints = async () => {
      const keyPoints = await toursService.getKeyPointsByTour(tourId!);
      setKeypoints(keyPoints);
    };
    fetchTour();
    fetchKeypoints();
  }, [tourId]);

  const reloadKeypoints = async () => {
    const keyPoints = await toursService.getKeyPointsByTour(tourId!);
    setKeypoints(keyPoints);
  };

  const openEditTourModal = () => {
    if (tour) {
      setTourForm({
        name: tour.name || '',
        description: tour.description || '',
        price: tour.price || 0,
        duration: tour.duration || 0,
        maxPeople: tour.maxPeople || 0,
        level: tour.level || TourLevel.Easy,
        tags: tour.tags || [],
      });
      setIsEditTourModalOpen(true);
    }
  };

  const handleUpdateTour = async () => {
    if (!tourId) return;

    const tourData = {
      name: tourForm.name,
      description: tourForm.description,
      price: tourForm.price,
      duration: tourForm.duration,
      maxPeople: tourForm.maxPeople,
      level: tourForm.level,
      tags: Array.isArray(tourForm.tags) ? tourForm.tags : String(tourForm.tags).split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    const result = await handleApi(
      () => toursService.updateTour(tourId, tourData),
      {
        successMessage: 'Tour updated successfully!',
        errorMessage: 'Failed to update tour'
      }
    );

    if (result) {
      setTour(result);
      setIsEditTourModalOpen(false);
    }
  };

  // Markers (shared by both tabs)
  const markers = useMemo(() => {
    return (keypoints || [])
      .map((kp, i) => {
        const anyKp: any = kp;
        const lat = Number(anyKp.latitude);
        const lng = Number(anyKp.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        // support both image/imageURL on backend
        const rawImage = anyKp.imageURL ?? anyKp.image ?? null;

        return {
          index: i + 1,
          id: anyKp.id ?? i,
          kp,
          name: anyKp.name ?? `Tačka ${i + 1}`,
          imageUrl: rawImage ? resolveImageUrl(rawImage) : null,
          lat,
          lng,
        };
      })
      .filter(Boolean) as Array<{ index: number; id: string | number; kp: KeyPoint; name: string; imageUrl: string | null; lat: number; lng: number }>;
  }, [keypoints]);

  const mapCenter: [number, number] = markers.length ? [markers[0].lat, markers[0].lng] : [43.8563, 18.4131]; // Sarajevo

  // ===== TOUR handlers =====
  const handleTourChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTourForm((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' || name === 'maxPeople' ? Number(value) : value,
    }));
  };
  const handleSaveTour = async () => {
    // await toursService.updateTour(tourId!, tourForm);
    setEditMode(false);
  };

  // ===== KEYPOINTS handlers =====
  const onFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, imageFile: file }));
  };

  const startCreate = () => {
    setForm({ ...emptyForm });
    setMode('create');
    setPickActive(false);
  };
  const startEdit = (kp: KeyPoint) => {
    const anyKp: any = kp;
    setForm({
      id: anyKp.id,
      name: anyKp.name ?? '',
      description: anyKp.description ?? '',
      latitude: Number(anyKp.latitude) || null,
      longitude: Number(anyKp.longitude) || null,
      imageFile: null,
      imageUrl: anyKp.image ?? anyKp.imageURL ?? null,
    });
    setIsEditKeypointModalOpen(true);
  };
  const cancelKP = () => {
    setMode('idle');
    setForm({ ...emptyForm });
    setPickActive(false);
  };

  const startPick = () => setPickActive(true);
  const onPick = (ll: L.LatLng) => {
    if (!pickActive) return;
    setForm(prev => ({ ...prev, latitude: ll.lat, longitude: ll.lng }));
    setPickActive(false);
  };

  // Build FormData for backend (Create/Update)
  const buildFD = (m: KPForm) => {
    const fd = new FormData();
    if (m.name) fd.append('name', m.name);
    if (typeof m.description === 'string') fd.append('description', m.description);
    if (m.latitude != null) fd.append('latitude', String(m.latitude));
    if (m.longitude != null) fd.append('longitude', String(m.longitude));
    if (tourId) fd.append('tourId', tourId); // your backend requires TourID in body
    if (m.imageFile) fd.append('image', m.imageFile);
    return fd;
  };

  const saveCreate = async () => {
    if (!form.name.trim() || form.latitude == null || form.longitude == null) {
      alert('Naziv i koordinate su obavezni.');
      return;
    }
    const fd = buildFD(form);
    await toursService.createKeyPoint(tourId!, fd);
    await reloadKeypoints();
    cancelKP();
  };

  const saveEdit = async () => {
    if (!form.id) return;
    if (!form.name.trim() || form.latitude == null || form.longitude == null) {
      alert('Naziv i koordinate su obavezni.');
      return;
    }
    const fd = buildFD(form);
    await toursService.updateKeyPoint(String(form.id), fd, tourId!);
    await reloadKeypoints();
    cancelKP();
  };

  const removeKeyPoint = async (kp: KeyPoint) => {
    await toursService.deleteKeyPoint((kp as any).id, tourId!);
    await reloadKeypoints();
    if (mode !== 'idle' && form.id === (kp as any).id) cancelKP();
  };

  if (!tour) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow">
      {/* Tabs header */}
      <div className="flex items-center gap-2 border-b mb-4">
        <button
          className={`px-3 py-2 -mb-px border-b-2 ${activeTab === 'tour' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
          onClick={() => setActiveTab('tour')}
        >
          Tour
        </button>
        <button
          className={`px-3 py-2 -mb-px border-b-2 ${activeTab === 'keypoints' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
          onClick={() => setActiveTab('keypoints')}
        >
          Key Points
        </button>
      </div>

      {/* === TOUR TAB === */}
      {activeTab === 'tour' && (
        <>
          <h2 className="text-2xl font-bold mb-4">{tourForm.name || 'Tour Details'}</h2>

          <div className="mb-4">
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-[300px] w-full rounded border">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.map(m => (
                <Marker key={m.id} position={[m.lat, m.lng]} />
              ))}
            </MapContainer>
          </div>

          {editMode ? (
            <form className="space-y-4">
              <input name="name" value={tourForm.name} onChange={handleTourChange} className="w-full p-2 border" />
              <textarea name="description" value={tourForm.description} onChange={handleTourChange} className="w-full p-2 border" />
              <input name="price" type="number" value={tourForm.price} onChange={handleTourChange} className="w-full p-2 border" />
              <input name="duration" type="number" value={tourForm.duration} onChange={handleTourChange} className="w-full p-2 border" />
              <input name="maxPeople" type="number" value={tourForm.maxPeople} onChange={handleTourChange} className="w-full p-2 border" />
              <input name="level" value={tourForm.level} onChange={handleTourChange} className="w-full p-2 border" />
              <button type="button" onClick={handleSaveTour} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </form>
          ) : (
            <div>
              <p><strong>Name:</strong> {(tour as any).name}</p>
              <p><strong>Description:</strong> {(tour as any).description}</p>
              <p><strong>Price:</strong> ${(tour as any).price}</p>
              <p><strong>Duration:</strong> {(tour as any).duration} hours</p>
              <p><strong>Max People:</strong> {(tour as any).maxPeople}</p>
              <p><strong>Level:</strong> {(tour as any).level}</p>
              <button onClick={openEditTourModal} className="bg-yellow-500 text-white px-4 py-2 rounded mt-4">Edit Tour</button>
            </div>
          )}
        </>
      )}

      {/* === KEY POINTS TAB === */}
      {activeTab === 'keypoints' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Key Points</h2>
            <button
              onClick={() => setIsCreateKeypointModalOpen(true)}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Add Key Point
            </button>
          </div>

          {/* Existing Key Points List */}
          {keypoints && keypoints.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Existing Key Points ({keypoints.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {keypoints.map((kp, index) => {
                  const anyKp: any = kp;
                  const imageUrl = anyKp.imageURL ?? anyKp.image ?? null;
                  return (
                    <div key={anyKp.id ?? index} className="bg-white rounded-lg shadow-md border overflow-hidden">
                      {imageUrl && (
                        <img
                          src={resolveImageUrl(imageUrl)}
                          alt={anyKp.name}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-lg text-gray-900 mb-2">
                          {anyKp.name || `Key Point ${index + 1}`}
                        </h4>
                        {anyKp.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {anyKp.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 mb-3">
                          Coordinates: {Number(anyKp.latitude).toFixed(4)}, {Number(anyKp.longitude).toFixed(4)}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(kp)}
                            className="flex-1 px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeKeyPoint(kp)}
                            className="flex-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg mb-6">
              <p className="text-gray-500 mb-4">No key points added yet.</p>
              <button
                onClick={() => setIsCreateKeypointModalOpen(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add Your First Key Point
              </button>
            </div>
          )}

          {/* Map for viewing all keypoints */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">Map View</h3>
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom
              className="h-[350px] w-full rounded border"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Show all keypoint markers */}
              {markers.map(m => (
                <Marker key={m.id} position={[m.lat, m.lng]} />
              ))}
            </MapContainer>
          </div>

        </>
      )}

      {/* Edit Tour Modal */}
      <Modal
        isOpen={isEditTourModalOpen}
        onClose={() => setIsEditTourModalOpen(false)}
        title="Edit Tour"
        size="lg"
      >
        <div className="space-y-4">
          {updateError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {updateError}
            </div>
          )}

          {updateSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {updateSuccess}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tour Name
            </label>
            <input
              type="text"
              value={tourForm.name}
              onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })}
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
              onChange={(e) => setTourForm({ ...tourForm, description: e.target.value })}
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
                onChange={(e) => setTourForm({ ...tourForm, level: e.target.value as TourLevel })}
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
                onChange={(e) => setTourForm({ ...tourForm, price: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => setTourForm({ ...tourForm, duration: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => setTourForm({ ...tourForm, maxPeople: parseInt(e.target.value) || 0 })}
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
              value={Array.isArray(tourForm.tags) ? tourForm.tags.join(', ') : tourForm.tags}
              onChange={(e) => setTourForm({ ...tourForm, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="adventure, hiking, nature"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsEditTourModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTour}
              disabled={!tourForm.name.trim() || updateLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {updateLoading ? 'Updating...' : 'Update Tour'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Keypoint Modal */}
      <Modal
        isOpen={isCreateKeypointModalOpen}
        onClose={() => setIsCreateKeypointModalOpen(false)}
        title="Create New Key Point"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Point Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter key point name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  value={form.latitude || ''}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0000"
                  step="any"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  value={form.longitude || ''}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0000"
                  step="any"
                />
              </div>
            </div>

            {/* Mini map for location selection */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b">
                Click on the map to set location
              </div>
              <MapContainer
                center={form.latitude && form.longitude ? [form.latitude, form.longitude] : mapCenter}
                zoom={13}
                scrollWheelZoom
                className="h-[250px] w-full cursor-crosshair"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Show current selected location */}
                {form.latitude != null && form.longitude != null && (
                  <Marker position={[form.latitude, form.longitude]} />
                )}
                {/* Show existing keypoint markers for reference */}
                {markers.map(m => (
                  <Marker key={m.id} position={[m.lat, m.lng]} />
                ))}
                {/* Click handler for setting location */}
                <MapClickPicker
                  active={true}
                  onPick={(latlng) => setForm({ ...form, latitude: latlng.lat, longitude: latlng.lng })}
                />
              </MapContainer>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.imageFile && (
              <div className="mt-2 text-xs text-gray-600">
                Selected: {form.imageFile.name}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsCreateKeypointModalOpen(false);
                setForm(emptyForm);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                saveCreate();
                setIsCreateKeypointModalOpen(false);
              }}
              disabled={!form.name.trim() || form.latitude === null || form.longitude === null}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Create Key Point
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Keypoint Modal */}
      <Modal
        isOpen={isEditKeypointModalOpen}
        onClose={() => {
          setIsEditKeypointModalOpen(false);
          setForm(emptyForm);
        }}
        title="Edit Key Point"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Point Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter key point name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  value={form.latitude || ''}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0000"
                  step="any"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  value={form.longitude || ''}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0000"
                  step="any"
                />
              </div>
            </div>

            {/* Mini map for location selection */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b">
                Click on the map to change location
              </div>
              <MapContainer
                center={form.latitude && form.longitude ? [form.latitude, form.longitude] : mapCenter}
                zoom={13}
                scrollWheelZoom
                className="h-[250px] w-full cursor-crosshair"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Show current selected location */}
                {form.latitude != null && form.longitude != null && (
                  <Marker position={[form.latitude, form.longitude]} />
                )}
                {/* Show existing keypoint markers for reference */}
                {markers.map(m => (
                  <Marker key={m.id} position={[m.lat, m.lng]} />
                ))}
                {/* Click handler for setting location */}
                <MapClickPicker
                  active={true}
                  onPick={(latlng) => setForm({ ...form, latitude: latlng.lat, longitude: latlng.lng })}
                />
              </MapContainer>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            {form.imageUrl && !form.imageFile && (
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-2">Current image:</div>
                <img src={resolveImageUrl(form.imageUrl)} alt="Current" className="max-h-32 rounded border" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.imageFile && (
              <div className="mt-2 text-xs text-gray-600">
                New image selected: {form.imageFile.name}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsEditKeypointModalOpen(false);
                setForm(emptyForm);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => removeKeyPoint({ ...(form as any), id: form.id } as any)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => {
                saveEdit();
                setIsEditKeypointModalOpen(false);
              }}
              disabled={!form.name.trim() || form.latitude === null || form.longitude === null}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditTour;
