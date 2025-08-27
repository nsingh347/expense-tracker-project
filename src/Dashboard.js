import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA66CC", "#FF4444"];

function safeDateToMonth(dateField) {
  // robust parse to get month name
  try {
    if (!dateField) return "July";
    if (typeof dateField.toDate === "function") {
      const d = dateField.toDate();
      return d.toLocaleString("default", { month: "long" });
    }
    if (typeof dateField.seconds === "number") {
      const ms = dateField.seconds * 1000 + (dateField.nanoseconds ? dateField.nanoseconds / 1e6 : 0);
      const d = new Date(ms);
      return d.toLocaleString("default", { month: "long" });
    }
    const d = dateField instanceof Date ? dateField : new Date(dateField);
    if (!isNaN(d)) return d.toLocaleString("default", { month: "long" });
    return "July";
  } catch {
    return "July";
  }
}

function isoMonthKeyFromDateField(dateField) {
  // returns "YYYY-MM" key used for budget docs
  try {
    if (!dateField) {
      const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    }
    if (typeof dateField.toDate === "function") {
      const d = dateField.toDate();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    }
    if (typeof dateField.seconds === "number") {
      const ms = dateField.seconds * 1000;
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    }
    const d = dateField instanceof Date ? dateField : new Date(dateField);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  } catch {
    const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  }
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });
  const [budget, setBudget] = useState("");
  const [budgetSavedForKey, setBudgetSavedForKey] = useState(null);
  const [loadingBudget, setLoadingBudget] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setExpenses(data);
    });
    return () => unsub();
  }, []);

  // compute months present as YYYY-MM keys (sorted)
  const monthKeys = useMemo(() => {
    const setKeys = new Set();
    expenses.forEach(e => {
      setKeys.add(isoMonthKeyFromDateField(e.date));
    });
    // ensure current month present
    const arr = Array.from(setKeys);
    if (!arr.includes(selectedMonthKey)) arr.push(selectedMonthKey);
    arr.sort();
    return arr;
  }, [expenses, selectedMonthKey]);

  // expenses for selected month
  const expensesForMonth = useMemo(() => {
    return expenses.filter(e => isoMonthKeyFromDateField(e.date) === selectedMonthKey);
  }, [expenses, selectedMonthKey]);

  // pie data by category for selected month
  const pieData = useMemo(() => {
    const m = {};
    expensesForMonth.forEach(e => {
      const cat = e.category || "Uncategorized";
      m[cat] = (m[cat] || 0) + Number(e.amount || 0);
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [expensesForMonth]);

  // most spent category
  const mostSpent = useMemo(() => {
    if (pieData.length === 0) return null;
    const sorted = [...pieData].sort((a,b) => b.value - a.value);
    return sorted[0];
  }, [pieData]);

  // trend data: sum by day for selected month
  const trendData = useMemo(() => {
    const map = {};
    expensesForMonth.forEach(e => {
      // parse day string YYYY-MM-DD
      let d;
      if (typeof e.date?.toDate === "function") d = e.date.toDate();
      else if (typeof e.date?.seconds === "number") d = new Date(e.date.seconds * 1000);
      else d = new Date(e.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      map[key] = (map[key] || 0) + Number(e.amount || 0);
    });
    // produce sorted array
    const arr = Object.entries(map).map(([date, value]) => ({ date, value }));
    arr.sort((a,b) => new Date(a.date) - new Date(b.date));
    return arr;
  }, [expensesForMonth]);

  // total spent in selected month
  const spent = useMemo(() => expensesForMonth.reduce((s,e)=> s + Number(e.amount||0), 0), [expensesForMonth]);

  // load budget for selectedMonthKey
  useEffect(() => {
    let canceled = false;
    async function load() {
      setLoadingBudget(true);
      try {
        const budDoc = doc(db, "budgets", selectedMonthKey);
        const snap = await getDoc(budDoc);
        if (!canceled) {
          if (snap.exists()) {
            const amt = snap.data().amount ?? 0;
            setBudget(amt);
            setBudgetSavedForKey(selectedMonthKey);
          } else {
            setBudget("");
            setBudgetSavedForKey(null);
          }
        }
      } catch (err) {
        console.error("load budget err", err);
      } finally {
        if (!canceled) setLoadingBudget(false);
      }
    }
    load();
    return () => { canceled = true; };
  }, [selectedMonthKey]);

  const handleSaveBudget = async () => {
    try {
      if (!selectedMonthKey) return alert("Select month first");
      const budRef = doc(db, "budgets", selectedMonthKey);
      await setDoc(budRef, { amount: Number(budget || 0), updatedAt: new Date() });
      setBudgetSavedForKey(selectedMonthKey);
      alert("Budget saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save budget");
    }
  };

  // progress color (gamification)
  const progressPercent = budget ? Math.min(100, Math.round((spent / (Number(budget) || 1)) * 100)) : 0;
  const progressColor =
    progressPercent < 50 ? "#28a745" : progressPercent < 80 ? "#ff9800" : "#e53935";

  return (
    <div>
      <h2>Dashboard — {selectedMonthKey}</h2>

      {/* Month selector */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label>Month:</label>
        <select value={selectedMonthKey} onChange={(e) => setSelectedMonthKey(e.target.value)}>
          {monthKeys.map(mk => <option key={mk} value={mk}>{mk}</option>)}
        </select>
      </div>

      {/* Budget tracker */}
      <div style={{ display: "flex", gap: 20, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ minWidth: 300, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3>Budget Tracker ({selectedMonthKey})</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              placeholder="Enter monthly budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{ padding: 8, minWidth: 160 }}
            />
            <button onClick={handleSaveBudget} style={{ padding: "8px 12px" }}>Save</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div>Spent: ₹{spent.toFixed(2)} / ₹{Number(budget || 0).toFixed(2)}</div>
            <div style={{ height: 18, background: "#eee", borderRadius: 10, marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: progressColor }} />
            </div>
            <div style={{ marginTop: 6 }}>{progressPercent}% used</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
            <em>Gamification: Keep below 50% for green, below 80% orange, otherwise red.</em>
          </div>
        </div>

        {/* Most spent */}
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, minWidth: 260 }}>
          <h3>Most Spent On</h3>
          {mostSpent ? (
            <>
              <div style={{ fontSize: 18, fontWeight: "bold" }}>{mostSpent.name}</div>
              <div>₹{mostSpent.value.toFixed(2)}</div>
            </>
          ) : <div>No data</div>}
        </div>

        {/* Pie */}
        <div style={{ flex: 1, minWidth: 320, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3>Category Breakdown</h3>
          {pieData.length ? (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {pieData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div>No data</div>}
        </div>
      </div>

      {/* Trends */}
      <div style={{ marginTop: 20 }}>
        <h3>Spending Trends (daily)</h3>
        {trendData.length ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.split("-")[2]} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div>No trend data for this month</div>}
      </div>
    </div>
  );
}
