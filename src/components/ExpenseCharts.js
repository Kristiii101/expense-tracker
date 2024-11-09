import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';
import { getCategoryColor } from '../utils/CategoryColors';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PieController
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PieController
);

const ExpenseCharts = ({ expenses, showExpenses = true, showBudget = true }) => {
  const [budgetLimits, setBudgetLimits] = useState({});
  const [rates, setRates] = useState(null);
  const [categories, setCategories] = useState([]);
  const { preferredCurrency } = useCurrency();

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

  const expensesByCategory = categories.reduce((acc, category) => {
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

  const categoryLabels = Object.keys(sortedCategories);
  const amounts = Object.values(sortedCategories);
  const colors = categoryLabels.map(category => getCategoryColor(category));

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesRef = doc(db, 'settings', 'categories');
      const categoriesDoc = await getDoc(categoriesRef);
      if (categoriesDoc.exists()) {
        setCategories(categoriesDoc.data().list);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBudgetLimits = async () => {
      const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
      if (budgetDoc.exists()) {
        const budgetData = budgetDoc.data();
        const rates = await CurrencyConverter.getExchangeRates(budgetData.currency || preferredCurrency);
        
        const convertedLimits = {};
        Object.entries(budgetData).forEach(([category, amount]) => {
          if (category !== 'currency') {
            convertedLimits[category] = CurrencyConverter.convertCurrency(
              amount,
              budgetData.currency || preferredCurrency,
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

  const budgetRemainingData = {
    labels: categoryLabels,
    datasets: [{
      label: `Remaining Budget (${preferredCurrency})`,
      data: categoryLabels.map(category => {
        const spent = expensesByCategory[category] || 0;
        const budget = budgetLimits[category] || 0;
        return Math.max(0, budget - spent);
      }),
      backgroundColor: colors.map(color => color + '90'),
      borderColor: colors,
      borderWidth: 1,
    }],
  };

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

  const expensesChartData = {
    labels: categoryLabels,
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
        const selectedCategory = categoryLabels[index];
        window.location.href = `/category/${selectedCategory}`;
      }
    }
  };

  return (
    <div className="charts-container">
      {showExpenses && (
        <div className="chart-wrapper">
          <h3>Expenses by Category</h3>
          <Bar data={expensesChartData} options={options} />
        </div>
      )}
      {showBudget && (
        <div className="chart-wrapper">
          <h3>Remaining Budget</h3>
          <Bar data={budgetRemainingData} options={options} />
        </div>
      )}
    </div>
  );
};

export default ExpenseCharts;
