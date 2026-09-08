import { useEffect, useState } from "react";
import {
  FaFolder,
  FaUniversity,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

import {
  loadCategoriesFromBackend,
  loadBanksFromBackend,
} from "../utils/backendData";
import {
  apiAddCategory,
  apiDeleteCategory,
  apiAddBank,
  apiDeleteBank,
} from "../utils/api";

import "../css/Settings.css";

function Settings() {
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [searchCategory, setSearchCategory] = useState("");
  const [searchBank, setSearchBank] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({});

  const loadAll = async () => {
    try {
      const [backendCategories, backendBanks] = await Promise.all([
        loadCategoriesFromBackend(),
        loadBanksFromBackend(),
      ]);

      setCategories(backendCategories);
      setBankAccounts(backendBanks);
    } catch (error) {
      setCategories([]);
      setBankAccounts([]);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditId(null);

    if (activeTab === "categories") {
      setFormData({
        name: "",
        transactionType: "EXPENSE",
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

  const openEditForm = (item) => {
    setEditId(item.id);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (activeTab === "categories") {
      if (!formData.name?.trim()) {
        alert("Please enter category name");
        return;
      }
    }

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
    }

    try {
      if (activeTab === "categories") {
        if (editId) {
          await apiDeleteCategory(editId);
        }

        await apiAddCategory(
          formData.name.trim(),
          formData.transactionType || "EXPENSE",
        );
      }

      if (activeTab === "bankAccounts") {
        const payload = {
          name: formData.bankName.trim(),
          branch: formData.branch?.trim() || "",
          accountNumber: formData.accountNumber.trim(),
          ifsc: formData.ifscCode.trim(),
          accountType: formData.accountType
            ? formData.accountType.toUpperCase()
            : "SAVINGS",
          openingBalance: 0,
        };

        if (editId) {
          await apiDeleteBank(editId);
        }

        try {
          await apiAddBank(payload);
        } catch (error) {
          if (
            payload.accountType === "SALARY" ||
            payload.accountType === "OTHER"
          ) {
            throw new Error(
              "Backend update required for Salary/Other account type. Please use Savings/Current until the backend AccountType enum is updated.",
            );
          }
          throw error;
        }
      }

      await loadAll();

      setShowForm(false);
      setEditId(null);
      setFormData({});
    } catch (error) {
      alert(error.message || "Save failed. Is the backend running?");
    }
  };

  const deleteItem = async (id, type) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?",
    );

    if (!confirmDelete) return;

    try {
      if (type === "category") {
        await apiDeleteCategory(id);
      }

      if (type === "bank") {
        await apiDeleteBank(id);
      }

      await loadAll();
    } catch (error) {
      alert(
        error.message ||
          "Delete failed. (Category/Bank transaction मध्ये वापरलेली असेल तर delete होत नाही)",
      );
    }
  };

  const filteredCategories = categories.filter((item) =>
    item.name?.toLowerCase().includes(searchCategory.toLowerCase()),
  );

  const filteredBanks = bankAccounts.filter(
    (item) =>
      item.bankName?.toLowerCase().includes(searchBank.toLowerCase()) ||
      item.accountName?.toLowerCase().includes(searchBank.toLowerCase()),
  );

  const getFormTitle = () => {
    if (activeTab === "categories") {
      return editId ? "Edit Category" : "Add Category";
    }

    return editId ? "Edit Bank Account" : "Add Bank Account";
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        <div className="settings-menu">
          <button
            className={activeTab === "categories" ? "menu-active" : ""}
            onClick={() => setActiveTab("categories")}
          >
            <FaFolder />
            <span>Category</span>
          </button>

          <button
            className={activeTab === "bankAccounts" ? "menu-active" : ""}
            onClick={() => setActiveTab("bankAccounts")}
          >
            <FaUniversity />
            <span>Bank Account</span>
          </button>
        </div>

        <div className="settings-main">
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
                        <FaEdit
                          className="edit-icon"
                          title="Edit category"
                          onClick={() => openEditForm(item)}
                        />

                        <FaTrash
                          className="delete-icon"
                          title="Delete category"
                          onClick={() => deleteItem(item.id, "category")}
                        />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

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
                        <FaEdit
                          className="edit-icon"
                          title="Edit bank account"
                          onClick={() => openEditForm(item)}
                        />

                        <FaTrash
                          className="delete-icon"
                          title="Delete bank account"
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
