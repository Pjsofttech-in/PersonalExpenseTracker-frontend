import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Download, Plus } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";


import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionTable from "@/components/transactions/TransactionTable";



// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const getTodayDateTime = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-") + "T00:00:00";
};

const fmt = (v) =>
    Number(v ?? 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        : "—";
const emptyPaymentForm = () => ({ amount: "", date: getTodayDateTime(), remark: "" });

// ─────────────────────────────────────────────────────────────
// STAT BADGE
// ─────────────────────────────────────────────────────────────

const StatBadge = ({ label, value, color }) => (
    <span
        className="inline-flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm"
        style={{ backgroundColor: color }}
    >
        {label}: <span className="font-bold">₹{fmt(value)}</span>
    </span>
);

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function List() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);




    const [installmentExpense, setInstallmentExpense] = useState(null);
    const [showInstallmentDialog, setShowInstallmentDialog] = useState(false);

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        type: "", timeframe: "", category: "", paymentType: "", paymentMethod: "", paymentStatus: "", contact: "",
    });

    // Payment modal
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [selectedInstallment, setSelectedInstallment] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState(emptyPaymentForm());
    const [submitting, setSubmitting] = useState(false);
    const handleEditExpense = (expense) => {
        navigate(`/expense/edit/${expense.id}`);
    };
    const handleDeleteExpense = async (expense) => {
        if (!expense?.id) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete this expense?\n\n` +
            `Contact: ${expense.contact?.name || "—"}\n` +
            `Amount: ₹${fmt(expense.total)}\n\n` +
            `This will permanently delete the expense and its installment/payment records.`
        );

        if (!confirmed) return;

        try {
            setLoading(true);

            await api.delete(`/pjsofttech/expense/${expense.id}`);

            alert("Expense deleted successfully.");

            // Refresh list
            await fetchData();

            // Prevent being left on an empty page after deletion
            setCurrentPage((current) => {
                const remainingItems = filteredExpenses.length - 1;
                const newTotalPages = Math.max(
                    1,
                    Math.ceil(remainingItems / itemsPerPage)
                );

                return Math.min(current, newTotalPages);
            });

        } catch (err) {
            console.error("Delete expense error:", err);

            alert(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to delete expense."
            );
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => { setCurrentPage(1); }, [search, filters, itemsPerPage]);

    const openInstallmentDialog = (expense) => {
        setInstallmentExpense(expense);
        setShowInstallmentDialog(true);
    };
    const StatusBadge = ({ status }) => {
        const map = {
            COMPLETE: "bg-green-100 text-green-700 border-green-200",
            PAID: "bg-green-100 text-green-700 border-green-200",
            PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
            PENDING: "bg-red-100 text-red-600 border-red-200",
        };
        return (
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
                {status}
            </span>
        );
    };

    const closeInstallmentDialog = () => {
        setShowInstallmentDialog(false);
        setInstallmentExpense(null);
    };
    const isInTimeframe = (dateValue, timeframe) => {
        if (!timeframe) return true;

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return false;

        const now = new Date();

        // Remove time from dates
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const target = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        switch (timeframe) {
            case "TODAY":
                return target.getTime() === today.getTime();

            case "YESTERDAY": {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                return target.getTime() === yesterday.getTime();
            }

            case "THIS_WEEK": {
                // Monday = first day of week
                const startOfWeek = new Date(today);
                const day = today.getDay();
                const diff = day === 0 ? 6 : day - 1;

                startOfWeek.setDate(today.getDate() - diff);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                return target >= startOfWeek && target <= endOfWeek;
            }

            case "THIS_MONTH": {
                const startOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );

                const endOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0
                );

                return target >= startOfMonth && target <= endOfMonth;
            }

            case "LAST_MONTH": {
                const startOfLastMonth = new Date(
                    today.getFullYear(),
                    today.getMonth() - 1,
                    1
                );

                const endOfLastMonth = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    0
                );

                return (
                    target >= startOfLastMonth &&
                    target <= endOfLastMonth
                );
            }

            case "THIS_YEAR": {
                const startOfYear = new Date(
                    today.getFullYear(),
                    0,
                    1
                );

                const endOfYear = new Date(
                    today.getFullYear(),
                    11,
                    31
                );

                return target >= startOfYear && target <= endOfYear;
            }

            case "LAST_YEAR": {
                const startOfLastYear = new Date(
                    today.getFullYear() - 1,
                    0,
                    1
                );

                const endOfLastYear = new Date(
                    today.getFullYear() - 1,
                    11,
                    31
                );

                return (
                    target >= startOfLastYear &&
                    target <= endOfLastYear
                );
            }

            default:
                return true;
        }
    };

    const filteredExpenses = expenses.filter((exp) => {
        const txt = search.toLowerCase().trim();
        if (
            txt &&
            !exp.contact?.name?.toLowerCase().includes(txt) &&
            !exp.category?.name?.toLowerCase().includes(txt) &&
            !exp.particular?.toLowerCase().includes(txt)
        ) { return false; } return [
            !filters.type || filters.type === "All" || exp.type === filters.type,
            // Timeframe
            !filters.timeframe ||
            isInTimeframe(exp.date, filters.timeframe),
            !filters.category || String(exp.category?.id) === filters.category,
            !filters.paymentType || exp.paymentType === filters.paymentType,
            !filters.paymentMethod || exp.paymentMethod === filters.paymentMethod,

            !filters.paymentStatus || exp.paymentStatus === filters.paymentStatus,
            !filters.contact || String(exp.contact?.id) === filters.contact,
        ].every(Boolean);
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expResp, catResp, conResp] = await Promise.all([
                api.get("/pjsofttech/expense/expenses"),
                api.get("/pjsofttech/category"),
                api.get("/pjsofttech/user/users"),
            ]);
            setExpenses(expResp.data);
            console.log(expResp.data)
            setCategories(catResp.data);
            setContacts(conResp.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) =>
        setFilters((prev) => ({ ...prev, [name]: value }));

    const clearFilters = () =>
        setFilters({ type: "", timeframe: "", category: "", paymentType: "", paymentMethod: "", paymentStatus: "", contact: "" });



    // Stats
    const stats = filteredExpenses.reduce(
        (acc, exp) => {
            const gst = Number(exp.gstAmount ?? 0);
            const tds = Number(exp.tdsAmount ?? 0);
            const paid = Number(exp.paid ?? 0);
            const pending = Number(exp.pending ?? 0);
            acc.gst += gst;
            acc.tds += tds;
            acc.paid += paid;
            acc.pending += pending;
            if (exp.type === "INCOME") acc.income += Number(exp.total ?? 0);
            if (exp.type === "EXPENSE") acc.expenseRefund += Number(exp.total ?? 0);
            return acc;
        },
        { gst: 0, tds: 0, paid: 0, pending: 0, income: 0, expenseRefund: 0 }
    );

    // Payment modal
    const openPaymentModal = (expense, installment) => {
        setSelectedExpense(expense);
        setSelectedInstallment(installment);
        setPaymentForm(emptyPaymentForm());
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        if (submitting) return;
        setShowPaymentModal(false);
        setSelectedExpense(null);
        setSelectedInstallment(null);
        setPaymentForm(emptyPaymentForm());
    };

    const handleAddPayment = async () => {
        if (!selectedInstallment) return;
        const amount = Number(paymentForm.amount);
        const pending = Number(selectedInstallment.pendingAmount ?? 0);
        if (!amount || amount <= 0) { alert("Payment amount must be greater than zero."); return; }
        if (pending <= 0) { alert("This installment has no pending amount."); return; }
        if (amount > pending) { alert(`Payment cannot exceed ₹${fmt(pending)}.`); return; }
        if (!paymentForm.date) { alert("Please select a payment date."); return; }
        try {
            setSubmitting(true);
            await api.post(`/pjsofttech/expense/installment/${selectedInstallment.id}/payment`, {
                amount, date: paymentForm.date, remark: paymentForm.remark || null,
            });
            alert("Payment recorded successfully!");
            closePaymentModal();
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.error || err.response?.data?.message || "Failed to record payment.");
        } finally { setSubmitting(false); }
    };

    const downloadCSV = () => {
        if (!filteredExpenses.length) { alert("No records to export."); return; }
        const escape = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; };
        const headers = ["ID", "Date", "Type", "Contact", "Category", "Particular", "Amount", "GST%", "GST Amt", "TDS%", "Total", "Paid", "Pending", "Payment Type", "Payment Method", "Status", "Remark"];
        const rows = filteredExpenses.map((e) => [e.id, e.date, e.type, e.contact?.name, e.category?.name, e.particular, e.amount, e.gstPercentage, e.gstAmount, e.tdsPercentage, e.total, e.paid, e.pending, e.paymentType, e.paymentMethod, e.paymentStatus, e.remark]);
        const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    // ─────────────────────────────────────────────────────────────
    // PAGINATION
    // ─────────────────────────────────────────────────────────────

    const totalItems = filteredExpenses.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);


    // ─────────────────────────────────────────────────────────────
    // UI
    // ─────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 p-5 space-y-4">

            {/* ── Filter row ── */}
            <div className="flex gap-3 bg-white rounded-lg shadow-sm p-4">
                <input
                    className="w-full max-w-sm rounded-lg border border-slate-500 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Search by contact, category or particular..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <TransactionFilters
                    filters={filters}
                    categories={categories}
                    contacts={contacts}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                />
            </div>



            {/* ── Stat badges ── */}
            <div className="flex flex-wrap gap-2">
                <StatBadge label="Total GST" value={stats.gst} color="#4A90D9" />
                <StatBadge label="Total TDS" value={stats.tds} color="#E91E63" />
                <StatBadge label="Paid" value={stats.paid} color="#FF9800" />
                <StatBadge label="Pending" value={stats.pending} color="#4CAF50" />
                <StatBadge label="Total Expense" value={stats.expenseRefund} color="#2196F3" />
                <StatBadge label="Total Income" value={stats.income} color="#4A90D9" />
            </div>

            {/* ── Check Mark row ── */}
            {/* <div>
                <button className="bg-[#4A90D9] hover:bg-[#3a7fc1] text-white text-sm font-semibold px-5 py-2 rounded shadow transition-colors">
                    Check Mark Transactions
                </button>
            </div> */}
            {/* ── Actions + Stats ── */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={downloadCSV}
                    disabled={!filteredExpenses.length}
                    className="flex items-center gap-2 bg-[#4A90D9] hover:bg-[#3a7fc1] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded shadow transition-colors"
                >
                    <Download className="w-4 h-4" />
                    DOWNLOAD CSV
                </button>

                <button
                    onClick={() => navigate("/expense")}
                    className="flex items-center gap-2 bg-[#4A90D9] hover:bg-[#3a7fc1] text-white text-sm font-semibold px-4 py-2 rounded shadow transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Transaction
                </button>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                    Loading transactions…
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <TransactionTable
                        expenses={paginatedExpenses}
                        onPayInstallment={openPaymentModal}
                        onViewInstallments={openInstallmentDialog}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteExpense}

                    />
                    {/* Pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">

                        {/* Items count */}
                        <span>
                            {totalItems === 0
                                ? "0 items"
                                : `${startIndex + 1}–${endIndex} of ${totalItems} items`
                            }
                        </span>

                        <div className="flex items-center gap-2">

                            {/* Previous */}
                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 rounded border border-gray-200
                       flex items-center justify-center
                       hover:bg-gray-50
                       disabled:opacity-40
                       disabled:cursor-not-allowed"
                            >
                                ‹
                            </button>

                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, index) => index + 1)
                                    .map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded text-xs font-semibold ${currentPage === page
                                                ? "bg-[#4A90D9] text-white"
                                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                            </div>

                            {/* Next */}
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                }
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 rounded border border-gray-200
                       flex items-center justify-center
                       hover:bg-gray-50
                       disabled:opacity-40
                       disabled:cursor-not-allowed"
                            >
                                ›
                            </button>

                            {/* Items per page */}
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="ml-2 h-8 rounded border border-gray-200
                       bg-white px-2 text-xs text-gray-600
                       focus:outline-none focus:ring-1
                       focus:ring-[#4A90D9]"
                            >
                                <option value={10}>10 / page</option>
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>

                        </div>
                    </div>
                </div>
            )}

            {/* ── Payment Modal ── */}
            <Dialog open={showPaymentModal} onOpenChange={(v) => { if (!v) closePaymentModal(); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#4A90D9]">Record Installment Payment</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            {selectedExpense && selectedInstallment && (
                                <>Installment #{selectedInstallment.installmentNumber} for <strong>{selectedExpense.contact?.name}</strong></>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInstallment && (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-gray-50 border p-4 space-y-2 text-sm">
                                {[
                                    ["Scheduled Due", selectedInstallment.dueAmount, "text-gray-700"],
                                    ["Already Paid", selectedInstallment.paidAmount, "text-green-600"],
                                    ["Still Pending", selectedInstallment.pendingAmount, "text-red-500"],
                                ].map(([label, value, cls]) => (
                                    <div key={label} className="flex justify-between">
                                        <span className="text-gray-400">{label}</span>
                                        <span className={`font-semibold ${cls}`}>₹{fmt(value)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Payment Amount <span className="text-xs text-gray-400">(max ₹{fmt(selectedInstallment.pendingAmount)})</span></label>
                                <Input type="number" min="0.01" step="0.01" max={selectedInstallment.pendingAmount} value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Enter payment amount" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Payment Date</label>
                                <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Remark (optional)</label>
                                <Input value={paymentForm.remark} onChange={(e) => setPaymentForm((p) => ({ ...p, remark: e.target.value }))} placeholder="e.g. Part payment via UPI" />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={closePaymentModal} disabled={submitting} className="border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium px-5 py-2 rounded transition-colors">Cancel</button>
                                <button type="button" onClick={handleAddPayment} disabled={submitting} className="bg-[#4A90D9] hover:bg-[#3a7fc1] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded transition-colors">
                                    {submitting ? "Saving…" : "Record Payment"}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog
                open={showInstallmentDialog}
                onOpenChange={(open) => {
                    if (!open) closeInstallmentDialog();
                }}
            >
                <DialogContent className="max-w-2xl hover:bg-gray-50">
                    <DialogHeader>
                        <DialogTitle className="text-[#4A90D9]">
                            Installment Details
                        </DialogTitle>

                        <DialogDescription className="text-sm text-gray-500">
                            {installmentExpense && (
                                <>
                                    Installment payments for{" "}
                                    <strong>
                                        {installmentExpense.contact?.name || "—"}
                                    </strong>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {installmentExpense && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border bg-gray-50 p-3">
                                    <p className="text-xs text-gray-400">
                                        Total Amount
                                    </p>
                                    <p className="text-sm font-semibold">
                                        ₹{fmt(installmentExpense.total)}
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-green-50 p-3">
                                    <p className="text-xs text-gray-400">
                                        Paid
                                    </p>
                                    <p className="text-sm font-semibold text-green-600">
                                        ₹{fmt(installmentExpense.paid)}
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-red-50 p-3">
                                    <p className="text-xs text-gray-400">
                                        Pending
                                    </p>
                                    <p className="text-sm font-semibold text-red-600">
                                        ₹{fmt(installmentExpense.pending)}
                                    </p>
                                </div>
                            </div>

                            {/* Installments */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    Installments
                                </h3>

                                {!installmentExpense.installments?.length ? (
                                    <div className="rounded-lg border p-6 text-center text-sm text-gray-400">
                                        No installment details found.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {installmentExpense.installments.map((inst) => (
                                            <div
                                                key={inst.id}
                                                className="rounded-lg border bg-gray-50 p-3"
                                            >
                                                {/* Header */}
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <div>
                                                        <span className="font-semibold text-gray-700">
                                                            Installment #{inst.installmentNumber}
                                                        </span>

                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Due: {fmtDate(inst.dueDate)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge status={inst.status} />

                                                        {inst.status !== "PAID" &&
                                                            Number(inst.pendingAmount) > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        closeInstallmentDialog();
                                                                        openPaymentModal(
                                                                            installmentExpense,
                                                                            inst
                                                                        );
                                                                    }}
                                                                    className="h-7 text-xs px-3 border
                                                                   border-[#4A90D9]
                                                                   text-[#4A90D9]
                                                                   rounded
                                                                   hover:bg-blue-50
                                                                   transition-colors"
                                                                >
                                                                    Pay
                                                                </button>
                                                            )}
                                                    </div>
                                                </div>

                                                {/* Amounts */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center rounded bg-white border p-2">
                                                        <p className="text-[11px] text-gray-400">
                                                            Due
                                                        </p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            ₹{fmt(inst.dueAmount)}
                                                        </p>
                                                    </div>

                                                    <div className="text-center rounded bg-white border p-2">
                                                        <p className="text-[11px] text-gray-400">
                                                            Paid
                                                        </p>
                                                        <p className="text-sm font-semibold text-green-600">
                                                            ₹{fmt(inst.paidAmount)}
                                                        </p>
                                                    </div>

                                                    <div className="text-center rounded bg-white border p-2">
                                                        <p className="text-[11px] text-gray-400">
                                                            Pending
                                                        </p>
                                                        <p
                                                            className={`text-sm font-semibold ${Number(inst.pendingAmount) > 0
                                                                ? "text-red-600"
                                                                : "text-green-600"
                                                                }`}
                                                        >
                                                            ₹{fmt(inst.pendingAmount)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Payment history */}
                                                {inst.payments?.length > 0 && (
                                                    <details className="mt-3">
                                                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                                            {inst.payments.length} payment
                                                            {inst.payments.length > 1 ? "s" : ""}
                                                        </summary>

                                                        <div className="mt-2 space-y-1 pl-3 border-l-2 border-gray-200">
                                                            {inst.payments.map((payment) => (
                                                                <div
                                                                    key={payment.id}
                                                                    className="flex items-center justify-between text-xs"
                                                                >
                                                                    <span className="text-gray-400">
                                                                        {fmtDate(payment.paymentDate)}
                                                                    </span>

                                                                    <span className="font-medium text-green-600">
                                                                        +₹{fmt(payment.amount)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={closeInstallmentDialog}
                                    className="border border-gray-300 text-gray-600
                                   hover:bg-red-200 text-sm font-medium
                                   px-5 py-2 rounded transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
