import React, { useEffect, useState, useMemo } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

/**
 * Helper for robustly parsing Firestore Timestamp/Date/string
 */
function monthFromAny(value) {
  try {
    if (!value) return "July";
    if (typeof value.toDate === "function") {
      const d = value.toDate();
      return d.toLocaleString("default", { month: "long" });
    }
    if (typeof value.seconds === "number") {
      const ms = value.seconds * 1000 + (value.nanoseconds ? value.nanoseconds / 1e6 : 0);
      const d = new Date(ms);
      return d.toLocaleString("default", { month: "long" });
    }
    const d = value instanceof Date ? value : new Date(value);
    if (!isNaN(d)) return d.toLocaleString("default", { month: "long" });
    return "July";
  } catch {
    return "July";
  }
}

function AddExpenseInline({ onAdded }) {
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
        date: new Date(),
        createdAt: serverTimestamp(),
      });
      setAmount(""); setDescription(""); setPaidBy("Nishant"); setCategory("");
      if (onAdded) onAdded();
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
      <input style={{ padding: 8 }} type="number" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
      <input style={{ padding: 8, minWidth: 220 }} type="text" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <select style={{ padding: 8 }} value={paidBy} onChange={e=>setPaidBy(e.target.value)}>
        <option value="Nishant">Nishant</option>
        <option value="Rajat">Rajat</option>
        <option value="Rahul">Rahul</option>
      </select>
      <select style={{ padding: 8 }} value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="">-- Category --</option>
        <option value="Groceries">Groceries</option>
        <option value="Outside Food">Outside Food</option>
        <option value="Meat">Meat</option>
        <option value="Other">Other</option>
      </select>
      <button style={{ padding: "8px 12px" }} type="submit">Add</button>
    </form>
  );
}

export default function Details() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ month: "", category: "", paidBy: "", description: "", amount: "" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ description: "", amount: "", paidBy: "", category: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRows(data);
    });
    return () => unsub();
  }, []);

  const monthsAvailable = useMemo(() => {
    const setM = new Set(rows.map(r => monthFromAny(r.date)));
    return Array.from(setM);
  }, [rows]);

  const categories = useMemo(() => Array.from(new Set(rows.map(r => r.category).filter(Boolean))), [rows]);
  const paidByList = useMemo(() => Array.from(new Set(rows.map(r => r.paidBy).filter(Boolean))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filters.month && monthFromAny(r.date) !== filters.month) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.paidBy && r.paidBy !== filters.paidBy) return false;
      if (filters.description && !(r.description || "").toLowerCase().includes(filters.description.toLowerCase())) return false;
      if (filters.amount && Number(r.amount) !== Number(filters.amount)) return false;
      return true;
    });
  }, [rows, filters]);

  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await deleteDoc(doc(db, "expenses", id));
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditData({ description: row.description || "", amount: row.amount || "", paidBy: row.paidBy || "", category: row.category || "" });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateDoc(doc(db, "expenses", editingId), {
      description: editData.description,
      amount: Number(editData.amount),
      paidBy: editData.paidBy,
      category: editData.category
    });
    setEditingId(null);
  };

  return (
    <div>
      <h2>Details</h2>

      <AddExpenseInline onAdded={() => { /* new expense will appear by onSnapshot */ }} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={filters.month} onChange={e=>setFilters(f=>({...f, month: e.target.value}))}>
          <option value="">All Months</option>
          {monthsAvailable.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filters.category} onChange={e=>setFilters(f=>({...f, category: e.target.value}))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filters.paidBy} onChange={e=>setFilters(f=>({...f, paidBy: e.target.value}))}>
          <option value="">All Paid By</option>
          {paidByList.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <input placeholder="Description" value={filters.description} onChange={e=>setFilters(f=>({...f, description: e.target.value}))} />
        <input placeholder="Amount" type="number" value={filters.amount} onChange={e=>setFilters(f=>({...f, amount: e.target.value}))} />
      </div>

      <div style={{ marginBottom: 8, fontWeight: "bold" }}>Total: ₹{total.toFixed(2)}</div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f4f6f8" }}>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Month</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Description</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Amount</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Category</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Paid By</th>
            <th style={{ border: "1px solid #ddd", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(row => (
            <tr key={row.id}>
              <td style={{ border: "1px solid #eee", padding: 8 }}>{monthFromAny(row.date)}</td>

              <td style={{ border: "1px solid #eee", padding: 8 }}>
                {editingId === row.id ? (
                  <input value={editData.description} onChange={e=>setEditData(d=>({...d, description: e.target.value}))} />
                ) : row.description}
              </td>

              <td style={{ border: "1px solid #eee", padding: 8 }}>
                {editingId === row.id ? (
                  <input type="number" value={editData.amount} onChange={e=>setEditData(d=>({...d, amount: e.target.value}))} />
                ) : `₹${Number(row.amount||0).toFixed(2)}`}
              </td>

              <td style={{ border: "1px solid #eee", padding: 8 }}>
                {editingId === row.id ? (
                  <select value={editData.category} onChange={e=>setEditData(d=>({...d, category: e.target.value}))}>
                    {[editData.category, ...categories].filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : row.category}
              </td>

              <td style={{ border: "1px solid #eee", padding: 8 }}>
                {editingId === row.id ? (
                  <select value={editData.paidBy} onChange={e=>setEditData(d=>({...d, paidBy: e.target.value}))}>
                    {[editData.paidBy, ...paidByList].filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : row.paidBy}
              </td>

              <td style={{ border: "1px solid #eee", padding: 8 }}>
                {editingId === row.id ? (
                  <>
                    <button onClick={saveEdit} style={{ marginRight: 8 }}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(row)} style={{ marginRight: 8 }}>Edit</button>
                    <button onClick={() => handleDelete(row.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 12, textAlign: "center" }}>No records</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
