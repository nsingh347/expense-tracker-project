import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7f50",
  "#00C49F", "#FFBB28", "#FF8042", "#8dd1e1"
];

function CategoryChart({ expenses }) {
  const data = useMemo(() => {
    const categoryMap = {};
    expenses.forEach((exp) => {
      const cat = exp.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(exp.amount || 0);
    });

    return Object.keys(categoryMap).map((key) => ({
      name: key,
      value: categoryMap[key],
    }));
  }, [expenses]);

  if (data.length === 0) return null;

  return (
    <div style={{ maxWidth: "500px", marginTop: "2rem" }}>
      <h3>Expenses by Category</h3>
      <PieChart width={400} height={300}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}

export default CategoryChart;
