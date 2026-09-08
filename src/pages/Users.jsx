import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa";

import { loadContactsFromBackend } from "../utils/backendData";
import {
  apiAddContact,
  apiUpdateContact,
  apiDeleteContact,
} from "../utils/api";

import "../css/Settings.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});

  const loadUsers = async () => {
    try {
      setUsers(await loadContactsFromBackend());
    } catch (error) {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditId(null);
    setFormData({
      username: "",
      phone: "",
      email: "",
    });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditId(item.id);
    setFormData({
      username: item.username || "",
      phone: item.phone || "",
      email: item.email || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.username?.trim()) {
      alert("Please enter username");
      return;
    }

    if (!formData.phone?.trim()) {
      alert("Please enter phone number");
      return;
    }

    if (!formData.email?.trim()) {
      alert("Please enter email");
      return;
    }

    try {
      const payload = {
        name: formData.username.trim(),
        phoneNumber: formData.phone.trim(),
        email: formData.email.trim(),
      };

      if (editId) {
        await apiUpdateContact(editId, payload);
      } else {
        await apiAddContact(payload);
      }

      await loadUsers();
      closeForm();
    } catch (error) {
      alert(error.message || "Save failed. Is the backend running?");
    }
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmDelete) return;

    try {
      await apiDeleteContact(id);
      await loadUsers();
    } catch (error) {
      alert(error.message || "Delete failed.");
    }
  };

  const filteredUsers = users.filter((item) =>
    item.username?.toLowerCase().includes(searchUser.toLowerCase()),
  );

  return (
    <div className="settings-page">
      <div className="settings-content">
        <div className="settings-main">
          <div className="settings-section">
            <div className="search-total">
              <input
                type="text"
                placeholder="Search User"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />

              <div className="total-badge">Total Users: {users.length}</div>

              <button className="add-btn" onClick={openAddForm}>
                <FaPlus />
                ADD USER
              </button>
            </div>

            <div className="settings-table">
              <div className="table-head user-grid">
                <span>ID</span>
                <span>Username</span>
                <span>Phone Number</span>
                <span>Email</span>
                <span>Actions</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="empty-row">No users found</div>
              ) : (
                filteredUsers.map((item, index) => (
                  <div className="table-data user-grid" key={item.id}>
                    <span>{index + 1}</span>

                    <span
                      onDoubleClick={() => openEditForm(item)}
                      title="Double click to edit"
                      style={{ cursor: "pointer" }}
                    >
                      {item.username}
                    </span>

                    <span>{item.phone}</span>
                    <span>{item.email}</span>

                    <span className="actions">
                      <FaEdit
                        className="edit-icon"
                        title="Edit user"
                        onClick={() => openEditForm(item)}
                      />

                      <FaTrash
                        className="delete-icon"
                        title="Delete user"
                        onClick={() => deleteUser(item.id)}
                      />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="modal-header">
              <h2>{editId ? "Edit User" : "Add User"}</h2>

              <button className="close-btn" onClick={closeForm}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-form">
              <label>Username *</label>

              <input
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                placeholder="Enter username"
              />

              <label>Phone Number *</label>

              <input
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                placeholder="Enter phone number"
              />

              <label>Email *</label>

              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={closeForm}>
                CANCEL
              </button>

              <button className="save-btn" onClick={handleSave}>
                {editId ? "UPDATE" : "SAVE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
