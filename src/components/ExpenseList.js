import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import ExpenseCharts from './ExpenseCharts';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';
import '../styles/ExpenseList.css';

const ExpenseList = ({ expenses, filters, setFilters, handleDeleteExpense, fetchCurrentMonthExpenses }) => {
  const [rates, setRates] = useState({});
  const { preferredCurrency } = useCurrency();

  const displayAmount = useCallback((expense) => {
    if (!expense || !expense.originalCurrency) {
      return '0.00';
    }

    // If currencies match, display original amount
    if (expense.originalCurrency === preferredCurrency) {
      return parseFloat(expense.originalAmount).toFixed(2);
    }

    // If we have rates, convert the amount
    if (rates[expense.originalCurrency]) {
      const convertedAmount = CurrencyConverter.convertCurrency(
        expense.originalAmount,
        expense.originalCurrency,
        preferredCurrency,
        rates[expense.originalCurrency]
      );
      return parseFloat(convertedAmount).toFixed(2);
    }

    return '0.00';
  }, [rates, preferredCurrency]);

  useEffect(() => {
    const loadRates = async () => {
      if (!expenses || expenses.length === 0) return;
      
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
  }, [expenses]);

  const calculateTotalExpenses = useCallback(() => {
    if (!rates || expenses.length === 0) return '0.00';
    return expenses.reduce((total, expense) => {
      const amount = displayAmount(expense);
      return total + parseFloat(amount);
    }, 0).toFixed(2);
  }, [expenses, rates, displayAmount]);

  const formatDate = (expenseDate) => {
    let date;
    
    if (expenseDate instanceof Date) {
      date = expenseDate;
    } else if (expenseDate?.seconds) {
      date = new Date(expenseDate.seconds * 1000);
    } else {
      date = new Date();
    }
  
    // Format as dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}/${month}/${year}`;
  };

  const filterExpenses = (expenses) => {
    return expenses.filter(expense => {
      const expenseAmount = parseFloat(displayAmount(expense));
      
      // Date filter - using Firestore timestamp
      if (filters.date) {
        const expenseDate = new Date(expense.date.seconds * 1000);
        const filterDate = new Date(filters.date);
        
        // Compare year, month, and day
        const isSameDate = 
          expenseDate.getFullYear() === filterDate.getFullYear() &&
          expenseDate.getMonth() === filterDate.getMonth() &&
          expenseDate.getDate() === filterDate.getDate();
          
        if (!isSameDate) return false;
      }
  
      // Text filter
      if (filters.text && !expense.description.toLowerCase().includes(filters.text.toLowerCase())) {
        return false;
      }
  
      // Amount filters
      if (filters.minAmount && expenseAmount < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && expenseAmount > parseFloat(filters.maxAmount)) {
        return false;
      }
  
      return true;
    });
  };

  const filteredExpenses = filterExpenses(expenses);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-4">Expense Analysis:</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DatePicker
          selected={filters.date}
          onChange={(date) => setFilters(prev => ({ ...prev, date }))}
          dateFormat="dd-MM-yyyy"
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

      <button 
        className="view-monthly-expense-button" 
        onClick={fetchCurrentMonthExpenses}
      >
        Clear all filters
      </button>

      <p className="text-lg font-bold mb-4">
        Total Expenses: {calculateTotalExpenses(filteredExpenses)} {preferredCurrency}
      </p>

      {filteredExpenses.length >= 0 ? (
        <ul className="expense-list">
          {filteredExpenses.map((expense) => (
            <li key={expense.id} className="expense-item">
              <span>
                {expense.category} - {displayAmount(expense)} {preferredCurrency} 
                {expense.originalCurrency !== preferredCurrency && 
                  ` (${expense.originalAmount} ${expense.originalCurrency})`} - {expense.description} - {formatDate(expense.date)}
              </span>
              <button className='delete-button' onClick={() => handleDeleteExpense(expense)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">No expenses found.</p>
      )}

      <ExpenseCharts expenses={filteredExpenses} showPie = {false} />

    </div>
  );
};

export default ExpenseList;
