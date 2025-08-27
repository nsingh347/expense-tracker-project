import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filters, setFilters] = useState({
    month: "",
    description: "",
    amount: "",
    paidBy: "",
    category: "",
  });
  const [categories, setCategories] = useState([]);
  const [paidByList, setPaidByList] = useState([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const querySnapshot = await getDocs(collection(db, "expenses"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Extract dropdown options
    const categoryOptions = [...new Set(data.map((item) => item.category))];
    const paidByOptions = [...new Set(data.map((item) => item.paidBy))];

    setCategories(categoryOptions);
    setPaidByList(paidByOptions);
    setExpenses(data);
    setFilteredExpenses(data);
  };

  // ✅ safe month parser
  const getMonthName = (dateObj) => {
    if (!dateObj) return "";
    let date;
    if (dateObj.toDate) {
      date = dateObj.toDate();
    } else if (dateObj.seconds) {
      date = new Date(dateObj.seconds * 1000);
    } else {
      date = new Date(dateObj);
    }
    return date.toLocaleString("default", { month: "long" });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let filtered = [...expenses];

    if (filters.month) {
      filtered = filtered.filter(
        (exp) => getMonthName(exp.date) === filters.month
      );
    }
    if (filters.description) {
      filtered = filtered.filter((exp) =>
        exp.description?.toLowerCase().includes(filters.description.toLowerCase())
      );
    }
    if (filters.amount) {
      filtered = filtered.filter(
        (exp) => Number(exp.amount) === Number(filters.amount)
      );
    }
    if (filters.paidBy) {
      filtered = filtered.filter((exp) => exp.paidBy === filters.paidBy);
    }
    if (filters.category) {
      filtered = filtered.filter((exp) => exp.category === filters.category);
    }

    setFilteredExpenses(filtered);
  }, [filters, expenses]);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "expenses", id));
    fetchExpenses();
  };

  const handleEdit = async (id) => {
    const newDescription = prompt("Enter new description:");
    if (newDescription) {
      await updateDoc(doc(db, "expenses", id), { description: newDescription });
      fetchExpenses();
    }
  };

  const totalAmount = filteredExpenses.reduce(
    (acc, exp) => acc + Number(exp.amount || 0),
    0
  );

  const availableMonths = [
    ...new Set(expenses.map((exp) => getMonthName(exp.date))),
  ];

  return (
    <div style={{ marginTop: "30px" }}>
      {/* Filters */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <select name="month" value={filters.month} onChange={handleFilterChange}>
          <option value="">All Months</option>
          {availableMonths.map((month, idx) => (
            <option key={idx} value={month}>
              {month}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={filters.description}
          onChange={handleFilterChange}
        />

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={filters.amount}
          onChange={handleFilterChange}
        />

        <select name="paidBy" value={filters.paidBy} onChange={handleFilterChange}>
          <option value="">All Paid By</option>
          {paidByList.map((p, idx) => (
            <option key={idx} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
        >
          <option value="">All Categories</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Total */}
      <h3>Total: ₹{totalAmount}</h3>

      {/* Table */}
      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Month</th>
            <th>Description</th>
            <th>Category</th>
            <th>Paid By</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((exp) => (
            <tr key={exp.id}>
              <td>{getMonthName(exp.date)}</td>
              <td>{exp.description}</td>
              <td>{exp.category}</td>
              <td>{exp.paidBy}</td>
              <td>₹{exp.amount}</td>
              <td>
                <button onClick={() => handleEdit(exp.id)}>Edit</button>
                <button onClick={() => handleDelete(exp.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
