import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CATEGORIES, CATEGORY_COLORS } from '../config/constants';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const ExpenseCharts = ({ expenses }) => {
  const [budgetLimits, setBudgetLimits] = useState({});

  useEffect(() => {
    const fetchBudgetLimits = async () => {
      const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
      if (budgetDoc.exists()) {
        setBudgetLimits(budgetDoc.data());
      }
    };
    fetchBudgetLimits();
  }, []);

    // Initialize all categories with 0
    const expensesByCategory = CATEGORIES.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {});

    expenses.forEach(expense => {
      expensesByCategory[expense.category] += expense.amount;
    });

  // Group expenses by category
  // const expensesByCategory = expenses.reduce((acc, expense) => {
  //   acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
  //   return acc;
  // }, {});

  // Sort categories by amount spent (descending)
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [category, amount]) => {
      acc[category] = amount;
      return acc;
    }, {});

  const categories = Object.keys(sortedCategories);
  const amounts = Object.values(sortedCategories);
  const colors = categories.map(category => CATEGORY_COLORS[category]);

  // Expenses chart data
  const expensesChartData = {
    labels: categories,
    datasets: [
      {
        label: 'Expenses by Category',
        data: amounts,
        backgroundColor: colors.map(color => color + '90'),
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  };

  // Budget remaining chart data
  const budgetRemainingData = {
    labels: categories,
    datasets: [
      {
        label: 'Remaining Budget',
        data: categories.map(category => {
          const spent = expensesByCategory[category] || 0;
          const budget = budgetLimits[category] || 0;
          return Math.max(0, budget - spent);
        }),
        backgroundColor: colors.map(color => color + '90'), // Adding transparency
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
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedCategory = categories[index];
        window.location.href = `/category/${selectedCategory}`;
      }
    }
  };

  return (
    <div className="charts-container">
      <div className="chart-wrapper">
        <Bar data={expensesChartData} options={options} />
      </div>
      <div className="chart-wrapper">
        <Bar data={budgetRemainingData} options={options} />
      </div>
    </div>
  );
};

export default ExpenseCharts;