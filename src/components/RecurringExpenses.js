import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { CATEGORIES } from '../config/constants';
import ExpenseCharts from './ExpenseCharts';
import '../styles/App.css';

const RecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    frequency: 'Monthly'
  });

  const frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  const fetchRecurringExpenses = async () => {
    const recurringExpensesRef = collection(db, 'recurringExpenses');
    const snapshot = await getDocs(recurringExpensesRef);
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setRecurringExpenses(expenses);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddRecurringExpense = async () => {
    try {
      if (!formData.amount || isNaN(formData.amount)) {
        alert('Please enter a valid amount');
        return;
      }
      if (!formData.description) {
        alert('Please enter a description');
        return;
      }
      if (!formData.category) {
        alert('Please select a category');
        return;
      }

      const recurringExpenseRef = collection(db, 'recurringExpenses');
      const newRecurringExpense = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        frequency: formData.frequency,
        created: Timestamp.fromDate(new Date())
      };

      await addDoc(recurringExpenseRef, newRecurringExpense);
      setFormData({
        amount: '',
        description: '',
        category: '',
        frequency: 'Daily'
      });
      fetchRecurringExpenses();
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      alert('Failed to add recurring expense. Please try again.');
    }
  };

  const handleDeleteRecurringExpense = async (id) => {
    try {
      const expenseRef = doc(db, 'recurringExpenses', id);
      await deleteDoc(expenseRef);
      fetchRecurringExpenses();
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      alert('Failed to delete recurring expense. Please try again.');
    }
  };

  useEffect(() => {
    fetchRecurringExpenses();
  }, []);

  return (
    <div className="recurring-expenses-container">
      <h2>Recurring Expenses</h2>
      
      <div className="recurring-expense-form">
        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => handleFormChange('amount', e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={formData.category}
          onChange={(e) => handleFormChange('category', e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={formData.frequency}
          onChange={(e) => handleFormChange('frequency', e.target.value)}
          className="border p-2 rounded"
        >
          {frequencies.map((freq) => (
            <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={handleAddRecurringExpense}
          className="add-recurring-expense-button"
        >
          Add Recurring Expense
        </button>
      </div>

      <div className="recurring-expenses-list">
        {recurringExpenses.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recurringExpenses.map((expense) => (
              <li key={expense.id} className="py-4 flex justify-between items-center">
                <span>
                  {expense.category} - ${expense.amount.toFixed(2)} - {expense.description} ({expense.frequency})
                </span>
                <button
                  onClick={() => handleDeleteRecurringExpense(expense.id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recurring expenses found.</p>
        )}
        {recurringExpenses.length > 0 && (
          <ExpenseCharts expenses={recurringExpenses} />
        )}
      </div>
    </div>
  );
};

export default RecurringExpenses;
