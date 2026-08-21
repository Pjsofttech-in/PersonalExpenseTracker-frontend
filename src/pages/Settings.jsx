import { useEffect, useState } from "react";
import {
  FaFolder,
  FaUser,
  FaUniversity,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

import "../css/Settings.css";

function Settings() {
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [searchCategory, setSearchCategory] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchBank, setSearchBank] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({});

  // ==============================
  // LOAD DATA
  // ==============================

  useEffect(() => {
    setCategories(JSON.parse(localStorage.getItem("categories")) || []);
    setUsers(JSON.parse(localStorage.getItem("users")) || []);
    setBankAccounts(JSON.parse(localStorage.getItem("bankAccounts")) || []);
  }, []);

  // ==============================
  // FORM CHANGE
  // ==============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==============================
  // OPEN ADD FORM
  // ==============================

  const openAddForm = () => {
    setEditId(null);

    if (activeTab === "categories") {
      setFormData({
        name: "",
      });
    }

    if (activeTab === "users") {
      setFormData({
        username: "",
        phone: "",
        email: "",
      });
    }

    if (activeTab === "bankAccounts") {
      setFormData({
        bankName: "",
        accountName: "",
        accountNumber: "",
        accountType: "",
        ifscCode: "",
        branch: "",
      });
    }

    setShowForm(true);
  };

  // ==============================
  // OPEN EDIT FORM
  // ==============================

  const openEditForm = (item) => {
    setEditId(item.id);
    setFormData(item);
    setShowForm(true);
  };

  // ==============================
  // SAVE
  // ==============================

  const handleSave = () => {
    // CATEGORY
    if (activeTab === "categories") {
      if (!formData.name?.trim()) {
        alert("Please enter category name");
        return;
      }

      let updated;

      if (editId) {
        updated = categories.map((item) =>
          item.id === editId
            ? {
                ...item,
                name: formData.name.trim(),
              }
            : item,
        );
      } else {
        const newCategory = {
          id: Date.now(),
          name: formData.name.trim(),
        };

        updated = [...categories, newCategory];
      }

      setCategories(updated);
      localStorage.setItem("categories", JSON.stringify(updated));
    }

    // USER
    if (activeTab === "users") {
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

      let updated;

      if (editId) {
        updated = users.map((item) =>
          item.id === editId
            ? {
                ...item,
                username: formData.username.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
              }
            : item,
        );
      } else {
        const newUser = {
          id: Date.now(),
          username: formData.username.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
        };

        updated = [...users, newUser];
      }

      setUsers(updated);
      localStorage.setItem("users", JSON.stringify(updated));
    }

    // BANK ACCOUNT
    if (activeTab === "bankAccounts") {
      if (!formData.bankName?.trim()) {
        alert("Please enter bank name");
        return;
      }

      if (!formData.accountName?.trim()) {
        alert("Please enter account holder name");
        return;
      }

      if (!formData.accountNumber?.trim()) {
        alert("Please enter account number");
        return;
      }

      if (!formData.accountType) {
        alert("Please select account type");
        return;
      }

      if (!formData.ifscCode?.trim()) {
        alert("Please enter IFSC code");
        return;
      }

      let updated;

      if (editId) {
        updated = bankAccounts.map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
              }
            : item,
        );
      } else {
        const newBank = {
          id: Date.now(),
          ...formData,
        };

        updated = [...bankAccounts, newBank];
      }

      setBankAccounts(updated);
      localStorage.setItem("bankAccounts", JSON.stringify(updated));
    }

    setShowForm(false);
    setEditId(null);
    setFormData({});
  };

  // ==============================
  // DELETE
  // ==============================

  const deleteItem = (id, type) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?",
    );

    if (!confirmDelete) return;

    if (type === "category") {
      const updated = categories.filter((item) => item.id !== id);

      setCategories(updated);
      localStorage.setItem("categories", JSON.stringify(updated));
    }

    if (type === "user") {
      const updated = users.filter((item) => item.id !== id);

      setUsers(updated);
      localStorage.setItem("users", JSON.stringify(updated));
    }

    if (type === "bank") {
      const updated = bankAccounts.filter((item) => item.id !== id);

      setBankAccounts(updated);
      localStorage.setItem("bankAccounts", JSON.stringify(updated));
    }
  };

  // ==============================
  // FILTER
  // ==============================

  const filteredCategories = categories.filter((item) =>
    item.name?.toLowerCase().includes(searchCategory.toLowerCase()),
  );

  const filteredUsers = users.filter((item) =>
    item.username?.toLowerCase().includes(searchUser.toLowerCase()),
  );

  const filteredBanks = bankAccounts.filter(
    (item) =>
      item.bankName?.toLowerCase().includes(searchBank.toLowerCase()) ||
      item.accountName?.toLowerCase().includes(searchBank.toLowerCase()),
  );

  // ==============================
  // FORM TITLE
  // ==============================

  const getFormTitle = () => {
    if (activeTab === "categories") {
      return editId ? "Edit Category" : "Add Category";
    }

    if (activeTab === "users") {
      return editId ? "Edit User" : "Add User";
    }

    return editId ? "Edit Bank Account" : "Add Bank Account";
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        {/* LEFT SETTINGS MENU */}

        <div className="settings-menu">
          <button
            className={activeTab === "categories" ? "menu-active" : ""}
            onClick={() => setActiveTab("categories")}
          >
            <FaFolder />
            <span>Add Category</span>
          </button>

          <button
            className={activeTab === "users" ? "menu-active" : ""}
            onClick={() => setActiveTab("users")}
          >
            <FaUser />
            <span>Add User</span>
          </button>

          <button
            className={activeTab === "bankAccounts" ? "menu-active" : ""}
            onClick={() => setActiveTab("bankAccounts")}
          >
            <FaUniversity />
            <span>Add Bank Account</span>
          </button>
        </div>

        {/* MAIN CONTENT */}

        <div className="settings-main">
          {/* CATEGORY */}

          {activeTab === "categories" && (
            <div className="settings-section">
              <div className="search-total">
                <input
                  type="text"
                  placeholder="Search Category"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                />

                <div className="total-badge">
                  Total Categories: {categories.length}
                </div>

                <button className="add-btn" onClick={openAddForm}>
                  <FaPlus />
                  ADD CATEGORY
                </button>
              </div>

              <div className="settings-table">
                <div className="table-head category-grid">
                  <span>ID</span>
                  <span>Category Name</span>
                  <span>Actions</span>
                </div>

                {filteredCategories.length === 0 ? (
                  <div className="empty-row">No categories found</div>
                ) : (
                  filteredCategories.map((item) => (
                    <div className="table-data category-grid" key={item.id}>
                      <span>{item.id}</span>

                      <span
                        onDoubleClick={() => openEditForm(item)}
                        title="Double click to edit"
                        style={{ cursor: "pointer" }}
                      >
                        {item.name}
                      </span>

                      <span className="actions">
                        <FaTrash
                          className="delete-icon"
                          onClick={() => deleteItem(item.id, "category")}
                        />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* USERS */}

          {activeTab === "users" && (
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
                  filteredUsers.map((item) => (
                    <div className="table-data user-grid" key={item.id}>
                      <span>{item.id}</span>

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
                        <FaTrash
                          className="delete-icon"
                          onClick={() => deleteItem(item.id, "user")}
                        />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* BANK ACCOUNTS */}

          {activeTab === "bankAccounts" && (
            <div className="settings-section">
              <div className="search-total">
                <input
                  type="text"
                  placeholder="Search Bank Account"
                  value={searchBank}
                  onChange={(e) => setSearchBank(e.target.value)}
                />

                <div className="total-badge">
                  Total Accounts: {bankAccounts.length}
                </div>

                <button className="add-btn" onClick={openAddForm}>
                  <FaPlus />
                  ADD BANK ACCOUNT
                </button>
              </div>

              <div className="settings-table">
                <div className="table-head bank-grid">
                  <span>ID</span>
                  <span>Bank Name</span>
                  <span>Account Holder</span>
                  <span>Account Number</span>
                  <span>Account Type</span>
                  <span>IFSC</span>
                  <span>Actions</span>
                </div>

                {filteredBanks.length === 0 ? (
                  <div className="empty-row">No bank accounts found</div>
                ) : (
                  filteredBanks.map((item) => (
                    <div className="table-data bank-grid" key={item.id}>
                      <span>{item.id}</span>

                      <span
                        onDoubleClick={() => openEditForm(item)}
                        title="Double click to edit"
                        style={{ cursor: "pointer" }}
                      >
                        {item.bankName}
                      </span>

                      <span>{item.accountName}</span>

                      <span>
                        ****
                        {item.accountNumber?.slice(-4)}
                      </span>

                      <span>{item.accountType}</span>

                      <span>{item.ifscCode}</span>

                      <span className="actions">
                        <FaTrash
                          className="delete-icon"
                          onClick={() => deleteItem(item.id, "bank")}
                        />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP FORM */}

      {showForm && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="modal-header">
              <h2>{getFormTitle()}</h2>

              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setFormData({});
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* CATEGORY FORM */}

            {activeTab === "categories" && (
              <div className="modal-form">
                <label>Category Name *</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="Enter category name"
                />
              </div>
            )}

            {/* USER FORM */}

            {activeTab === "users" && (
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
            )}

            {/* BANK FORM */}

            {activeTab === "bankAccounts" && (
              <div className="modal-form bank-form">
                <label>Bank Name *</label>

                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName || ""}
                  onChange={handleChange}
                  placeholder="Enter bank name"
                />

                <label>Account Holder Name *</label>

                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName || ""}
                  onChange={handleChange}
                  placeholder="Enter account holder name"
                />

                <label>Account Number *</label>

                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber || ""}
                  onChange={handleChange}
                  placeholder="Enter account number"
                />

                <label>Account Type *</label>

                <select
                  name="accountType"
                  value={formData.accountType || ""}
                  onChange={handleChange}
                >
                  <option value="">Select Account Type</option>

                  <option value="Savings">Savings</option>

                  <option value="Current">Current</option>

                  <option value="Salary">Salary</option>

                  <option value="Other">Other</option>
                </select>

                <label>IFSC Code *</label>

                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode || ""}
                  onChange={handleChange}
                  placeholder="Enter IFSC code"
                />

                <label>Branch</label>

                <input
                  type="text"
                  name="branch"
                  value={formData.branch || ""}
                  onChange={handleChange}
                  placeholder="Enter branch name"
                />
              </div>
            )}

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setFormData({});
                }}
              >
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

export default Settings;
