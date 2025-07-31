import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState({
    description: "",
    amount: "",
    paidBy: "",
    date: ""
  });

  useEffect(() => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(data);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const descriptionMatch = expense.description?.toLowerCase().includes(filters.description.toLowerCase());
      const amountMatch = expense.amount?.toString().includes(filters.amount);
      const paidByMatch = expense.paidBy?.toLowerCase().includes(filters.paidBy.toLowerCase());
      
      let dateMatch = true;
      if (filters.date) {
        const expenseDate = new Date(expense.date).toLocaleDateString();
        dateMatch = expenseDate.includes(filters.date);
      }

      return descriptionMatch && amountMatch && paidByMatch && dateMatch;
    });
  }, [expenses, filters]);

  const clearFilters = () => {
    setFilters({
      description: "",
      amount: "",
      paidBy: "",
      date: ""
    });
  };

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div style={{ margin: "20px" }}>
      <h2>Expense List</h2>
      
      {/* Filter Section */}
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "5px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Filters</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "10px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description:</label>
            <input
              type="text"
              placeholder="Filter by description..."
              value={filters.description}
              onChange={(e) => handleFilterChange("description", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Amount:</label>
            <input
              type="text"
              placeholder="Filter by amount..."
              value={filters.amount}
              onChange={(e) => handleFilterChange("amount", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Paid By:</label>
            <select
              value={filters.paidBy}
              onChange={(e) => handleFilterChange("paidBy", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            >
              <option value="">All</option>
              <option value="Nishant">Nishant</option>
              <option value="Rajat">Rajat</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Date:</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            />
          </div>
        </div>
        <button 
          onClick={clearFilters}
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#6c757d", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer" 
          }}
        >
          Clear Filters
        </button>
        <span style={{ marginLeft: "15px", color: "#666" }}>
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </span>
      </div>

      {filteredExpenses.length === 0 ? (
        <p>No expenses found matching your filters.</p>
      ) : (
        <div>
          <table border="1" cellPadding="10" cellSpacing="0" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Description</th>
                <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Amount (₹)</th>
                <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Paid By</th>
                <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Date</th>
                <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{exp.description}</td>
                  <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>₹{exp.amount?.toFixed(2)}</td>
                  <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{exp.paidBy}</td>
                  <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>
                    {new Date(exp.date).toLocaleDateString()} {new Date(exp.date).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      style={{ 
                        padding: "6px 12px", 
                        backgroundColor: "#dc3545", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "4px", 
                        cursor: "pointer" 
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>Total</td>
                <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>₹{totalAmount.toFixed(2)}</td>
                <td style={{ padding: "12px", border: "1px solid #dee2e6" }} colSpan="3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExpenseList;
