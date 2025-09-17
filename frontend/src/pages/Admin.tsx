import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/user';
import { adminService } from '../services/adminService';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load all users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await adminService.getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleBlockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminService.blockUser(userId);
      // Update the user status in the local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, status: 'Blocked' } : u
        )
      );
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminService.unblockUser(userId);
      // Update the user status in the local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, status: 'Active' } : u
        )
      );
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-red-100 mt-2">Manage user accounts and permissions</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-red-100">Total Users</div>
              <div className="text-2xl font-bold">{users.length}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    {/* User Info with Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {userData.profileImage ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={userData.profileImage}
                              alt={`${userData.firstName} ${userData.lastName}`}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-lg font-medium text-gray-600">
                                {userData.firstName?.charAt(0)?.toUpperCase() || 'U'}
                                {userData.lastName?.charAt(0)?.toUpperCase() || ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userData.firstName} {userData.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{userData.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.role === 'Admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : userData.role === 'Guide'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userData.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userData.status}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userData.email}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {userData.id !== user?.id && ( // Don't allow admin to block themselves
                        <div className="flex space-x-2">
                          {userData.status === 'Active' ? (
                            <button
                              onClick={() => handleBlockUser(userData.id)}
                              disabled={actionLoading === userData.id}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {actionLoading === userData.id ? 'Blocking...' : 'Block'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnblockUser(userData.id)}
                              disabled={actionLoading === userData.id}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {actionLoading === userData.id ? 'Unblocking...' : 'Unblock'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {users.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No users found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
