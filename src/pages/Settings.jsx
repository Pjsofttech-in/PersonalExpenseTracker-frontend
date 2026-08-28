import React, { useEffect, useState } from "react";
import api from "../api/api";
import { FaTrash, FaPencil } from "react-icons/fa6";
import { Search } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────

const BlueTable = ({ headers, children, emptyColSpan, emptyText, isEmpty }) => (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
            <thead>
                <tr className="bg-[#4A90D9] text-white">
                    {headers.map((h) => (
                        <th
                            key={h.label}
                            className={`px-4 py-3 font-semibold text-center border-r border-[#3a7fc1] last:border-r-0 ${h.className ?? ""}`}
                        >
                            {h.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {isEmpty ? (
                    <tr>
                        <td
                            colSpan={emptyColSpan}
                            className="py-12 text-center text-gray-400 text-sm"
                        >
                            {emptyText}
                        </td>
                    </tr>
                ) : (
                    children
                )}
            </tbody>
        </table>
    </div>
);

const TableRow = ({ children, onClick, className = "" }) => (
    <tr
        onClick={onClick}
        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
        {children}
    </tr>
);

const Td = ({ children, center = false, className = "" }) => (
    <td className={`px-4 py-3 border-r border-gray-100 last:border-r-0 ${center ? "text-center" : ""} ${className}`}>
        {children}
    </td>
);

const ActionBtn = ({ onClick, icon: Icon, danger }) => (
    <button
        onClick={onClick}
        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${danger
            ? "text-red-500 hover:bg-red-50"
            : "text-blue-500 hover:bg-blue-50"
            }`}
    >
        <Icon className="w-3.5 h-3.5" />
    </button>
);

const FormField = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {children}
    </div>
);

const StyledInput = ({ ...props }) => (
    <input
        {...props}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
    />
);

const BlueBtn = ({ children, onClick, type = "button", disabled, className = "" }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`bg-[#4A90D9] hover:bg-[#3a7fc1] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded transition-colors ${className}`}
    >
        {children}
    </button>
);

const OutlineBtn = ({ children, onClick, type = "button" }) => (
    <button
        type={type}
        onClick={onClick}
        className="border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium px-5 py-2 rounded transition-colors"
    >
        {children}
    </button>
);

const CountBadge = ({ count, label }) => (
    <span className="inline-flex items-center gap-1 border border-[#4A90D9] text-[#4A90D9] text-xs font-semibold px-3 py-1.5 rounded-full">
        Total {label}: {count}
    </span>
);

const Pagination = ({
    total,
    perPage = 25,
    page = 1,
    onPageChange,
}) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const start = total === 0 ? 0 : (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
                {start}–{end} of {total} {total === 1 ? "item" : "items"}
            </span>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ‹
                </button>

                <span className="min-w-7 h-7 px-2 rounded bg-[#4A90D9] text-white text-xs font-semibold flex items-center justify-center">
                    {page}
                </span>

                <button
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ›
                </button>

                <span className="ml-2 text-xs text-gray-400">
                    {perPage} / page
                </span>
            </div>
        </div>
    );
};
// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────

const TABS = ["Users", "Categories", "Banks"];

// ─────────────────────────────────────────────────────────────
// Initial states
// ─────────────────────────────────────────────────────────────

const emptyContact = { name: "", phoneNumber: "", email: "" };
const emptyBank = { name: "", branch: "", accountNumber: "", ifsc: "", accountType: "" };

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Settings() {
    const [activeTab, setActiveTab] = useState("Users");

    const [contacts, setContacts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);

    const [contactSearch, setContactSearch] = useState("");
    const [categorySearch, setCategorySearch] = useState("");

    // Contact form
    const [contact, setContact] = useState(emptyContact);
    const [showContactForm, setShowContactForm] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);

    // Category form
    const [categoryName, setCategoryName] = useState("");
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    // Bank form
    const [bank, setBank] = useState(emptyBank);
    const [showBankForm, setShowBankForm] = useState(false);

    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: "" });


    const PER_PAGE = 10;

    const [userPage, setUserPage] = useState(1);
    const [categoryPage, setCategoryPage] = useState(1);
    const [bankPage, setBankPage] = useState(1);
    // ── Fetch ──────────────────────────────────────────────────
    useEffect(() => {
        fetchContacts();
        fetchCategories();
        fetchBanks();
    }, []);


    const fetchContacts = async () => {
        try {
            const res = await api.get("/pjsofttech/user/users");
            setContacts(res.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/pjsofttech/category");
            setCategories(res.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchBanks = async () => {
        try {
            const res = await api.get("/pjsofttech/bank");
            setBanks(res.data || []);
        } catch (e) { console.error(e); }
    };

    // ── Contact CRUD ───────────────────────────────────────────
    const handleEditContact = (item) => {
        setEditingContactId(item.id);
        setContact({ name: item.name || "", phoneNumber: item.phoneNumber || "", email: item.email || "" });
        setShowContactForm(true);
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingContactId) {
                const res = await api.put(`/pjsofttech/user/${editingContactId}`, contact);
                setContacts((prev) => prev.map((c) => c.id === res.data.id ? res.data : c));
                alert("Contact updated successfully");
            } else {
                const res = await api.post("/pjsofttech/user", contact);
                setContacts((prev) => [...prev, res.data]);
                alert("Contact added successfully");
            }
            resetContactForm();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save contact");
        } finally { setLoading(false); }
    };

    const resetContactForm = () => {
        setContact(emptyContact);
        setEditingContactId(null);
        setShowContactForm(false);
    };

    // ── Category CRUD ──────────────────────────────────────────
    const addCategory = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingCategoryId) {
                const res = await api.put(`/pjsofttech/category/${editingCategoryId}`, { name: categoryName });
                setCategories((prev) => prev.map((c) => c.id === res.data.id ? res.data : c));
                alert("Category updated successfully");
            } else {
                const res = await api.post("/pjsofttech/category", { name: categoryName });
                setCategories((prev) => [...prev, res.data]);
                alert("Category added successfully");
            }
            setCategoryName(""); setEditingCategoryId(null); setShowCategoryForm(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save category");
        } finally { setLoading(false); }
    };

    const handleEditCategory = (item) => {
        setEditingCategoryId(item.id);
        setCategoryName(item.name || "");
        setShowCategoryForm(true);
    };

    // ── Bank CRUD ──────────────────────────────────────────────
    const addBank = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await api.post("/pjsofttech/bank", bank);
            setBanks((prev) => [...prev, res.data]);
            alert("Bank added successfully");
            setBank(emptyBank); setShowBankForm(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add bank");
        } finally { setLoading(false); }
    };

    // ── Delete ─────────────────────────────────────────────────
    const openDeleteDialog = (type, id, name) =>
        setDeleteDialog({ open: true, type, id, name });

    const closeDeleteDialog = () =>
        setDeleteDialog({ open: false, type: null, id: null, name: "" });

    const confirmDelete = async () => {
        const { type, id } = deleteDialog;
        if (!id) {
            alert("Invalid contact ID");
            return;
        }
        try {
            setLoading(true);
            if (type === "contact") {
                await api.delete(`/pjsofttech/user/${id}`);
                setContacts((prev) => prev.filter((c) => c.id !== id));
                setUserPage(1);

                if (editingContactId === id) resetContactForm();

                alert("Contact deleted successfully");
            }

            if (type === "category") {
                await api.delete(`/pjsofttech/category/${id}`);
                setCategories((prev) => prev.filter((c) => c.id !== id));
                setCategoryPage(1);

                alert("Category deleted successfully");
            }

            if (type === "bank") {
                await api.delete(`/pjsofttech/bank/${id}`);
                setBanks((prev) => prev.filter((b) => b.id !== id));
                setBankPage(1);

                alert("Bank deleted successfully");
            }
            closeDeleteDialog();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete");
        } finally { setLoading(false); }
    };

    // ── Filtered lists ─────────────────────────────────────────
    const filteredContacts = contacts.filter((c) =>
        c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const filteredCategories = categories.filter((c) =>
        c.name?.toLowerCase().includes(categorySearch.toLowerCase())
    );
    const paginatedContacts = filteredContacts.slice(
        (userPage - 1) * PER_PAGE,
        userPage * PER_PAGE
    );

    const paginatedCategories = filteredCategories.slice(
        (categoryPage - 1) * PER_PAGE,
        categoryPage * PER_PAGE
    );

    const paginatedBanks = banks.slice(
        (bankPage - 1) * PER_PAGE,
        bankPage * PER_PAGE
    );

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-5">

                {/* ── Inner tab bar ── */}
                <div className="flex border-b border-gray-200 bg-white rounded-t-lg shadow-sm overflow-hidden">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setShowContactForm(false);
                                setShowCategoryForm(false);
                                setShowBankForm(false);
                            }}
                            className={`px-8 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                                ? "border-[#4A90D9] text-[#4A90D9] bg-blue-50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ════════════════════════════════════════ */}
                {/* USERS TAB                               */}
                {/* ════════════════════════════════════════ */}
                {activeTab === "Users" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
                                    placeholder="Search User"
                                    value={contactSearch}
                                    onChange={(e) => {
                                        setContactSearch(e.target.value);
                                        setUserPage(1);
                                    }} />
                            </div>
                            <div className="flex items-center gap-3">
                                <BlueBtn onClick={() => { resetContactForm(); setShowContactForm(true); }}>
                                    ADD USER
                                </BlueBtn>
                                <CountBadge count={contacts.length} label="Users" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <BlueTable
                                headers={[
                                    { label: "Id", className: "w-16" },
                                    { label: "Username" },
                                    { label: "Phone Number" },
                                    { label: "Email" },
                                    { label: "Actions", className: "w-24" },
                                ]}
                                isEmpty={filteredContacts.length === 0}
                                emptyColSpan={5}
                                emptyText="No users found."
                            >
                                {paginatedContacts.map((item) => (
                                    <TableRow key={item.id}>
                                        <Td center className="text-gray-500 text-xs">{item.id}</Td>
                                        <Td>
                                            <a
                                                className="text-[#4A90D9] hover:underline font-medium cursor-pointer"
                                                onClick={() => handleEditContact(item)}
                                            >
                                                {item.name}
                                            </a>
                                        </Td>
                                        <Td center>{item.phoneNumber}</Td>
                                        <Td>{item.email}</Td>
                                        <Td center>
                                            <div className="flex items-center justify-center gap-2">
                                                <ActionBtn
                                                    icon={FaPencil}
                                                    onClick={() => handleEditContact(item)}
                                                />
                                                <ActionBtn
                                                    icon={FaTrash}
                                                    danger
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteDialog("contact", item.id, item.name);
                                                    }}
                                                />
                                            </div>
                                        </Td>
                                    </TableRow>
                                ))}
                            </BlueTable>
                            <Pagination
                                total={filteredContacts.length}
                                perPage={PER_PAGE}
                                page={userPage}
                                onPageChange={setUserPage}
                            />                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════ */}
                {/* CATEGORIES TAB                          */}
                {/* ════════════════════════════════════════ */}
                {activeTab === "Categories" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
                                    placeholder="Search Category"
                                    value={categorySearch}
                                    onChange={(e) => {
                                        setCategorySearch(e.target.value);
                                        setCategoryPage(1);
                                    }} />
                            </div>
                            <div className="flex items-center gap-3">
                                <BlueBtn onClick={() => { setEditingCategoryId(null); setCategoryName(""); setShowCategoryForm(true); }}>
                                    ADD CATEGORY
                                </BlueBtn>
                                <CountBadge count={categories.length} label="Categories" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <BlueTable
                                headers={[
                                    { label: "ID", className: "w-16" },
                                    { label: "Name" },
                                    { label: "Actions", className: "w-24" },
                                ]}
                                isEmpty={filteredCategories.length === 0}
                                emptyColSpan={3}
                                emptyText="No categories found."
                            >
                                {paginatedCategories.map((item) => (
                                    <TableRow key={item.id}>
                                        <Td center className="text-gray-500 text-xs">{item.id}</Td>
                                        <Td center className="font-medium">{item.name}</Td>
                                        <Td center>
                                            <div className="flex items-center justify-center gap-2">
                                                <ActionBtn
                                                    icon={FaPencil}
                                                    onClick={() => handleEditCategory(item)}
                                                />
                                                <ActionBtn
                                                    icon={FaTrash}
                                                    danger
                                                    onClick={() => openDeleteDialog("category", item.id, item.name)}
                                                />
                                            </div>
                                        </Td>
                                    </TableRow>
                                ))}
                            </BlueTable>
                            <Pagination
                                total={filteredCategories.length}
                                perPage={PER_PAGE}
                                page={categoryPage}
                                onPageChange={setCategoryPage}
                            />                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════ */}
                {/* BANKS TAB                               */}
                {/* ════════════════════════════════════════ */}
                {activeTab === "Banks" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-gray-700">Bank Accounts</h2>
                            <BlueBtn onClick={() => { setBank(emptyBank); setShowBankForm(true); }}>
                                ADD BANK
                            </BlueBtn>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <BlueTable
                                headers={[
                                    { label: "ID", className: "w-16" },
                                    { label: "Bank Name" },
                                    { label: "Branch" },
                                    { label: "Account Number" },
                                    { label: "IFSC" },
                                    { label: "Account Type" },
                                    { label: "Actions", className: "w-24" },
                                ]}
                                isEmpty={banks.length === 0}
                                emptyColSpan={7}
                                emptyText="No banks found."
                            >
                                {paginatedBanks.map((item) => (
                                    <TableRow key={item.id}>
                                        <Td center className="text-gray-500 text-xs">{item.id}</Td>
                                        <Td className="font-medium">{item.name}</Td>
                                        <Td>{item.branch}</Td>
                                        <Td center>{item.accountNumber}</Td>
                                        <Td center>{item.ifsc}</Td>
                                        <Td center>{item.accountType}</Td>
                                        <Td center>
                                            <ActionBtn
                                                icon={FaTrash}
                                                danger
                                                onClick={() => openDeleteDialog("bank", item.id, item.name)}
                                            />
                                        </Td>
                                    </TableRow>
                                ))}
                            </BlueTable>
                            <Pagination
                                total={banks.length}
                                perPage={PER_PAGE}
                                page={bankPage}
                                onPageChange={setBankPage}
                            />                          </div>
                    </div>
                )}
            </div>

            {/* ── Contact Form Dialog ── */}
            <Dialog open={showContactForm} onOpenChange={(v) => { if (!v) resetContactForm(); }}>
                <DialogContent className="max-w-sm bg-white shadow">
                    <DialogHeader>
                        <DialogTitle className="text-[#4A90D9]">
                            {editingContactId ? "Edit User" : "Add User"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleContactSubmit} className="space-y-4 pt-2">
                        <FormField label="Name">
                            <StyledInput
                                value={contact.name}
                                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                                placeholder="Enter name"
                                required
                            />
                        </FormField>
                        <FormField label="Phone Number">
                            <StyledInput
                                value={contact.phoneNumber}
                                onChange={(e) => setContact({ ...contact, phoneNumber: e.target.value })}
                                placeholder="Enter phone number"
                                required
                            />
                        </FormField>
                        <FormField label="Email">
                            <StyledInput
                                type="email"
                                value={contact.email}
                                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                                placeholder="Enter email"
                                required
                            />
                        </FormField>
                        <div className="flex justify-end gap-2 pt-1">
                            <OutlineBtn onClick={resetContactForm}>Cancel</OutlineBtn>
                            <BlueBtn type="submit" disabled={loading}>
                                {loading ? "Saving..." : editingContactId ? "Update" : "Save"}
                            </BlueBtn>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Category Form Dialog ── */}
            <Dialog open={showCategoryForm} onOpenChange={(v) => { if (!v) { setCategoryName(""); setEditingCategoryId(null); setShowCategoryForm(false); } }}>
                <DialogContent className="max-w-sm bg-white shadow ">
                    <DialogHeader>
                        <DialogTitle className="text-[#4A90D9]">
                            {editingCategoryId ? "Edit Category" : "Add Category"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={addCategory} className="space-y-4 pt-2">
                        <FormField label="Category Name">
                            <StyledInput
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="e.g. Food"
                                required
                            />
                        </FormField>
                        <div className="flex justify-end gap-2 pt-1">
                            <OutlineBtn onClick={() => { setCategoryName(""); setEditingCategoryId(null); setShowCategoryForm(false); }}>
                                Cancel
                            </OutlineBtn>
                            <BlueBtn type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Category"}
                            </BlueBtn>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Bank Form Dialog ── */}
            <Dialog open={showBankForm} onOpenChange={(v) => { if (!v) { setBank(emptyBank); setShowBankForm(false); } }}>
                <DialogContent className="max-w-sm bg-white shadow">
                    <DialogHeader>
                        <DialogTitle className="text-[#4A90D9]">Add Bank</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={addBank} className="space-y-4 pt-2">
                        {[
                            { label: "Bank Name", key: "name", placeholder: "e.g. HDFC Bank" },
                            { label: "Branch", key: "branch", placeholder: "Branch name" },
                            { label: "Account Number", key: "accountNumber", placeholder: "Account number" },
                            { label: "IFSC Code", key: "ifsc", placeholder: "e.g. HDFC0001234" },
                        ].map(({ label, key, placeholder }) => (
                            <FormField key={key} label={label}>
                                <StyledInput
                                    value={bank[key]}
                                    onChange={(e) => setBank({ ...bank, [key]: key === "ifsc" ? e.target.value.toUpperCase() : e.target.value })}
                                    placeholder={placeholder}
                                    required
                                />
                            </FormField>

                        ))}
                        <FormField label="Account Type">
                            <select
                                value={bank.accountType}
                                onChange={(e) =>
                                    setBank({
                                        ...bank,
                                        accountType: e.target.value,
                                    })
                                }
                                required
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                            >
                                <option value="">Select account type</option>
                                <option value="SAVINGS">SAVINGS</option>
                                <option value="CURRENT">CURRENT</option>
                            </select>
                        </FormField>
                        <div className="flex justify-end gap-2 pt-1">
                            <OutlineBtn onClick={() => { setBank(emptyBank); setShowBankForm(false); }}>Cancel</OutlineBtn>
                            <BlueBtn type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Bank"}
                            </BlueBtn>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ── */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(v) => { if (!v) closeDeleteDialog(); }}>
                <AlertDialogContent className='hover:bg-white'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{deleteDialog.name}</strong> will be deactivated and removed
                            from the active users list. Existing expenses will be preserved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={confirmDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
