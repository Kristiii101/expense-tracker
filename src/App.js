import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';
import ExpenseCharts from './ExpenseCharts';
import './index.css';

// Constants
const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Other'
];

// Date utility functions
const formatDateForDB = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Initial form state
const initialFormState = {
  amount: '',
  description: '',
  category: '',
  date: new Date()
};

function App() {
  // State management
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [filters, setFilters] = useState({
    date: null,
    text: '',
    minAmount: '',
    maxAmount: ''
  });

  // Form handlers
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };

  // Fetch expenses with filters
  const fetchExpenses = useCallback(async (date = null) => {
    try {
      let expensesData = [];

      if (date) {
        const formattedDate = formatDateForDB(date);
        const dateDocRef = doc(db, 'expenses', formattedDate);
        const detailsCollectionRef = collection(dateDocRef, 'details');
        
        const data = await getDocs(detailsCollectionRef);
        expensesData = data.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: formattedDate
        }));
      } else {
        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
        for (const dateDoc of expensesSnapshot.docs) {
          const detailsCollectionRef = collection(dateDoc.ref, 'details');
          const detailsSnapshot = await getDocs(detailsCollectionRef);
          const expensesForDate = detailsSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            date: dateDoc.id
          }));
          expensesData = expensesData.concat(expensesForDate);
        }
      }

      // Apply filters
      return expensesData.filter(expense => {
        const matchesText = !filters.text || 
          expense.description.toLowerCase().includes(filters.text.toLowerCase());
        const matchesMinAmount = !filters.minAmount || 
          expense.amount >= parseFloat(filters.minAmount);
        const matchesMaxAmount = !filters.maxAmount || 
          expense.amount <= parseFloat(filters.maxAmount);
        
        return matchesText && matchesMinAmount && matchesMaxAmount;
      });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }, [filters]);

  // Add new expense
  const handleAddExpense = async () => {
    try {
      // Validation
      if (!formData.amount || isNaN(formData.amount)) {
        alert('Please enter a valid number for the amount.');
        return;
      }
      if (!formData.description) {
        alert('Please enter a description for the expense.');
        return;
      }
      if (!formData.category) {
        alert('Please select a category for the expense.');
        return;
      }

      const dateString = formatDateForDB(formData.date);
      const now = new Date();
      
      const newExpense = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        created: {
          iso: now.toISOString(),
          timestamp: Timestamp.fromDate(now)
        },
        date: dateString
      };

      const dateDocRef = doc(db, 'expenses', dateString);
      const dateDocSnapshot = await getDoc(dateDocRef);

      if (!dateDocSnapshot.exists()) {
        await setDoc(dateDocRef, {
          created: {
            iso: now.toISOString(),
            timestamp: Timestamp.fromDate(now)
          }
        });
      }

      const expensesCollectionRef = collection(dateDocRef, 'details');
      await addDoc(expensesCollectionRef, newExpense);

      resetForm();
      setShowForm(false);
      if (showExpenses) {
        const updatedExpenses = await fetchExpenses(filters.date);
        setExpenses(updatedExpenses);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  // Delete expense
  const handleDeleteExpense = async (expense) => {
    try {
      const dateDocRef = doc(db, 'expenses', expense.date);
      const expenseDocRef = doc(collection(dateDocRef, 'details'), expense.id);
      await deleteDoc(expenseDocRef);
      
      const updatedExpenses = await fetchExpenses(filters.date);
      setExpenses(updatedExpenses);
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };
  
  // Function to fetch current month's expenses
  const fetchCurrentMonthExpenses = async () => {
    try {
      const { firstDay, lastDay } = getCurrentMonthDates();
      let allExpenses = [];
      
      // Get all dates between first and last day of current month
      for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const dateString = formatDateForDB(date);
        const dateDocRef = doc(db, 'expenses', dateString);
        const detailsCollectionRef = collection(dateDocRef, 'details');
        
        const data = await getDocs(detailsCollectionRef);
        const expensesForDate = data.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: dateString
        }));
        
        allExpenses = allExpenses.concat(expensesForDate);
      }
  
      // Update the expenses state with the filtered data
      setExpenses(allExpenses);
      // Update filters to show we're viewing current month
      setFilters(prev => ({
        ...prev,
        date: null,
        text: '',
        minAmount: '',
        maxAmount: ''
      }));
      
      // Make sure expenses are visible
      setShowExpenses(true);
      setShowForm(false);
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      alert('Failed to fetch monthly expenses. Please try again.');
    }
  };

  // Toggle handlers
  const toggleForm = () => {
    setShowForm(!showForm);
    setShowExpenses(false);
    resetForm();
  };

  const toggleViewExpenses = () => {
    setShowExpenses(!showExpenses);
    setShowForm(false);
  };

  // Calculate totals
  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Effects
  useEffect(() => {
    if (showExpenses) {
      fetchExpenses(filters.date).then(setExpenses);
    }
  }, [showExpenses, filters, fetchExpenses]);

  return (
    <div className="App">
        <header className="App-header">
        <p style={{ textAlign: 'center', color: '#ff5555', fontSize: 30 }}>
          Welcome to your expenses tracker.
        </p>

        <button className="add-expense-button" onClick={toggleForm}>
          Add a new expense
        </button>

        <button className="view-expense-button" onClick={toggleViewExpenses}>
          View all expenses
        </button>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto mb-8">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="border p-2 rounded"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                className="border p-2 rounded"
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <DatePicker
                selected={formData.date}
                onChange={(date) => handleFormChange('date', date)}
                dateFormat="yyyy-MM-dd"
                className="border p-2 rounded w-full"
              />
              <button
                onClick={handleAddExpense}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {showExpenses && (
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
              View Expenses for Current Month
            </button>

            <p className="text-lg font-bold mb-4">
              Total Expenses: ${calculateTotalExpenses().toFixed(2)}
            </p>

            {expenses.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <li key={expense.id} className="py-4 flex justify-between items-center">
                    <span>
                      {expense.category} - ${expense.amount.toFixed(2)} - {expense.description}   - {expense.date}
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
        )}
      </header>
    </div>
  );
}

export default App;