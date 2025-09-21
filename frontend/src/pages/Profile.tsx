import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { User } from '../types/user';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  biography: string;
  motto: string;
  profileImage: string;
}

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    biography: '',
    motto: '',
    profileImage: '',
  });

  // Load user profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authService.getProfile();
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          biography: profile.biography || '',
          motto: profile.motto || '',
          profileImage: profile.profileImage || '',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedUser = await authService.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      // Success - form will show updated data
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error - form will remain in edit mode
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values by reloading from API
    const resetForm = async () => {
      try {
        const profile = await authService.getProfile();
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          biography: profile.biography || '',
          motto: profile.motto || '',
          profileImage: profile.profileImage || '',
        });
      } catch (error) {
        console.error('Error resetting form:', error);
      }
    };
    
    resetForm();
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-blue-100 mt-2">Manage your account information and preferences</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Role</div>
              <div className="text-lg font-semibold capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Image Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl text-gray-400">
                    {formData.firstName.charAt(0).toUpperCase()}
                    {formData.lastName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>


          {/* Profile Display / Edit Form */}
          {!isEditing ? (
            // View Mode - Display Profile Information
            <div className="space-y-6">
              {/* Profile Information Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">First Name</h3>
                  <p className="text-lg text-gray-900">{formData.firstName || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Name</h3>
                  <p className="text-lg text-gray-900">{formData.lastName || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Biography</h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {formData.biography || 'No biography provided'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Motto</h3>
                <p className="text-lg text-gray-900 italic">
                  {formData.motto || 'No motto provided'}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            // Edit Mode - Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Profile Image Upload */}
              <div>
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Convert file to data URL for preview
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setFormData(prev => ({
                          ...prev,
                          profileImage: event.target?.result as string || '',
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.profileImage && (
                  <div className="mt-2">
                    <img
                      src={formData.profileImage}
                      alt="Profile preview"
                      className="w-20 h-20 object-cover rounded-md border border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Biography */}
              <div>
                <label htmlFor="biography" className="block text-sm font-medium text-gray-700 mb-2">
                  Biography
                </label>
                <textarea
                  id="biography"
                  name="biography"
                  value={formData.biography}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Motto */}
              <div>
                <label htmlFor="motto" className="block text-sm font-medium text-gray-700 mb-2">
                  Motto
                </label>
                <input
                  type="text"
                  id="motto"
                  name="motto"
                  value={formData.motto}
                  onChange={handleInputChange}
                  placeholder="Your personal motto or tagline..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
