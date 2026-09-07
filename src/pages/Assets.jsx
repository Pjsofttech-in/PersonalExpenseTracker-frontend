import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { FaInbox } from "react-icons/fa";

import {
  loadTransactionsFromBackend,
  deleteTransactionFromBackend,
} from "../utils/backendData";

import "../css/Settings.css";
import "../css/List.css";
import "../css/Liabilities.css";
import "../css/Assets.css";

const ASSET_PILLS = [
  {
    id: "INVESTMENT",
    label: "Investment",
    categories: [
      "Gold",
      "Silver",
      "Platinum",
      "Diamond",
      "Ind Stock",
      "US Stock",
      "Mutual Fund",
      "Bitcoin",
      "Vehicle",
      "Plot",
      "Flat",
      "Land",
    ],
  },
  {
    id: "BANKS",
    label: "Banks",
    categories: ["Bank FD", "Bank RD", "Bonds", "NPS", "ESPO", "PPF", "SIF"],
  },
  {
    id: "INSURANCE",
    label: "Insurance",
    categories: [
      "Life Insurance",
      "Health Insurance",
      "Vehicle Insurance",
      "Term Insurance",
    ],
  },
];

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
];

const ROWS_PER_PAGE = 25;

function Assets() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("ASSETS");
  const [assetPill, setAssetPill] = useState("INVESTMENT");
  const [liabPill, setLiabPill] = useState("BILLS");
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // transactions — List page सारखाच backend data

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

    const handleRefresh = () => loadTransactions();

    window.addEventListener("transactionUpdated", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      window.removeEventListener("transactionUpdated", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, []);

  // helpers

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

  // active pill च्या categories च्याच transactions

  const activePill =
    activeTab === "ASSETS"
      ? ASSET_PILLS.find((pill) => pill.id === assetPill)
      : LIABILITY_PILLS.find((pill) => pill.id === liabPill);

  const pillTransactions = transactions
    .filter((item) => activePill.categories.includes(item.category || ""))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const pillTotal = pillTransactions.reduce(
    (sum, item) => sum + getAmount(item),
    0,
  );

  const activePillId = activeTab === "ASSETS" ? assetPill : liabPill;

  const handlePillClick = (pillId) => {
    if (activeTab === "ASSETS") {
      setAssetPill(pillId);
    } else {
      setLiabPill(pillId);
    }

    setCurrentPage(1);
  };

  // pagination — 25 rows per page

  const totalRows = pillTransactions.length;

  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE) || 1;

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * ROWS_PER_PAGE;

  const pageTransactions = pillTransactions.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE,
  );

  // edit / delete / document — List page सारखंच

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

  const downloadDocument = (item) => {
    const documentTitle = item.billType === "Invoice" ? "INVOICE" : "RECEIPT";

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(25, 118, 210);
    doc.text(documentTitle, 105, 20, { align: "center" });

    doc.setDrawColor(200);
    doc.line(20, 26, 190, 26);

    // jsPDF default fonts "₹" support करत नाहीत, म्हणून "Rs."

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
        {/* TABS */}

        <div className="invest-tabs">
          <button
            className={
              activeTab === "ASSETS" ? "invest-tab active" : "invest-tab"
            }
            onClick={() => {
              setActiveTab("ASSETS");
              setCurrentPage(1);
            }}
          >
            Assets
          </button>

          <button
            className={
              activeTab === "LIABILITIES" ? "invest-tab active" : "invest-tab"
            }
            onClick={() => {
              setActiveTab("LIABILITIES");
              setCurrentPage(1);
            }}
          >
            Liabilities
          </button>
        </div>

        {/* PILLS + TOTAL */}

        <div className="fin-pills">
          {(activeTab === "ASSETS" ? ASSET_PILLS : LIABILITY_PILLS).map(
            (pill) => (
              <button
                key={pill.id}
                className={
                  activePillId === pill.id ? "fin-pill active" : "fin-pill"
                }
                onClick={() => handlePillClick(pill.id)}
              >
                {pill.label}
              </button>
            ),
          )}

          <span className="fin-list-total">
            Total: {formatAmount(pillTotal)}
          </span>
        </div>

        {/* TABLE */}

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
                    {item.paymentStatus === "Installment" ? (
                      <b className="status-installment">Installment</b>
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

        {/* PAGINATION */}

        {totalRows > ROWS_PER_PAGE && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safePage === 1}
            >
              ◀ Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (n) =>
                  n === 1 || n === totalPages || Math.abs(n - safePage) <= 2,
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage === totalPages}
            >
              Next ▶
            </button>

            <span className="page-info">
              Page {safePage} / {totalPages} &nbsp;|&nbsp; {totalRows} records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Assets;
