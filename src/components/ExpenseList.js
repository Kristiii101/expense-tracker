import React from 'react';
import DatePicker from 'react-datepicker';
import ExpenseCharts from './ExpenseCharts';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useEffect } from 'react';

const ExpenseList = ({ expenses, filters, setFilters, handleDeleteExpense, fetchCurrentMonthExpenses, calculateTotalExpenses }) => {
  useEffect(() => {
    checkBudgetLimits(expenses);
  }, [expenses]);

  const checkBudgetLimits = async (expenses) => {
    const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
    const budgetLimits = budgetDoc.data() || {};

    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    Object.entries(categoryTotals).forEach(([category, total]) => {
      const limit = budgetLimits[category];
      if (limit) {
        const percentage = (total / limit) * 100;
        if (percentage >= 90) {
          alert(`Warning: You've used ${percentage.toFixed(1)}% of your ${category} budget!`);
        }
      }
    });
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
        Total Expenses: ${calculateTotalExpenses().toFixed(2)}
      </p>

      {expenses.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {expenses.map((expense) => (
            <li key={expense.id} className="py-4 flex justify-between items-center">
              <span>
                {expense.category} - ${expense.amount.toFixed(2)} - {expense.description} - {expense.date}
              </span>
              <button
                onClick={() => handleDeleteExpense(expense)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
              >
                Delete
              </button>
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
