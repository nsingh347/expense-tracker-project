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
    const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
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

  // Filter logic
  const filteredExpenses = expenses.filter((exp) => {
    return (
      exp.description.toLowerCase().includes(filterDescription.toLowerCase()) &&
      (filterAmount === "" || exp.amount === parseFloat(filterAmount)) &&
      (filterPaidBy === "" || exp.paidBy === filterPaidBy) &&
      (filterCategory === "" || exp.category === filterCategory)
    );
  });

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Expense List</h2>
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={thStyle}>
              Description<br />
              <input
                type="text"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder="Filter..."
                style={inputStyle}
              />
            </th>
            <th style={thStyle}>
              Amount (₹)<br />
              <input
                type="number"
                value={filterAmount}
                onChange={(e) => setFilterAmount(e.target.value)}
                placeholder="Filter..."
                style={inputStyle}
              />
            </th>
            <th style={thStyle}>
              Paid By<br />
              <select
                value={filterPaidBy}
                onChange={(e) => setFilterPaidBy(e.target.value)}
                style={inputStyle}
              >
                <option value="">All</option>
                <option value="Nishant">Nishant</option>
                <option value="Rajat">Rajat</option>
              </select>
            </th>
            <th style={thStyle}>
              Category<br />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={inputStyle}
              >
                <option value="">All</option>
                <option value="Groceries">Groceries</option>
                <option value="Outside Food">Outside Food</option>
                <option value="Meat">Meat</option>
                <option value="Other">Other</option>
              </select>
            </th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((exp) => (
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
          ))}
          {filteredExpenses.length === 0 && (
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

const inputStyle = {
  width: "90%",
  padding: "4px",
  fontSize: "0.9em",
};

export default ExpenseList;
