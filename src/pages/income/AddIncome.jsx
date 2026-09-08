import { useEffect, useState } from "react";
import {
  loadContactsFromBackend,
  loadBanksFromBackend,
  loadCategoriesFromBackend,
  saveTransactionToBackend,
  ensureDefaultsOnBackend,
} from "../../utils/backendData";

import "../../css/AddIncome.css";

const STATIC_ASSET_CATEGORIES = [
  {
    group: "Bank",
    items: ["Bank FD", "Bank RD", "Bonds", "NPS", "ESPO", "PPF", "SIF"],
  },
  { group: "Jwelary", items: ["Gold", "Silver", "Platinum", "Diamond"] },
  {
    group: "Stocks",
    items: ["Ind Stock", "US Stock", "Mutual Fund", "Bitcoin"],
  },
  { group: "Property", items: ["Vehicle", "Plot", "Flat", "Land"] },
  {
    group: "Insurance",
    items: [
      "Life Insurance",
      "Health Insurance",
      "Vehicle Insurance",
      "Term Insurance",
    ],
  },
];

const STATIC_LIABILITY_CATEGORIES = [
  {
    group: "Bills",
    items: [
      "Wi-Fi Bill",
      "Mobile Bill",
      "Electric Bill",
      "TV/OTT Bill",
      "Insurance",
    ],
  },
  { group: "Fees", items: ["School Fee", "Tuition Fee"] },
  {
    group: "Loan",
    items: [
      "Bank Loan",
      "Gold Loan",
      "Home Loan",
      "Vehicle Loan",
      "Education Loan",
    ],
  },
  { group: "", items: ["Credit Card"] },
];

const ALL_ASSET_CATEGORY_NAMES = STATIC_ASSET_CATEGORIES.flatMap(
  (section) => section.items,
);

const ALL_LIABILITY_CATEGORY_NAMES = STATIC_LIABILITY_CATEGORIES.flatMap(
  (section) => section.items,
);

function AddIncome() {
  const [users, setUsers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [backendCategories, setBackendCategories] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCategorySearch, setShowCategorySearch] = useState(false);

  const [formData, setFormData] = useState({
    type: "Expense",

    assetType: "",
    user: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    category: "",
    particular: "",
    amount: "",

    gstEnabled: false,
    gstPercent: "",
    gstNumber: "",

    tdsEnabled: false,
    tdsPercent: "",

    paymentStatus: "",
    billType: "",
    paymentMethod: "",
    bankAccount: "",
    transactionId: "",

    notes: "",
  });

  const [error, setError] = useState("");

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        await ensureDefaultsOnBackend();

        const [backendContacts, backendBanks, backendCats] = await Promise.all([
          loadContactsFromBackend(),
          loadBanksFromBackend(),
          loadCategoriesFromBackend(),
        ]);

        setUsers(backendContacts);
        setBankAccounts(backendBanks);
        setBackendCategories(backendCats);
      } catch (error) {
        setUsers([]);
        setBankAccounts([]);
        setBackendCategories([]);
      }
    };

    loadSettingsData();

    window.addEventListener("storage", loadSettingsData);
    window.addEventListener("focus", loadSettingsData);

    return () => {
      window.removeEventListener("storage", loadSettingsData);
      window.removeEventListener("focus", loadSettingsData);
    };
  }, []);

  useEffect(() => {
    const editTransaction = JSON.parse(localStorage.getItem("editTransaction"));

    if (!editTransaction) return;

    const cleanNotes = (editTransaction.notes || "").replace(
      /\s*\[(Asset|Liability)\]\s*$/i,
      "",
    );

    setEditId(editTransaction.id || null);

    const editCategory = editTransaction.category || "";

    const editAssetType = ALL_ASSET_CATEGORY_NAMES.includes(editCategory)
      ? "Assets"
      : ALL_LIABILITY_CATEGORY_NAMES.includes(editCategory)
        ? "Liabilities"
        : "";

    setFormData((prev) => ({
      ...prev,
      assetType: editAssetType,
      type: editAssetType ? "Expense" : editTransaction.type || prev.type,
      user: editTransaction.user || "",
      date: editTransaction.date || prev.date,
      dueDate: editTransaction.dueDate || "",
      category: editTransaction.category || "",
      particular: editTransaction.particular || "",
      amount: editTransaction.amount ? String(editTransaction.amount) : "",
      gstEnabled: Boolean(
        editTransaction.gstPercent || editTransaction.gstNumber,
      ),
      gstPercent: editTransaction.gstPercent
        ? String(editTransaction.gstPercent)
        : "",
      gstNumber: editTransaction.gstNumber || "",
      tdsEnabled: Boolean(editTransaction.tdsPercent),
      tdsPercent: editTransaction.tdsPercent
        ? String(editTransaction.tdsPercent)
        : "",
      paymentStatus: editTransaction.paymentStatus || "",
      billType: editTransaction.billType || "",
      paymentMethod: editTransaction.paymentMethod || "",
      bankAccount: editTransaction.bankAccount || "",
      transactionId: editTransaction.transactionId || "",
      notes: cleanNotes,
    }));
  }, []);

  useEffect(() => {
    const prefill = JSON.parse(localStorage.getItem("financialsPrefill"));

    if (!prefill) return;

    localStorage.removeItem("financialsPrefill");

    setFormData((prev) => ({
      ...prev,
      type: "Expense",
      assetType: prefill.assetType || "",
      category: prefill.category || "",
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (
        name === "paymentStatus" &&
        (value === "Installment" || value === "Income Refund")
      ) {
        updatedData.transactionId = "";
        updatedData.billType = "";
        updatedData.paymentMethod = "";
        updatedData.bankAccount = "";
      }

      if (name === "type") {
        updatedData.category = "";
      }

      if (name === "assetType") {
        updatedData.category = "";

        if (value === "Assets" || value === "Liabilities") {
          updatedData.type = "Expense";
        }
      }

      return updatedData;
    });
  };

  const filteredUsers = users.filter((user) =>
    (user.username || "").toLowerCase().includes(userSearch.toLowerCase()),
  );

  const categoryGroups =
    formData.assetType === "Assets"
      ? STATIC_ASSET_CATEGORIES
      : formData.assetType === "Liabilities"
        ? STATIC_LIABILITY_CATEGORIES
        : [
            {
              group: "",
              items: backendCategories
                .filter(
                  (c) =>
                    !c.transactionType ||
                    c.transactionType ===
                      (formData.type === "Income" ? "INCOME" : "EXPENSE"),
                )
                .map((c) => c.name),
            },
          ];

  const filteredCategoryGroups = categoryGroups
    .map((section) => ({
      ...section,
      items: section.items.filter((name) =>
        name.toLowerCase().includes(categorySearch.toLowerCase()),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const handleSelectUser = (username) => {
    setFormData((prev) => ({
      ...prev,
      user: username,
    }));

    setUserSearch("");
    setShowUserSearch(false);
  };

  const handleSelectCategory = (categoryName) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
    }));

    setCategorySearch("");
    setShowCategorySearch(false);
  };

  const amount = Number(formData.amount) || 0;

  const gstPercent = formData.gstEnabled ? Number(formData.gstPercent) || 0 : 0;

  const tdsPercent = formData.tdsEnabled ? Number(formData.tdsPercent) || 0 : 0;

  const gstAmount = (amount * gstPercent) / 100;

  const tdsAmount = (amount * tdsPercent) / 100;

  const total = amount + gstAmount - tdsAmount;

  const showTransactionId = formData.paymentStatus === "Complete";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user) {
      setError("Please select user.");
      return;
    }

    if (!formData.category) {
      setError("Please select category.");
      return;
    }

    if (!formData.particular.trim()) {
      setError("Please enter particular.");
      return;
    }

    if (!formData.amount || amount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (formData.gstEnabled && !formData.gstPercent) {
      setError("Please enter GST percentage.");
      return;
    }

    if (formData.tdsEnabled && !formData.tdsPercent) {
      setError("Please enter TDS percentage.");
      return;
    }

    if (!formData.paymentStatus) {
      setError("Please select payment status.");
      return;
    }

    if (formData.paymentStatus === "Complete") {
      if (!formData.billType) {
        setError("Please select bill type.");
        return;
      }

      if (!formData.paymentMethod) {
        setError("Please select payment method.");
        return;
      }
    }

    if (
      formData.paymentStatus === "Complete" &&
      !formData.transactionId.trim()
    ) {
      setError("Please enter transaction ID.");
      return;
    }

    setError("");

    const notesTag =
      formData.assetType === "Assets"
        ? " [Asset]"
        : formData.assetType === "Liabilities"
          ? " [Liability]"
          : "";

    const finalNotes =
      (formData.notes || "").replace(/\s*\[(Asset|Liability)\]\s*$/i, "") +
      notesTag;

    try {
      await saveTransactionToBackend(
        {
          ...formData,

          assetType: undefined,

          type: formData.type,

          notes: finalNotes,

          transactionId: showTransactionId ? formData.transactionId.trim() : "",

          amount,
          gstAmount,
          tdsAmount,
          total,
        },
        editId,
      );

      localStorage.removeItem("editTransaction");
      setEditId(null);

      window.dispatchEvent(new Event("transactionUpdated"));

      alert(
        editId
          ? "Transaction updated successfully!"
          : "Transaction added successfully!",
      );

      handleReset();
    } catch (error) {
      alert(error.message || "Could not save. Is the backend running?");
    }
  };

  const handleReset = () => {
    setFormData({
      type: "Expense",

      assetType: "",
      user: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      category: "",
      particular: "",
      amount: "",

      gstEnabled: false,
      gstPercent: "",
      gstNumber: "",

      tdsEnabled: false,
      tdsPercent: "",

      paymentStatus: "",
      billType: "",
      paymentMethod: "",
      bankAccount: "",
      transactionId: "",

      notes: "",
    });

    setUserSearch("");
    setCategorySearch("");

    setShowUserSearch(false);
    setShowCategorySearch(false);

    setError("");

    localStorage.removeItem("editTransaction");
    setEditId(null);
  };

  return (
    <div className="add-income-page">
      {error && <div className="form-error">{error}</div>}

      <form className="income-expense-form" onSubmit={handleSubmit}>
        <div className="type-row">
          <div className="floating-field">
            <label>Type</label>

            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="Expense">Expense</option>

              <option value="Income">Income</option>
            </select>
          </div>

          <div className="floating-field">
            <label>Assets / Liabilities</label>

            <select
              name="assetType"
              value={formData.assetType}
              onChange={handleChange}
            >
              <option value="">None</option>

              <option value="Assets">Assets</option>

              <option value="Liabilities">Liabilities</option>
            </select>
          </div>
        </div>

        <div className="floating-field search-field">
          <label>User</label>

          <div
            className="select-search-box"
            onClick={() => {
              setShowUserSearch((prev) => !prev);
              setShowCategorySearch(false);
            }}
          >
            <span
              className={formData.user ? "selected-value" : "placeholder-value"}
            >
              {formData.user || "Select User"}
            </span>

            <span className="select-arrow">▼</span>
          </div>

          {showUserSearch && (
            <div
              className="search-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                className="dropdown-search-input"
                placeholder="Search User..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                autoFocus
              />

              <div
                className="dropdown-item select-option"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    user: "",
                  }));

                  setUserSearch("");
                  setShowUserSearch(false);
                }}
              >
                Select User
              </div>

              {filteredUsers.length === 0 ? (
                <div className="dropdown-empty">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="dropdown-item"
                    onClick={() => handleSelectUser(user.username)}
                  >
                    {user.username}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="floating-field">
          <label>Date</label>

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />
        </div>

        <div className="floating-field search-field">
          <label>Category</label>

          <div
            className="select-search-box"
            onClick={() => {
              setShowCategorySearch((prev) => !prev);
              setShowUserSearch(false);
            }}
          >
            <span
              className={
                formData.category ? "selected-value" : "placeholder-value"
              }
            >
              {formData.category || "Select Category"}
            </span>

            <span className="select-arrow">▼</span>
          </div>

          {showCategorySearch && (
            <div
              className="search-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                className="dropdown-search-input"
                placeholder="Search Category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                autoFocus
              />

              <div
                className="dropdown-item select-option"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    category: "",
                  }));

                  setCategorySearch("");
                  setShowCategorySearch(false);
                }}
              >
                Select Category
              </div>

              {filteredCategoryGroups.length === 0 ? (
                <div className="dropdown-empty">No categories found</div>
              ) : (
                filteredCategoryGroups.map((section) => (
                  <div key={section.group || "direct"}>
                    {section.group && (
                      <div className="dropdown-group-label">
                        {section.group}
                      </div>
                    )}

                    {section.items.map((categoryName) => (
                      <div
                        key={categoryName}
                        className="dropdown-item"
                        onClick={() => handleSelectCategory(categoryName)}
                      >
                        {categoryName}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="floating-field">
          <label>Particular</label>

          <input
            type="text"
            name="particular"
            value={formData.particular}
            onChange={handleChange}
            placeholder="Enter particular"
          />
        </div>

        <div className="floating-field">
          <label>Total</label>

          <input type="number" value={total.toFixed(2)} readOnly />
        </div>

        <div className="floating-field">
          <label>Payment Status</label>

          <select
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
          >
            <option value="">Select Payment Status</option>

            <option value="Installment">Installment</option>

            <option value="Complete">Complete</option>

            <option value="Income Refund">Income Refund</option>
          </select>
        </div>

        <div className="amount-tax-row">
          <div className="floating-field">
            <label>Amount</label>

            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="tax-section">
            <label className="check-label">
              <input
                type="checkbox"
                name="gstEnabled"
                checked={formData.gstEnabled}
                onChange={handleChange}
              />

              <span>GST</span>
            </label>

            {formData.gstEnabled && (
              <>
                <div className="small-field">
                  <label>GST %</label>

                  <input
                    type="number"
                    name="gstPercent"
                    value={formData.gstPercent}
                    onChange={handleChange}
                    placeholder="%"
                    min="0"
                  />
                </div>

                <div className="small-field gst-number">
                  <label>GST Number</label>

                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="GST Number"
                  />
                </div>
              </>
            )}
          </div>

          <div className="tax-section">
            <label className="check-label">
              <input
                type="checkbox"
                name="tdsEnabled"
                checked={formData.tdsEnabled}
                onChange={handleChange}
              />

              <span>TDS</span>
            </label>

            {formData.tdsEnabled && (
              <div className="small-field">
                <label>TDS %</label>

                <input
                  type="number"
                  name="tdsPercent"
                  value={formData.tdsPercent}
                  onChange={handleChange}
                  placeholder="%"
                  min="0"
                />
              </div>
            )}
          </div>
        </div>

        {formData.paymentStatus === "Installment" && (
          <div className="floating-field">
            <label>Due Date</label>

            <input
              type="date"
              name="dueDate"
              value={formData.dueDate || ""}
              onChange={handleChange}
            />
          </div>
        )}

        {/* AFTER PAYMENT STATUS - फक्त Complete ला Bill Type,
            Payment Method, Bank Account, Transaction ID दिसतात */}

        {formData.paymentStatus === "Complete" && (
          <>
            <div className="floating-field">
              <label>Bill Type</label>

              <select
                name="billType"
                value={formData.billType}
                onChange={handleChange}
              >
                <option value="">Select Bill Type</option>

                <option value="Invoice">Invoice</option>

                <option value="Receipt">Receipt</option>
              </select>
            </div>

            <div className="floating-field">
              <label>Payment Method</label>

              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="">Select Payment Method</option>

                <option value="Cash">Cash</option>

                <option value="Bank">Bank</option>

                <option value="UPI">UPI</option>

                <option value="Card">Card</option>

                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* BANK ACCOUNT - Bank/UPI/Card/Cheque ला दिसतो,
                Cash ला नाही */}

            {formData.paymentMethod && formData.paymentMethod !== "Cash" && (
              <div className="floating-field">
                <label>Bank Account</label>

                <select
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                >
                  <option value="">Select Bank Account</option>

                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName || account.accountName || "Bank"}

                      {account.accountNumber
                        ? ` - ${account.accountNumber}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showTransactionId && (
              <div className="floating-field">
                <label>Transaction ID</label>

                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  placeholder="Transaction ID"
                />
              </div>
            )}
          </>
        )}

        <div className="floating-field notes-field">
          <label>Notes</label>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter notes"
          />
        </div>

        <div className="income-buttons">
          <button type="button" className="cancel-btn" onClick={handleReset}>
            CANCEL
          </button>

          <button type="submit" className="save-btn">
            {editId ? "UPDATE" : "SAVE"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddIncome;
