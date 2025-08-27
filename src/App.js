import React from "react";
import AddExpense from "./AddExpense";
import ExpenseList from "./ExpenseList";
function App() {
  return (
    <div>
      <h1>Expense Tracker</h1>
      <AddExpense />
      <ExpenseList />
    </div>
  );
}

export default App;