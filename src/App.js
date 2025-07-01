import React from "react";
import AddExpense from "./AddExpense";
import ExpenseList from "./ExpenseList";
import ExpenseChart from "./ExpenseChart";

function App() {
  return (
    <div>
      <h1>Expense Tracker</h1>
      <AddExpense />
      <ExpenseList />
      <ExpenseChart />
    </div>
  );
}

export default App;
