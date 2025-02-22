import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, UserCog } from 'lucide-react';
import { adminService } from '../../services/admin';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminRole, AdminUser } from '../../types/admin';
import { Button } from '../../components/ui/Button';
import { CreateAdminModal } from './components/CreateAdminModal';
import { EditAdminModal } from './components/EditAdminModal';

export default function AdminUsers() {
  const { permissions } = useAdmin();
  const [adminUsers, setAdminUsers] = useState<(AdminUser & { role: AdminRole })[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [users, rolesList] = await Promise.all([
        adminService.getAdminUsers(),
        adminService.getRoles()
      ]);
      setAdminUsers(users);
      setRoles(rolesList);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    fetchData();
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) {
      return;
    }

    try {
      await adminService.deleteAdminUser(user.id);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (!permissions.all && !permissions.users?.read) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Admin Users</h2>
        {(permissions.all || permissions.users?.write) && (
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<PlusCircle className="w-5 h-5" />}
          >
            Add Admin User
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {(permissions.all || permissions.users?.write) && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <UserCog className="w-5 h-5" />
                        </button>
                      )}
                      {permissions.all && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateAdminModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && selectedUser && (
        <EditAdminModal
          user={selectedUser}
          roles={roles}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}