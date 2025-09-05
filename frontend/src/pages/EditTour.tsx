import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toursService, Tour, KeyPoint } from '../services/toursService';

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

  // Tabs: 'tour' view vs 'keypoints' view
  const [activeTab, setActiveTab] = useState<'tour' | 'keypoints'>('tour');

  // ===== TOUR META (left/original) =====
  const [editMode, setEditMode] = useState(false);
  const [tourForm, setTourForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 0,
    maxPeople: 0,
    level: '',
    tags: [] as string[],
  });

  // ===== KEYPOINTS editor (right/new) =====
  const emptyForm: KPForm = { name: '', description: '', latitude: null, longitude: null, imageFile: null, imageUrl: null };
  const [form, setForm] = useState<KPForm>(emptyForm);
  const [mode, setMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [pickActive, setPickActive] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      const data = await toursService.getTourById(tourId!);
      setTour(data);
      setTourForm({
        name: (data as any).name,
        description: (data as any).description,
        price: (data as any).price,
        duration: (data as any).duration,
        maxPeople: (data as any).maxPeople,
        level: (data as any).level,
        tags: (data as any).tags,
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

  // Markers (shared by both tabs)
  const markers = useMemo(() => {
    return keypoints
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
    setMode('edit');
    setPickActive(false);
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
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-[420px] w-full rounded border">
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
              <button onClick={() => setEditMode(true)} className="bg-yellow-500 text-white px-4 py-2 rounded mt-4">Edit</button>
            </div>
          )}
        </>
      )}

      {/* === KEY POINTS TAB === */}
      {activeTab === 'keypoints' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold">Key Points</h2>
            <div className="flex items-center gap-2">
              <button onClick={startCreate} className="px-3 py-2 rounded bg-blue-600 text-white">New Key Point</button>
              <button
                onClick={startPick}
                className={`px-3 py-2 rounded border ${pickActive ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}
                title="Click then pick a position on the map"
              >
                Pick on map
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: List & Form */}
            <div className="lg:col-span-1">

              {/* Form */}
              <div className="border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-semibold">
                    {mode === 'create' ? 'Create key point' : mode === 'edit' ? 'Edit key point' : 'Select or create'}
                  </div>
                  {mode !== 'idle' && (
                    <button onClick={cancelKP} className="text-sm text-gray-600">Cancel</button>
                  )}
                </div>

                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium">Name*</label>
                    <input name="name" value={form.name} onChange={onFormChange} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea name="description" value={form.description} onChange={onFormChange} className="w-full p-2 border rounded" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium">Latitude*</label>
                      <input readOnly value={form.latitude ?? ''} className="w-full p-2 border rounded bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Longitude*</label>
                      <input readOnly value={form.longitude ?? ''} className="w-full p-2 border rounded bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Image</label>
                    <input type="file" accept="image/*" onChange={onImageChange} className="w-full" />
                    {(form.imageFile || form.imageUrl) && (
                      <div className="mt-2">
                        {form.imageFile ? (
                          <div className="text-xs text-gray-600">Selected: {form.imageFile.name}</div>
                        ) : form.imageUrl ? (
                          <img src={resolveImageUrl(form.imageUrl)} alt="KP" className="max-h-32 rounded border" />
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {mode === 'create' && (
                      <button type="button" onClick={saveCreate} className="px-3 py-2 rounded bg-green-600 text-white">Save new</button>
                    )}
                    {mode === 'edit' && (
                      <>
                        <button type="button" onClick={saveEdit} className="px-3 py-2 rounded bg-green-600 text-white">Save changes</button>
                        {form.id && (
                          <button type="button" onClick={() => removeKeyPoint({ ...(form as any), id: form.id } as any)} className="px-3 py-2 rounded bg-red-600 text-white">
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT: Map for picking (separate from Tour tab’s map) */}
            <div className="lg:col-span-2">
              {pickActive && (
                <div className="mb-2 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  Pick a position on the map.
                </div>
              )}
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                className={`h-[560px] w-full rounded border ${pickActive ? 'cursor-crosshair' : ''}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Existing markers */}
                {markers.map(m => (
                  <Marker key={m.id} position={[m.lat, m.lng]} eventHandlers={{ click: () => startEdit(m.kp) }} />
                ))}

                {/* Draft marker for current form coords */}
                {form.latitude != null && form.longitude != null && <Marker position={[form.latitude, form.longitude]} />}

                <MapClickPicker active={pickActive} onPick={onPick} />
              </MapContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EditTour;
