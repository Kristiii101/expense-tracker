import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CATEGORIES, CATEGORY_COLORS } from '../config/constants';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';
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
  const [rates, setRates] = useState(null);
  const { preferredCurrency } = useCurrency();

  useEffect(() => {
    const fetchBudgetLimits = async () => {
      const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
      if (budgetDoc.exists()) {
        const data = budgetDoc.data();
        const rates = await CurrencyConverter.getExchangeRates(data.currency || preferredCurrency);
        
        // Convert budget limits to preferred currency
        const convertedLimits = {};
        Object.entries(data).forEach(([category, amount]) => {
          if (category !== 'currency') {
            convertedLimits[category] = CurrencyConverter.convertCurrency(
              amount,
              data.currency || preferredCurrency,
              preferredCurrency,
              rates
            );
          }
        });
        
        setBudgetLimits(convertedLimits);
      }
    };
    fetchBudgetLimits();
  }, [preferredCurrency]);

  useEffect(() => {
    const loadRates = async () => {
      const uniqueCurrencies = [...new Set(expenses
        .map(exp => exp.originalCurrency)
        .filter(Boolean))];
      
      const ratesMap = {};
      for (const currency of uniqueCurrencies) {
        const newRates = await CurrencyConverter.getExchangeRates(currency);
        if (newRates) {
          ratesMap[currency] = newRates;
        }
      }
      setRates(ratesMap);
    };
    loadRates();
  }, [expenses, preferredCurrency]);

  const convertAmount = (expense) => {
    if (!expense.originalCurrency || !rates?.[expense.originalCurrency]) {
      return expense.amount;
    }

    return CurrencyConverter.convertCurrency(
      expense.originalAmount || expense.amount,
      expense.originalCurrency,
      preferredCurrency,
      rates[expense.originalCurrency]
    );
  };

  const expensesByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = expenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + convertAmount(expense), 0);
    return acc;
  }, {});

  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [category, amount]) => {
      acc[category] = amount;
      return acc;
    }, {});

  const categories = Object.keys(sortedCategories);
  const amounts = Object.values(sortedCategories);
  const colors = categories.map(category => CATEGORY_COLORS[category]);

  const budgetRemainingData = {
    labels: categories,
    datasets: [{
      label: `Remaining Budget (${preferredCurrency})`,
      data: categories.map(category => {
        const spent = expensesByCategory[category] || 0;
        const budget = budgetLimits[category] || 0;
        return Math.max(0, budget - spent);
      }),
      backgroundColor: colors.map(color => color + '90'),
      borderColor: colors,
      borderWidth: 1,
    }],
  };

  const expensesChartData = {
    labels: categories,
    datasets: [{
      label: `Expenses by Category (${preferredCurrency})`,
      data: amounts,
      backgroundColor: colors.map(color => color + '90'),
      borderColor: colors,
      borderWidth: 1,
    }],
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
