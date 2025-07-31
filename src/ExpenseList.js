import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);

  // Filter states
  const [filterDescription, setFilterDescription] = useState("");
  const [filterAmount, setFilterAmount] = useState("");
  const [filterPaidBy, setFilterPaidBy] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

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

  // Filter logic with amount as string "startsWith"
  const filteredExpenses = expenses.filter((exp) => {
    return (
      exp.description.toLowerCase().includes(filterDescription.toLowerCase()) &&
      (filterAmount === "" || exp.amount.toString().startsWith(filterAmount)) &&
      (filterPaidBy === "" || exp.paidBy === filterPaidBy) &&
      (filterCategory === "" || exp.category === filterCategory)
    );
  });

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Expense List</h2>

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

      {/* Table */}
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Amount (₹)</th>
            <th style={thStyle}>Paid By</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((exp) => (
              <tr key={exp.id}>
                <td style={tdStyle}>{exp.description}</td>
                <td style={tdStyle}>₹{exp.amount?.toFixed(2)}</td>
                <td style={tdStyle}>{exp.paidBy}</td>
                <td style={tdStyle}>{exp.category || "No category"}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleDelete(exp.id)} style={deleteButtonStyle}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "12px" }}>
                No expenses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const filtersContainerStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "10px",
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

export default ExpenseList;
