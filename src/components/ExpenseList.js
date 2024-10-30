import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import ExpenseCharts from './ExpenseCharts';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCurrency } from '../context/CurrencyContext';

const ExpenseList = ({ expenses, filters, setFilters, handleDeleteExpense, fetchCurrentMonthExpenses }) => {
  const { preferredCurrency } = useCurrency();
  const [exchangeRates, setExchangeRates] = useState({});

  const convertAmount = useCallback((amount, originalCurrency) => {
    // Return original amount if currencies match
    if (originalCurrency === preferredCurrency) {
      return amount;
    }
    
    // Convert using stored exchange rate
    if (exchangeRates[originalCurrency]) {
      const rate = exchangeRates[preferredCurrency] / exchangeRates[originalCurrency];
      return (amount * rate).toFixed(2);
    }
    
    return amount;
  }, [exchangeRates, preferredCurrency]);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${preferredCurrency}`);
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    fetchExchangeRates();
  }, [preferredCurrency]);

  useEffect(() => {
    const checkBudgetLimits = async (expenses) => {
      const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
      const budgetData = budgetDoc.data() || {};
      const budgetLimits = budgetData || {};
  
      // Calculate totals in the stored currency
      const categoryTotals = expenses.reduce((acc, expense) => {
        // Ensure we're comparing in the same currency
        const amount = Number(expense.amount);
        acc[expense.category] = (acc[expense.category] || 0) + amount;
        return acc;
      }, {});
  
      // Check each category against its limit
      Object.entries(categoryTotals).forEach(([category, total]) => {
        const limit = budgetLimits[category];
        if (limit) {
          const percentage = (total / limit) * 100;
          // Alert at 90% or more
          if (percentage >= 90) {
            alert(`Warning: You've used ${percentage.toFixed(1)}% of your ${category} budget!\n${total.toFixed(2)} ${preferredCurrency} / ${limit} ${preferredCurrency}`);
          }
        }
      });
    };
  
    checkBudgetLimits(expenses);
  }, [expenses, preferredCurrency]);
  
  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => {
      if (expense.originalCurrency === preferredCurrency) {
        return total + expense.amount;
      }
      return total + parseFloat(convertAmount(expense.amount, expense.originalCurrency));
    }, 0).toFixed(2);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-4">Expense Analysis:</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DatePicker
          selected={filters.date}
          onChange={(date) => setFilters(prev => ({ ...prev, date }))}
          dateFormat="yyyy-MM-dd"
          placeholderText="Filter by date"
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Search by description"
          value={filters.text}
          onChange={(e) => setFilters(prev => ({ ...prev, text: e.target.value }))}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Min Amount"
          value={filters.minAmount}
          onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Max Amount"
          value={filters.maxAmount}
          onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
          className="border p-2 rounded"
        />
      </div>

      <button className="view-monthly-expense-button" onClick={fetchCurrentMonthExpenses}>
        Clear all filters
      </button>

      <p className="text-lg font-bold mb-4">
        Total Expenses: {calculateTotalExpenses()} {preferredCurrency}
      </p>

      {expenses.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {expenses.map((expense) => (
            <li key={expense.id} className="py-4 flex justify-between items-center">
              <span>
                {expense.category} - {convertAmount(expense.amount, expense.originalCurrency)} {preferredCurrency} - {expense.description} - {expense.date}
              </span>
              <button onClick={() => handleDeleteExpense(expense)}>Delete</button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">No expenses found.</p>
      )}

      <ExpenseCharts expenses={expenses} />
    </div>
  );
};

export default ExpenseList;
