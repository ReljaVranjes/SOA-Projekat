import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toursService, Tour, KeyPoint } from '../services/toursService';

const EditTour: React.FC = () => {
  const { tourId } = useParams<{ tourId: string}>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [keypoints, setKeypoints] = useState<KeyPoint[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 0,
    maxPeople: 0,
    level: '',
    tags: [] as string[],
  });
  const [newKeyPoint, setNewKeyPoint] = useState('');

  useEffect(() => {
    const fetchTour = async () => {
      console.log(tourId)
      const data = await toursService.getTourById(tourId!);
      console.log(data)
      setTour(data);
      setForm({
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        maxPeople: data.maxPeople,
        level: data.level,
        tags: data.tags,
      });
    };
    const fetchKeypoints = async () => {
      const keyPoints = await toursService.getKeyPointsByTour(tourId!);
      setKeypoints(keyPoints);
    };
    fetchTour();
    fetchKeypoints();
  }, [tourId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' || name === 'maxPeople' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    //await toursService.updateTour(tourId!, form);
    setEditMode(false);
    // Optionally refetch tour
  };

  const handleAddKeyPoint = async () => {
    if (!newKeyPoint.trim()) return;
    //await toursService.createKeyPoint(tourId!, { text: newKeyPoint });
    setNewKeyPoint('');
    const keyPoints = await toursService.getKeyPointsByTour(tourId!);
    setKeypoints(keyPoints);
  };

  if (!tour) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Tour Details</h2>
      {editMode ? (
        <form className="space-y-4">
          <input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border" />
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 border" />
          <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full p-2 border" />
          <input name="duration" type="number" value={form.duration} onChange={handleChange} className="w-full p-2 border" />
          <input name="maxPeople" type="number" value={form.maxPeople} onChange={handleChange} className="w-full p-2 border" />
          <input name="level" value={form.level} onChange={handleChange} className="w-full p-2 border" />
          <button type="button" onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </form>
      ) : (
        <div>
          <p><strong>Name:</strong> {tour.name}</p>
          <p><strong>Description:</strong> {tour.description}</p>
          <p><strong>Price:</strong> ${tour.price}</p>
          <p><strong>Duration:</strong> {tour.duration} hours</p>
          <p><strong>Max People:</strong> {tour.maxPeople}</p>
          <p><strong>Level:</strong> {tour.level}</p>
          <button onClick={() => setEditMode(true)} className="bg-yellow-500 text-white px-4 py-2 rounded mt-4">Edit</button>
        </div>
      )}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Key Points</h3>
        <ul className="mb-4">
          {keypoints.map((keyPoints, idx) => (
            <li key={idx} className="border-b py-2">{keyPoints.name}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyPoint}
            onChange={e => setNewKeyPoint(e.target.value)}
            placeholder="Add key point..."
            className="p-2 border w-full"
          />
          <button onClick={handleAddKeyPoint} className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </div>
      </div>
    </div>
  );
};

export default EditTour;
