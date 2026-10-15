import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { FaInbox } from "react-icons/fa";

import {
  loadTransactionsFromBackend,
  deleteTransactionFromBackend,
  payInstallmentOnBackend,
} from "../utils/backendData";

import "../css/Settings.css";
import "../css/List.css";
import "../css/Liabilities.css";
import "../css/Assets.css";

const LIABILITY_PILLS = [
  {
    id: "BILLS",
    label: "Bills & Recharge",
    categories: [
      "Wi-Fi Bill",
      "Mobile Bill",
      "Electric Bill",
      "TV/OTT Bill",
      "Insurance",
      "School Fee",
      "Tuition Fee",
    ],
  },
  {
    id: "CARD",
    label: "Credit Card",
    categories: ["Credit Card"],
  },
  {
    id: "LOANS",
    label: "Loans",
    categories: [
      "Bank Loan",
      "Gold Loan",
      "Home Loan",
      "Vehicle Loan",
      "Education Loan",
    ],
  },
  {
    id: "OTHER",
    label: "Other Liabilities",
    categories: [],
  },
];

// सर्व ओळखीच्या liability categories एकत्र — "Other" pill च्या वगळणीसाठी
const ALL_PILL_CATEGORIES = LIABILITY_PILLS.flatMap(
  (pill) => pill.id !== "OTHER" && pill.categories,
).filter(Boolean);

// [Liability] tag असलेली record ओळखा (Add page मधून liability म्हणून add केलेली)
const isLiabilityTagged = (item) => (item.notes || "").includes("[Liability]");

// Pill नुसार record जुळवा: category जुळली तर त्या pill मध्ये;
// category ओळखीची नाही पण [Liability] tag आहे → "Other Liabilities" pill मध्ये
const matchesLiabilityPill = (item, pill) => {
  if (pill.id === "OTHER") {
    return (
      isLiabilityTagged(item) &&
      !ALL_PILL_CATEGORIES.includes(item.category || "")
    );
  }
  return pill.categories.includes(item.category || "");
};

function Liabilities() {
  const navigate = useNavigate();

  // शेवटची निवडलेली pill कायम राहते — page परत उघडलं तरी तिथूनच सुरू
  const [liabPill, setLiabPill] = useState(
    () => localStorage.getItem("liabLastPill") || "BILLS",
  );
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Installment popup
  const [installmentItem, setInstallmentItem] = useState(null);

  const [showAddInstallment, setShowAddInstallment] = useState(false);

  const [newInstallment, setNewInstallment] = useState({
    amount: "",
    dueDate: "",
    remark: "",
  });

  // MARK COMPLETE
  const [payingId, setPayingId] = useState(null);

  const [payMethod, setPayMethod] = useState("Cash");

  const [payTxnId, setPayTxnId] = useState("");

  const loadTransactions = async () => {
    try {
      const data = await loadTransactionsFromBackend();

      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      setTransactions([]);
    }
  };

  useEffect(() => {
    loadTransactions();

    // Add page वरून आलो तर — नवीन entry ज्या pill मध्ये आहे ती उघडा (एकवेळच)
    try {
      const hint = JSON.parse(localStorage.getItem("alPageHint") || "null");
      if (hint && hint.page === "liabilities") {
        const pill = LIABILITY_PILLS.find(
          (p) => p.id !== "OTHER" && p.categories.includes(hint.category || ""),
        );
        const target = pill ? pill.id : "OTHER";
        setLiabPill(target);
        localStorage.setItem("liabLastPill", target);
        localStorage.removeItem("alPageHint");
      }
    } catch (err) {
      /* hint चुकीचा असेल तर default pill */
    }

    const handleRefresh = () => loadTransactions();

    window.addEventListener("transactionUpdated", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      window.removeEventListener("transactionUpdated", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTransactionDate = (transaction) => {
    if (!transaction.date) return null;

    const date = new Date(transaction.date);
    date.setHours(0, 0, 0, 0);

    return date;
  };

  const getAmount = (item) => Number(item.total || item.amount || 0);

  const getPaid = (item) => {
    if (item.paymentStatus === "Complete") {
      return getAmount(item);
    }

    return Number(item.paid || 0);
  };

  const getPending = (item) => {
    if (item.paymentStatus === "Complete") {
      return 0;
    }

    const total = getAmount(item);
    const paid = getPaid(item);

    return Math.max(total - paid, 0);
  };

  const getFuturePending = (item) => {
    /* Installment entry — फक्त future due-dated
       unpaid installments ची बेरीज (उदा. पुढील EMI हप्ते) */
    const installments = item.installments || [];

    if (installments.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];

      return installments.reduce(
        (sum, inst) =>
          inst.status === "Completed" ||
          String(inst.dueDate || "").slice(0, 10) <= todayStr
            ? sum
            : sum + Number(inst.amount || 0),
        0,
      );
    }

    const transactionDate = getTransactionDate(item);

    if (!transactionDate) return 0;

    if (transactionDate > today) {
      return getPending(item);
    }

    return Number(item.futurePending || 0);
  };

  const fmtDate = (d) => {
    if (!d) return "-";

    const p = String(d).split("-");

    if (p.length !== 3) return d;

    return `${p[2]}-${p[1]}-${p[0]}`;
  };

  const formatAmount = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const activePill = LIABILITY_PILLS.find((pill) => pill.id === liabPill);

  const pillTransactions = transactions
    .filter((item) => matchesLiabilityPill(item, activePill))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const pillTotal = pillTransactions.reduce(
    (sum, item) => sum + getAmount(item),
    0,
  );

  const pillStats = LIABILITY_PILLS.map((pill) => {
    const txns = transactions.filter((item) =>
      matchesLiabilityPill(item, pill),
    );

    return {
      id: pill.id,
      label: pill.label,
      paid: txns.reduce((sum, item) => sum + getPaid(item), 0),
      unpaid: txns.reduce((sum, item) => sum + getPending(item), 0),
      amount: txns.reduce((sum, item) => sum + getAmount(item), 0),
    };
  });

  // "Other Liabilities" pill मध्ये त्या records च्याच खर्‍या categories दाखवा
  const activeCategories =
    activePill.id === "OTHER"
      ? [...new Set(pillTransactions.map((t) => t.category || "Uncategorised"))]
      : activePill.categories;

  const categoryStats = activeCategories.map((category) => {
    const amount = pillTransactions
      .filter((item) => (item.category || "") === category)
      .reduce((sum, item) => sum + getAmount(item), 0);

    const percent =
      pillTotal > 0 ? ((amount / pillTotal) * 100).toFixed(1) : "0.0";

    return { name: category, amount, percent };
  });
  const activePillId = liabPill;

  const handlePillClick = (pillId) => {
    setLiabPill(pillId);
    localStorage.setItem("liabLastPill", pillId);

    setCurrentPage(1);
  };

  const totalRows = pillTransactions.length;

  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * rowsPerPage;

  const pageTransactions = pillTransactions.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  const handleEdit = (item) => {
    localStorage.setItem("editTransaction", JSON.stringify(item));

    navigate("/income/add");
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?",
    );

    if (!confirmDelete) return;

    try {
      await deleteTransactionFromBackend(id);

      setTransactions(transactions.filter((item) => item.id !== id));

      window.dispatchEvent(new Event("transactionUpdated"));
    } catch (error) {
      alert(error.message || "Could not delete. Is the backend running?");
    }
  };

  // =========================
  // INSTALLMENT POPUP
  // =========================

  const openInstallment = (item) => {
    setInstallmentItem(item);

    setShowAddInstallment(false);

    setNewInstallment({
      amount: "",
      dueDate: "",
      remark: "",
    });

    setPayingId(null);
    setPayMethod("Cash");
    setPayTxnId("");
  };

  const closeInstallment = () => {
    setInstallmentItem(null);
  };

  // =========================
  // ADD INSTALLMENT
  // =========================

  const handleAddInstallment = (e) => {
    e.preventDefault();

    /* BACKEND MODE: installments transaction तयार
       करतानाच schedule मध्ये set होतात (backend ला
       add-installment endpoint नाही). नवीन
       installment हवा असेल तर transaction edit
       करा. */

    alert(
      "Installments are set when the transaction is created (2 auto installments). To change them, edit the transaction.",
    );

    setShowAddInstallment(false);
  };

  // =========================
  // MARK INSTALLMENT COMPLETE
  // =========================

  const handleOpenPayment = (instId) => {
    setPayingId(instId);
    setPayMethod("Cash");
    setPayTxnId("");
  };

  // =========================
  // CONFIRM PAYMENT
  // =========================

  const handleConfirmPayment = async (instId) => {
    if (!installmentItem) return;

    if (payMethod === "Bank Transfer" && !payTxnId.trim()) {
      alert("Please enter transaction ID.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const installments = installmentItem.installments || [];

    const targetInst = installments.find((i) => i.id === instId);

    if (!targetInst) return;

    if (targetInst.status === "Completed") return;

    try {
      /* BACKEND PAYMENT — installment वर amount
         जातो, backend status update करतो */

      await payInstallmentOnBackend(
        instId,
        targetInst.amount,
        todayStr,
        payTxnId.trim(),
      );

      /* Backend वरून पुन्हा सगळं load (paid/pending
         + status backend compute करतो) */

      const refreshed = await loadTransactionsFromBackend();

      setTransactions(refreshed);

      window.dispatchEvent(new Event("transactionUpdated"));

      const refreshedItem = refreshed.find((i) => i.id === installmentItem.id);

      setInstallmentItem(refreshedItem || null);

      setPayingId(null);
      setPayMethod("Cash");
      setPayTxnId("");

      if (refreshedItem && refreshedItem.pending <= 0) {
        alert(
          "All installments completed! 🎉 Receipt/Invoice is ready — check the Document column.",
        );
      }
    } catch (error) {
      alert(error.message || "Payment failed. Is the backend running?");
    }
  };

  const downloadDocument = (item) => {
    const documentTitle = item.billType === "Invoice" ? "INVOICE" : "RECEIPT";

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(25, 118, 210);
    doc.text(documentTitle, 105, 20, { align: "center" });

    doc.setDrawColor(200);
    doc.line(20, 26, 190, 26);

    const fields = [
      ["Date", item.date || "-"],
      ["Transaction ID", item.transactionId || "-"],
      ["Type", item.type || "-"],
      ["User", item.user || "-"],
      ["Category", item.category || "-"],
      ["Particular", item.particular || "-"],
      ["Amount", `Rs. ${Number(item.amount || 0).toLocaleString("en-IN")}`],
      ["GST", `Rs. ${Number(item.gstAmount || 0).toLocaleString("en-IN")}`],
      ["TDS", `Rs. ${Number(item.tdsAmount || 0).toLocaleString("en-IN")}`],
      ["Total", `Rs. ${getAmount(item).toLocaleString("en-IN")}`],
      ["Paid", `Rs. ${getPaid(item).toLocaleString("en-IN")}`],
      ["Pending", `Rs. ${getPending(item).toLocaleString("en-IN")}`],
      [
        "Future Pending",
        `Rs. ${getFuturePending(item).toLocaleString("en-IN")}`,
      ],
      ["Bill Type", item.billType || "-"],
      ["Payment Status", item.paymentStatus || "-"],
      ["Payment Method", item.paymentMethod || "-"],
      ["Bank Account", item.bankAccount || "-"],
      ["Notes", item.notes || "-"],
    ];

    let y = 38;

    fields.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(90);
      doc.text(`${label}:`, 20, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40);
      doc.text(String(value), 75, y);

      y += 8;
    });

    doc.setDrawColor(200);
    doc.line(20, y + 2, 190, y + 2);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(25, 118, 210);
    doc.text(`Current Status: ${item.paymentStatus || "Pending"}`, 20, y + 14);

    doc.save(`${documentTitle.toLowerCase()}-${item.id}.pdf`);
  };

  return (
    <div className="settings-page">
      <div className="settings-content assets-only">
        <div className="fin-pills fin-pills-lg">
          {pillStats.map((pill) => (
            <button
              key={pill.id}
              className={
                activePillId === pill.id ? "fin-pill active" : "fin-pill"
              }
              onClick={() => handlePillClick(pill.id)}
            >
              <span className="fin-pill-label">{pill.label}</span>

              <span className="fin-pill-amounts">
                <span className="pill-total">
                  Total: {formatAmount(pill.amount)}
                </span>
              </span>
            </button>
          ))}

          <span className="fin-list-total">
            Total: {formatAmount(pillTotal)}
          </span>
        </div>
        <div className="pill-category-cards">
          {categoryStats.map((category) => (
            <div className="pill-category-card" key={category.name}>
              <span className="pill-category-name">{category.name}</span>

              <span className="pill-category-stats">
                <span className="pill-category-percent">
                  {category.percent}%
                </span>

                <span className="pill-category-amount">
                  {formatAmount(category.amount)}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="list-table-wrapper">
          <div className="list-table">
            <div className="list-table-header">
              <span>Index</span>
              <span>Date</span>
              <span>User</span>
              <span>Category</span>
              <span>Particular</span>
              <span>Amount</span>
              <span>GST Amt</span>
              <span>TDS Amt</span>
              <span>Total</span>
              <span>Paid</span>
              <span>Pending</span>
              <span>Future Pending</span>
              <span>Due Date</span>
              <span>Bill Type</span>
              <span>Status</span>
              <span>Payment Mode</span>
              <span>Document</span>
              <span>Actions</span>
            </div>

            {pillTransactions.length === 0 ? (
              <div className="fin-empty-state">
                <FaInbox className="fin-empty-icon" />

                <p className="fin-empty-title">No Records Found</p>

                <p className="fin-empty-text">
                  Transactions added via Add Income/Expense will appear here
                </p>
              </div>
            ) : (
              pageTransactions.map((item, index) => (
                <div className="list-table-row" key={item.id}>
                  <span>{startIndex + index + 1}</span>

                  <span>{item.date || "-"}</span>

                  <span
                    className="user-link"
                    onDoubleClick={() => handleEdit(item)}
                    title="Double click to edit"
                  >
                    {item.user || "-"}
                  </span>

                  <span>{item.category || "-"}</span>

                  <span>{item.particular || "-"}</span>

                  <span>
                    ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                  </span>

                  <span>
                    ₹{Number(item.gstAmount || 0).toLocaleString("en-IN")}
                  </span>

                  <span>
                    ₹{Number(item.tdsAmount || 0).toLocaleString("en-IN")}
                  </span>

                  <span>₹{getAmount(item).toLocaleString("en-IN")}</span>

                  <span>₹{getPaid(item).toLocaleString("en-IN")}</span>

                  <span className="pending-value">
                    ₹{getPending(item).toLocaleString("en-IN")}
                  </span>

                  <span className="future-pending-value">
                    ₹{getFuturePending(item).toLocaleString("en-IN")}
                  </span>

                  <span>{fmtDate(item.dueDate)}</span>

                  <span>{item.billType || "-"}</span>

                  <span>
                    {/* Installments असलेल्या entry साठी button —
                        click केल्यावर popup उघडतं (List page प्रमाणे) */}
                    {(item.installments || []).length > 0 &&
                    item.paymentStatus !== "Complete" ? (
                      <button
                        type="button"
                        className="status-installment"
                        onClick={() => openInstallment(item)}
                        title="Click to view installment details"
                        style={{
                          cursor: "pointer",
                          border: "none",
                          display: "inline-block",
                        }}
                      >
                        Installment
                      </button>
                    ) : (
                      <b
                        className={
                          item.paymentStatus === "Complete"
                            ? "status-complete"
                            : "status-refund"
                        }
                      >
                        {item.paymentStatus || "Pending"}
                      </b>
                    )}
                  </span>

                  <span>{item.paymentMethod || "-"}</span>

                  <span className="document-actions">
                    {item.billType === "Invoice" ? (
                      <button
                        className="document-btn invoice-btn"
                        onClick={() => downloadDocument(item)}
                        title="Download Invoice PDF"
                      >
                        ↓ Invoice
                      </button>
                    ) : item.billType === "Receipt" ? (
                      <button
                        className="document-btn receipt-btn"
                        onClick={() => downloadDocument(item)}
                        title="Download Receipt PDF"
                      >
                        ↓ Receipt
                      </button>
                    ) : (
                      <span>-</span>
                    )}
                  </span>

                  <span className="row-actions">
                    <button
                      className="delete-action"
                      title="Delete Transaction"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* =========================
            PAGINATION — ERP style
            (1-25 of 81 items  ‹ 1 2 3 ›  25 / page)
        ========================= */}

        {totalRows > 0 && (
          <div className="pagination">
            <span className="page-count">
              {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalRows)}{" "}
              of {totalRows} items
            </span>

            {totalPages > 1 && (
              <div className="page-btns">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  title="Previous page"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (n) =>
                      n === 1 ||
                      n === totalPages ||
                      Math.abs(n - safePage) <= 2,
                  )
                  .map((n, idx, arr) => (
                    <span key={n} className="page-btn-wrap">
                      {idx > 0 && n - arr[idx - 1] > 1 && (
                        <span className="page-dots">…</span>
                      )}

                      <button
                        className={
                          n === safePage ? "page-btn active-page" : "page-btn"
                        }
                        onClick={() => setCurrentPage(n)}
                      >
                        {n}
                      </button>
                    </span>
                  ))}

                <button
                  className="page-btn"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={safePage === totalPages}
                  title="Next page"
                >
                  ›
                </button>
              </div>
            )}

            <label className="page-size">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                title="Rows per page"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </label>
          </div>
        )}

        {installmentItem && (
          <div
            onClick={closeInstallment}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.45)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "700px",
                maxWidth: "100%",
                maxHeight: "92vh",
                overflowY: "auto",
                background: "#ffffff",
                borderRadius: "10px",
                padding: "20px 22px",
                boxSizing: "border-box",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {/* HEADER */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#222",
                  }}
                >
                  Installment Details
                </h3>

                <button
                  type="button"
                  onClick={closeInstallment}
                  title="Close"
                  style={{
                    width: 32,
                    height: 32,
                    border: "none",
                    borderRadius: "50%",
                    background: "#f3f4f6",
                    color: "#555",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* ============ TRANSACTION INFO  ============ */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  ["User", installmentItem.user || "-"],
                  ["Category", installmentItem.category || "-"],
                  ["Particular", installmentItem.particular || "-"],
                  ["Date", fmtDate(installmentItem.date)],
                  ["Due Date", fmtDate(installmentItem.dueDate)],
                  ["Payment Method", installmentItem.paymentMethod || "-"],
                ].map(([label, value], i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #eef2f7",
                      borderRadius: 8,
                      padding: "9px 12px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        color: "#94a3b8",
                        marginBottom: 3,
                      }}
                    >
                      {label}
                    </span>
                    <b
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: label === "Due Date" ? "#d97706" : "#334155",
                      }}
                    >
                      {value}
                    </b>
                  </div>
                ))}
              </div>

              {/* ============ SUMMARY LINE ============ */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "28px",
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 14, color: "#666", fontWeight: 500 }}>
                  Total:{" "}
                  <b style={{ color: "#1976d2", fontSize: 15 }}>
                    ₹{getAmount(installmentItem).toLocaleString("en-IN")}
                  </b>
                </span>

                <span style={{ fontSize: 14, color: "#666", fontWeight: 500 }}>
                  Paid:{" "}
                  <b style={{ color: "#16a34a", fontSize: 15 }}>
                    ₹{getPaid(installmentItem).toLocaleString("en-IN")}
                  </b>
                </span>

                <span style={{ fontSize: 14, color: "#666", fontWeight: 500 }}>
                  Pending:{" "}
                  <b style={{ color: "#d97706", fontSize: 15 }}>
                    ₹
                    {Math.max(
                      getAmount(installmentItem) - getPaid(installmentItem),
                      0,
                    ).toLocaleString("en-IN")}
                  </b>
                </span>
              </div>

              {/* ============ INSTALLMENTS TABLE ============ */}

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 0.9fr 1fr 1fr 1.4fr",
                    alignItems: "center",
                    textAlign: "center",
                    background: "#6495ed",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    padding: "11px 12px",
                  }}
                >
                  <span>Invoice No</span>
                  <span>Amount</span>
                  <span>Due Date</span>
                  <span>Pay Date</span>
                  <span>Status</span>
                </div>

                {(installmentItem.installments || []).length === 0 ? (
                  <div
                    style={{
                      padding: 24,
                      textAlign: "center",
                      fontSize: 12,
                      color: "#999",
                    }}
                  >
                    No installments added yet
                  </div>
                ) : (
                  (installmentItem.installments || []).map((inst, idx) => {
                    const isPaying = payingId === inst.id;

                    return (
                      <div key={inst.id}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.3fr 0.9fr 1fr 1fr 1.4fr",
                            alignItems: "center",
                            textAlign: "center",
                            padding: "10px 12px",
                            fontSize: 12,
                            color: "#333",
                            borderBottom: "1px solid #f1f5f9",
                            background: idx % 2 === 0 ? "#ffffff" : "#fafbfd",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#1976d2" }}>
                            {inst.invoiceNo}
                          </span>

                          <span style={{ fontWeight: 600 }}>
                            ₹{Number(inst.amount || 0).toLocaleString("en-IN")}
                          </span>

                          <span>{fmtDate(inst.dueDate)}</span>

                          <span>{fmtDate(inst.paymentDate)}</span>

                          <span>
                            {inst.status === "Completed" ? (
                              <b
                                style={{
                                  color: "#20b33b",
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              >
                                Completed
                              </b>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPayment(inst.id)}
                                style={{
                                  border: "none",
                                  borderRadius: 5,
                                  background: "#ff8500",
                                  color: "#ffffff",
                                  fontFamily: "Poppins, sans-serif",
                                  fontSize: 9,
                                  fontWeight: 600,
                                  padding: "6px 10px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                MARK COMPLETE
                              </button>
                            )}
                          </span>
                        </div>

                        {/* PAYMENT PANEL - method + txn id */}

                        {isPaying && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flexWrap: "wrap",
                              padding: "10px 12px",
                              background: "#f0f6ff",
                              borderBottom: "1px solid #e2e8f0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#555",
                              }}
                            >
                              Payment Method:
                            </span>

                            <select
                              value={payMethod}
                              onChange={(e) => setPayMethod(e.target.value)}
                              style={{
                                height: 32,
                                padding: "0 8px",
                                border: "1px solid #cbd5e1",
                                borderRadius: 5,
                                fontFamily: "Poppins, sans-serif",
                                fontSize: 12,
                                color: "#333",
                                background: "#ffffff",
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">
                                Bank Transfer
                              </option>
                              <option value="Cheque">Cheque</option>
                              <option value="UPI">UPI</option>
                            </select>

                            {payMethod === "Bank Transfer" && (
                              <input
                                type="text"
                                value={payTxnId}
                                onChange={(e) => setPayTxnId(e.target.value)}
                                placeholder="Txn ID"
                                style={{
                                  height: 32,
                                  width: 150,
                                  padding: "0 8px",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 5,
                                  fontFamily: "Poppins, sans-serif",
                                  fontSize: 12,
                                  color: "#333",
                                  background: "#ffffff",
                                  outline: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => handleConfirmPayment(inst.id)}
                              style={{
                                height: 32,
                                padding: "0 16px",
                                border: "none",
                                borderRadius: 5,
                                background: "#16a34a",
                                color: "#ffffff",
                                fontFamily: "Poppins, sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Confirm Payment
                            </button>

                            <button
                              type="button"
                              onClick={() => setPayingId(null)}
                              style={{
                                height: 32,
                                padding: "0 12px",
                                border: "none",
                                borderRadius: 5,
                                background: "#e2e8f0",
                                color: "#555",
                                fontFamily: "Poppins, sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* ============ पूर्ण झालं तर - Download Receipt/Invoice ============ */}

              {installmentItem.paymentStatus === "Complete" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => downloadDocument(installmentItem)}
                    style={{
                      border: "none",
                      borderRadius: 5,
                      background: "#16a34a",
                      color: "#ffffff",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "9px 18px",
                      cursor: "pointer",
                    }}
                  >
                    ⬇ Download{" "}
                    {installmentItem.billType === "Invoice"
                      ? "Invoice"
                      : "Receipt"}
                  </button>
                </div>
              )}

              {/* ============ खाली - ADD INSTALLMENT BUTTON ============ */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: showAddInstallment ? "10px" : "0px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddInstallment(!showAddInstallment)}
                  style={{
                    border: "none",
                    borderRadius: 5,
                    background: "#1976d2",
                    color: "#ffffff",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    padding: "9px 18px",
                    cursor: "pointer",
                  }}
                >
                  {showAddInstallment ? "✕ CANCEL" : "ADD INSTALLMENT"}
                </button>
              </div>

              {/* ============ खाली - ADD INSTALLMENT FORM ============ */}

              {showAddInstallment && (
                <form
                  onSubmit={handleAddInstallment}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.2fr auto",
                    gap: 12,
                    alignItems: "end",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Amount
                    <input
                      type="number"
                      value={newInstallment.amount}
                      onChange={(e) =>
                        setNewInstallment((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="Enter amount"
                      min="1"
                      style={{
                        height: 38,
                        padding: "0 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        color: "#333",
                        outline: "none",
                        boxSizing: "border-box",
                        width: "100%",
                        background: "#ffffff",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Due Date
                    <input
                      type="date"
                      value={newInstallment.dueDate}
                      onChange={(e) =>
                        setNewInstallment((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      style={{
                        height: 38,
                        padding: "0 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        color: "#333",
                        outline: "none",
                        boxSizing: "border-box",
                        width: "100%",
                        background: "#ffffff",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Remark
                    <input
                      type="text"
                      value={newInstallment.remark}
                      onChange={(e) =>
                        setNewInstallment((prev) => ({
                          ...prev,
                          remark: e.target.value,
                        }))
                      }
                      placeholder="e.g. 3rd installment"
                      style={{
                        height: 38,
                        padding: "0 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        color: "#333",
                        outline: "none",
                        boxSizing: "border-box",
                        width: "100%",
                        background: "#ffffff",
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    style={{
                      height: 38,
                      padding: "0 22px",
                      border: "none",
                      borderRadius: 6,
                      background: "#16a34a",
                      color: "#ffffff",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    SAVE
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Liabilities;
