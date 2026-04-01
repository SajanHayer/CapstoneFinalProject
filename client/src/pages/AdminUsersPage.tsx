import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  email_verified: boolean;
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/admin/users", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: number, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${name}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(userId);

      const res = await fetch(
        `http://localhost:8080/api/auth/admin/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading users…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Users</h1>
      <p style={{ opacity: 0.75, marginBottom: 20 }}>
        View all users, their roles, verification status, and remove accounts.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
              <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>ID</th>
              <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>Role</th>
              <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                Verified
              </th>
              <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                Email Verified
              </th>
              <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: 20, textAlign: "center", opacity: 0.7 }}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {user.id}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {user.name}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {user.email}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {user.role}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {user.is_verified ? "Yes" : "No"}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    {user.email_verified ? "Yes" : "No"}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      disabled={deletingUserId === user.id}
                      type="button"
                    >
                      {deletingUserId === user.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;