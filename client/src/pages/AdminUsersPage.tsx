import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Shield,
  Trash2,
  User2,
  Users,
} from "lucide-react";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  email_verified: boolean;
};

const pillStyle = (background: string, color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  background,
  color,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.02em",
  border: "1px solid var(--border)",
});

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [search, setSearch] = useState("");

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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        String(user.id).includes(q),
    );
  }, [users, search]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      verifiedAccounts: users.filter((u) => u.is_verified).length,
      verifiedEmails: users.filter((u) => u.email_verified).length,
    };
  }, [users]);

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          color: "var(--text)",
        }}
      >
        Loading users…
      </div>
    );
  }

  return (
    <section
      style={{
        padding: "1.5rem 0 2rem",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "grid",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "1.5rem",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(124,58,237,0.16)), var(--card)",
            boxShadow: "var(--shadow)",
            backdropFilter: "var(--backdrop)",
            WebkitBackdropFilter: "var(--backdrop)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.16)",
                  border: "1px solid var(--border)",
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Shield size={16} />
                Admin Control Panel
              </div>

              <h1
                style={{
                  fontSize: "2rem",
                  margin: "0 0 8px",
                  color: "var(--text)",
                }}
              >
                User Management
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  maxWidth: 700,
                  lineHeight: 1.6,
                }}
              >
                Review platform users, check verification state, and remove
                accounts when necessary.
              </p>
            </div>

            <div
              style={{
                minWidth: 260,
                flex: "1 1 260px",
                maxWidth: 360,
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role, or ID..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--card2)",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            {
              label: "Total users",
              value: stats.total,
              icon: <Users size={18} />,
            },
            {
              label: "Admins",
              value: stats.admins,
              icon: <Shield size={18} />,
            },
            {
              label: "Verified accounts",
              value: stats.verifiedAccounts,
              icon: <CheckCircle2 size={18} />,
            },
            {
              label: "Verified emails",
              value: stats.verifiedEmails,
              icon: <Mail size={18} />,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "1rem 1.1rem",
                background: "var(--card)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "var(--accent)",
                  marginBottom: 10,
                }}
              >
                {item.icon}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: "1.7rem",
                  fontWeight: 800,
                  color: "var(--text)",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 24,
            overflow: "hidden",
            background: "var(--card)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--border)",
              background: "var(--card2)",
              color: "var(--muted)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"} shown
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    background: "rgba(127,127,127,0.08)",
                  }}
                >
                  {["User", "Email", "Role", "Account", "Email Status", "Actions"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid var(--border)",
                          color: "var(--muted)",
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 30,
                        textAlign: "center",
                        color: "var(--muted)",
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 14,
                              background:
                                "linear-gradient(135deg, var(--accent), var(--accent2))",
                              color: "white",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                              boxShadow: "0 10px 20px var(--ring)",
                            }}
                          >
                            <User2 size={18} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "var(--text)",
                                marginBottom: 2,
                              }}
                            >
                              {user.name}
                            </div>
                            <div
                              style={{
                                color: "var(--muted)",
                                fontSize: 13,
                              }}
                            >
                              ID #{user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      >
                        {user.email}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <span
                          style={
                            user.role === "admin"
                              ? pillStyle("rgba(124,58,237,0.16)", "var(--accent2)")
                              : pillStyle("rgba(37,99,235,0.14)", "var(--accent)")
                          }
                        >
                          <Shield size={13} />
                          {user.role}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <span
                          style={
                            user.is_verified
                              ? pillStyle("rgba(34,197,94,0.14)", "#16a34a")
                              : pillStyle("rgba(245,158,11,0.14)", "#d97706")
                          }
                        >
                          {user.is_verified ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          {user.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <span
                          style={
                            user.email_verified
                              ? pillStyle("rgba(34,197,94,0.14)", "#16a34a")
                              : pillStyle("rgba(239,68,68,0.14)", "var(--error)")
                          }
                        >
                          {user.email_verified ? <CheckCircle2 size={13} /> : <Mail size={13} />}
                          {user.email_verified ? "Email verified" : "Unverified"}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <button
                          onClick={() => openDeleteModal(user)}
                          disabled={deletingUserId === user.id}
                          type="button"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 14px",
                            borderRadius: 12,
                            border: "1px solid rgba(239,68,68,0.35)",
                            background: "rgba(239,68,68,0.10)",
                            color: "var(--error)",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          <Trash2 size={15} />
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
      </div>

      {showDeleteModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
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
              maxWidth: 520,
              background: "var(--cardSolid)",
              color: "var(--text)",
              borderRadius: 22,
              padding: 24,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>Delete User</h2>

            <p style={{ marginBottom: 8 }}>
              You are deleting <strong>{selectedUser.name}</strong>
            </p>

            <p style={{ marginTop: 0, marginBottom: 16, color: "var(--muted)" }}>
              {selectedUser.email}
            </p>

            <label
              htmlFor="delete-reason"
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 700,
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
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: 12,
                resize: "vertical",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                background: "var(--card2)",
                color: "var(--text)",
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
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card2)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontWeight: 700,
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
                  borderRadius: 12,
                  border: "1px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.12)",
                  color: "var(--error)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {deletingUserId === selectedUser.id ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminUsersPage;