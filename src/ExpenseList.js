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
          onChange={(e) => setFilterDescription(e.target.value)}
          style={filterInputStyle}
        />
        <input
          type="number"
          placeholder="Filter by Amount"
          value={filterAmount}
          onChange={(e) => setFilterAmount(e.target.value)}
          style={filterInputStyle}
        />
        <select
          value={filterPaidBy}
          onChange={(e) => setFilterPaidBy(e.target.value)}
          style={filterInputStyle}
        >
          <option value="">All Paid By</option>
          <option value="Nishant">Nishant</option>
          <option value="Rajat">Rajat</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={filterInputStyle}
        >
          <option value="">All Categories</option>
          <option value="Groceries">Groceries</option>
          <option value="Outside Food">Outside Food</option>
          <option value="Meat">Meat</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Pie Charts */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {/* Contribution Chart */}
        <div style={{ width: "300px", height: "300px" }}>
          <h4 style={{ textAlign: "center" }}>Contribution</h4>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={contributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {contributionData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div style={{ width: "300px", height: "300px" }}>
          <h4 style={{ textAlign: "center" }}>By Category</h4>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#82ca9d"
                label
              >
                {categoryData.map((_, index) => (
                  <Cell
                    key={`cell-cat-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Amount (₹)</th>
            <th style={thStyle}>Paid By</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((exp) =>
              editId === exp.id ? (
                <tr key={exp.id}>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      name="description"
                      value={editData.description}
                      onChange={handleEditChange}
                      style={editInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      name="amount"
                      value={editData.amount}
                      onChange={handleEditChange}
                      style={editInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <select
                      name="paidBy"
                      value={editData.paidBy}
                      onChange={handleEditChange}
                      style={editInputStyle}
                    >
                      <option value="Nishant">Nishant</option>
                      <option value="Rajat">Rajat</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select
                      name="category"
                      value={editData.category}
                      onChange={handleEditChange}
                      style={editInputStyle}
                    >
                      <option value="">-- Select Category --</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Outside Food">Outside Food</option>
                      <option value="Meat">Meat</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      name="date"
                      value={editData.date}
                      onChange={handleEditChange}
                      style={editInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={saveEdit}
                      style={{ ...actionButtonStyle, backgroundColor: "#28a745" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      style={{ ...actionButtonStyle, backgroundColor: "#6c757d" }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={exp.id}>
                  <td style={tdStyle}>{exp.description}</td>
                  <td style={tdStyle}>₹{exp.amount?.toFixed(2)}</td>
                  <td style={tdStyle}>{exp.paidBy}</td>
                  <td style={tdStyle}>{exp.category || "No category"}</td>
                  <td style={tdStyle}>{(() => {
                    try {
                      const date = new Date(exp.date);
                      if (isNaN(date.getTime())) return "No date";
                      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                    } catch {
                      return "No date";
                    }
                  })()}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => startEditing(exp)}
                      style={{ ...actionButtonStyle, backgroundColor: "#007bff" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      style={{ ...actionButtonStyle, backgroundColor: "#dc3545", marginLeft: "6px" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "12px" }}>
                No expenses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Styles
const filtersContainerStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const filterInputStyle = {
  padding: "6px 8px",
  fontSize: "1em",
  minWidth: "150px",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const thStyle = {
  padding: "12px",
  border: "1px solid #dee2e6",
  textAlign: "left",
};

const tdStyle = {
  padding: "12px",
  border: "1px solid #dee2e6",
};

const deleteButtonStyle = {
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};

const actionButtonStyle = {
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};

const editInputStyle = {
  width: "100%",
  padding: "6px 8px",
  fontSize: "1em",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

export default ExpenseList;
