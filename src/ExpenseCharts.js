import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ExpenseCharts = ({ expenses }) => {
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Prepare data for charts
  const categories = Object.keys(expensesByCategory);
  const amounts = Object.values(expensesByCategory);

  // Generate random colors for pie chart
  const colors = categories.map(() => 
    `hsla(${Math.random() * 360}, 70%, 50%, 0.8)`
  );

  const barChartData = {
    labels: categories,
    datasets: [
      {
        label: 'Expenses by Category',
        data: amounts,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: categories,
    datasets: [
      {
        data: amounts,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Expense Distribution',
      },
    },
  };

  return (
    <div className="charts-container">
      <div className="chart-wrapper">
        <Bar data={barChartData} options={options} />
      </div>
      <div className="chart-wrapper">
        <Pie data={pieChartData} options={options} />
      </div>
    </div>
  );
};

export default ExpenseCharts;