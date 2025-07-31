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
        date: new Date().toISOString()
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
    <form onSubmit={handleSubmit} style={{ margin: "20px" }}>
      <h2>Add Expense</h2>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      /><br /><br />

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      /><br /><br />

      <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
        <option value="Nishant">Nishant</option>
        <option value="Rajat">Rajat</option>
      </select><br /><br />

      {/* ✅ Category Dropdown */}
      <select value={category} onChange={(e) => setCategory(e.target.value)} required>
        <option value="">-- Select Category --</option>
        <option value="Groceries">Groceries</option>
        <option value="Outside Food">Outside Food</option>
        <option value="Meat">Meat</option>
        <option value="Other">Other</option>
      </select><br /><br />

      <button type="submit">Add Expense</button>
    </form>
  );
}

export default AddExpense;
