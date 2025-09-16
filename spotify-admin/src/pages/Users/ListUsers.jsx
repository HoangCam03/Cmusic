import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { listUsers as fetchUsersService } from '../../services/UserService/ListUsersService'; // Import the service function

const ListUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Call the new service function
      const usersData = await fetchUsersService(); 
      setUsers(usersData);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      console.error("Error fetching users in component:", err);
      setError(err.message || 'An error occurred while fetching users');
      toast.error(err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading Users...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 bg-[#F3FFF7] min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">User List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Username</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Role</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Created At</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {users.map((user) => (
              <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="text-left py-3 px-4">{user.username}</td>
                <td className="text-left py-3 px-4">{user.email}</td>
                <td className="text-left py-3 px-4 capitalize">{user.role}</td>
                <td className="text-left py-3 px-4">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {/* Optional: Add pagination or search features here later */}
    </div>
  );
};

export default ListUsers; 