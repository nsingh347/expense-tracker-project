import React, { useEffect, useState, useMemo } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff6b6b", "#00C49F", "#FF8042"];

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);

  // Filter states
  const [filterDescription, setFilterDescription] = useState("");
  const [filterAmount, setFilterAmount] = useState("");
  const [filterPaidBy, setFilterPaidBy] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  // Add month filter state
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Editing state: track which expense is editing
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    description: "",
    amount: "",
    paidBy: "",
    category: "",
  });

  useEffect(() => {
    const q = collection(db, "expenses");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await deleteDoc(doc(db, "expenses", id));
    }
  };

  const startEditing = (exp) => {
    setEditId(exp.id);
    setEditData({
      description: exp.description,
      amount: exp.amount,
      paidBy: exp.paidBy,
      category: exp.category || "",
    });
  };

  const cancelEditing = () => {
    setEditId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (
      !editData.description ||
      !editData.amount ||
      !editData.paidBy ||
      !editData.category
    ) {
      alert("Please fill all fields before saving.");
      return;
    }
    const docRef = doc(db, "expenses", editId);
    await updateDoc(docRef, {
      description: editData.description,
      amount: parseFloat(editData.amount),
      paidBy: editData.paidBy,
      category: editData.category,
    });
    setEditId(null);
  };

  // Filter logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Date filter
      let dateMatch = true;
      if (filterMonth) {
        const expDate = new Date(exp.date);
        const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;
        dateMatch = expMonth === filterMonth;
      }
      return (
        exp.description.toLowerCase().includes(filterDescription.toLowerCase()) &&
        (filterAmount === "" || exp.amount.toString().startsWith(filterAmount)) &&
        (filterPaidBy === "" || exp.paidBy === filterPaidBy) &&
        (filterCategory === "" || exp.category === filterCategory) &&
        dateMatch
      );
    });
  }, [expenses, filterDescription, filterAmount, filterPaidBy, filterCategory, filterMonth]);

  // Calculate total for filtered month
  const totalForMonth = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Pie chart data
  const contributionData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((exp) => {
      map[exp.paidBy] = (map[exp.paidBy] || 0) + exp.amount;
    });
    return Object.keys(map).map((key) => ({ name: key, value: map[key] }));
  }, [filteredExpenses]);

  const categoryData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((exp) => {
      const category = exp.category || "Uncategorized";
      map[category] = (map[category] || 0) + exp.amount;
    });
    return Object.keys(map).map((key) => ({ name: key, value: map[key] }));
  }, [filteredExpenses]);

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Expense List</h2>
      {/* Month filter */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontWeight: "bold", marginRight: 8 }}>Month:</label>
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          style={{ padding: "6px 8px", fontSize: "1em", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <span style={{ marginLeft: 16, fontWeight: "bold" }}>Total: ₹{totalForMonth.toFixed(2)}</span>
      </div>
      {/* Filters container */}
      <div style={filtersContainerStyle}>
        <input
          type="text"
          placeholder="Filter by Description"
          value={filterDescription}
          onChange={(e) => setFilterDescription(e.target.val
