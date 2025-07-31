import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

function AddExpense() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState("Nishant");
  const [category, setCategory] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !description || !category) {
      alert("Please fill all fields");
      return;
    }

    try {
      await addDoc(collection(db, "expenses"), {
        amount: parseFloat(amount),
        description,
        paidBy,
        category,
        date: new Date().toISOString(),
      });

      setAmount("");
      setDescription("");
      setPaidBy("Nishant");
      setCategory("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Add Expense</h2>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={inputStyle}
        />

        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          style={inputStyle}
        >
          <option value="Nishant">Nishant</option>
          <option value="Rajat">Rajat</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">-- Select Category --</option>
          <option value="Groceries">Groceries</option>
          <option value="Outside Food">Outside Food</option>
          <option value="Meat">Meat</option>
          <option value="Other">Other</option>
        </select>

        <button type="submit" style={buttonStyle}>
          Add Expense
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: "8px",
  fontSize: "1em",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const buttonStyle = {
  padding: "10px",
  fontSize: "1em",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#007bff",
  color: "#fff",
  cursor: "pointer",
};

export default AddExpense;
