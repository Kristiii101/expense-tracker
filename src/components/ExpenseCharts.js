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

// Define fixed colors for categories
const CATEGORY_COLORS = {
  'Food & Dining': '#FF6384',
  'Transportation': '#36A2EB',
  'Shopping': '#FFCE56',
  'Bills & Utilities': '#4BC0C0',
  'Entertainment': '#9966FF',
  'Healthcare': '#FF9F40',
  'Other': '#C9CBCF'
};

const ExpenseCharts = ({ expenses }) => {
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Sort categories by amount spent (descending)
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [category, amount]) => {
      acc[category] = amount;
      return acc;
    }, {});

  // Prepare data for charts
  const categories = Object.keys(sortedCategories);
  const amounts = Object.values(sortedCategories);
  const colors = categories.map(category => CATEGORY_COLORS[category]);

  const barChartData = {
    labels: categories,
    datasets: [
      {
        label: 'Expenses by Category',
        data: amounts,
        backgroundColor: colors,
        borderColor: colors,
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
        borderColor: colors,
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