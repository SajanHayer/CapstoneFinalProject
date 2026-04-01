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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

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

  const openDeleteModal = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
    setDeleteReason("");
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    const trimmedReason = deleteReason.trim();

    if (!trimmedReason) {
      toast.error("Please enter a reason for deletion");
      return;
    }

    try {
      setDeletingUserId(selectedUser.id);

      const res = await fetch(
        `http://localhost:8080/api/auth/admin/users/${selectedUser.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: trimmedReason,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      closeDeleteModal();
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
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Admin Users</h1>
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
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
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
                      onClick={() => openDeleteModal(user)}
                      disabled={deletingUserId === user.id}
                      type="button"
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid #dc2626",
                        background: "white",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
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

      {showDeleteModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 500,
              background: "white",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>Delete User</h2>

            <p style={{ marginBottom: 8 }}>
              You are deleting <strong>{selectedUser.name}</strong>
            </p>

            <p style={{ marginTop: 0, marginBottom: 16, color: "#666" }}>
              {selectedUser.email}
            </p>

            <label
              htmlFor="delete-reason"
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Reason for deletion
            </label>

            <textarea
              id="delete-reason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={5}
              placeholder="Write the reason that will be emailed to the user..."
              style={{
                width: "100%",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                padding: 12,
                resize: "vertical",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={closeDeleteModal}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deletingUserId === selectedUser.id}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {deletingUserId === selectedUser.id
                  ? "Deleting..."
                  : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;