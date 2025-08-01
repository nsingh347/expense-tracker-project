import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function ExpenseChart() {
  const [nishantTotal, setNishantTotal] = useState(0);
  const [rajatTotal, setRajatTotal] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "expenses"), (snapshot) => {
      let nishant = 0;
      let rajat = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.paidBy === "Nishant") {
          nishant += data.amount;
        } else if (data.paidBy === "Rajat") {
          rajat += data.amount;
        }
      });

      setNishantTotal(nishant);
      setRajatTotal(rajat);
    });

    return () => unsubscribe();
  }, []);

  const data = {
    labels: ["Nishant", "Rajat"],
    datasets: [
      {
        data: [nishantTotal, rajatTotal],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"]
      }
    ]
  };

  return (
    <div style={{ width: "300px", margin: "20px auto" }}>
      <h2>Contribution Pie Chart</h2>
      <Pie data={data} />
    </div>
  );
}

export default ExpenseChart;
