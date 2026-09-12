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

const ROWS_PER_PAGE = 25;

function Assets() {
  const navigate = useNavigate();

  const [assetPill, setAssetPill] = useState("INVESTMENT");
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

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

  const activePill = ASSET_PILLS.find((pill) => pill.id === assetPill);

  const pillTransactions = transactions
    .filter((item) => activePill.categories.includes(item.category || ""))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const pillTotal = pillTransactions.reduce(
    (sum, item) => sum + getAmount(item),
    0,
  );

  const pillStats = ASSET_PILLS.map((pill) => {
    const txns = transactions.filter((item) =>
      pill.categories.includes(item.category || ""),
    );

    return {
      id: pill.id,
      label: pill.label,
      paid: txns.reduce((sum, item) => sum + getPaid(item), 0),
      unpaid: txns.reduce((sum, item) => sum + getPending(item), 0),
      amount: txns.reduce((sum, item) => sum + getAmount(item), 0),
    };
  });

  const categoryStats = activePill.categories.map((category) => {
    const amount = pillTransactions
      .filter((item) => (item.category || "") === category)
      .reduce((sum, item) => sum + getAmount(item), 0);

    const percent =
      pillTotal > 0 ? ((amount / pillTotal) * 100).toFixed(1) : "0.0";

    return { name: category, amount, percent };
  });
  const activePillId = assetPill;

  const handlePillClick = (pillId) => {
    setAssetPill(pillId);

    setCurrentPage(1);
  };

  const totalRows = pillTransactions.length;

  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE) || 1;

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * ROWS_PER_PAGE;

  const pageTransactions = pillTransactions.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE,
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
                <span className="pill-paid">
                  Paid: {formatAmount(pill.paid)}
                </span>

                <span className="pill-unpaid">
                  Unpaid: {formatAmount(pill.unpaid)}
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
