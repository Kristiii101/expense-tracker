import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';
import ExpenseCharts from './ExpenseCharts';
import './index.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterDate, setFilterDate] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [category, setCategory] = useState('');

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Other'
  ];

  // Helper function to format date consistently
  const formatDate = (date) => {
    if (!date) return null;
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    return localDate.toISOString().split('T')[0];
  };

  const fetchExpenses = useCallback(async (date = null) => {
    let expensesData = [];

    if (date) {
      const formattedDate = formatDate(date);
      const dateDocRef = doc(db, 'expenses', formattedDate);
      const detailsCollectionRef = collection(dateDocRef, 'details');
      
      console.log("Fetching expenses for date:", formattedDate);
      const data = await getDocs(detailsCollectionRef);

      if (data.empty) {
        console.log("No expenses found for this date.");
      } else {
        expensesData = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          date: formattedDate // Add date to each expense
        }));
        console.log("Fetched expenses:", expensesData);
      }
    } else {
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));

      for (const dateDoc of expensesSnapshot.docs) {
        const detailsCollectionRef = collection(dateDoc.ref, 'details');
        const detailsSnapshot = await getDocs(detailsCollectionRef);
        const expensesForDate = detailsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          date: dateDoc.id // Add date from the parent document
        }));
        expensesData = expensesData.concat(expensesForDate);
      }
    }

    // Apply filters
    if (filterText) {
      expensesData = expensesData.filter((expense) =>
        expense.description.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (filterMinAmount) {
      expensesData = expensesData.filter(
        (expense) => expense.amount >= parseFloat(filterMinAmount)
      );
    }

    if (filterMaxAmount) {
      expensesData = expensesData.filter(
        (expense) => expense.amount <= parseFloat(filterMaxAmount)
      );
    }

    setExpenses(expensesData);
  }, [filterText, filterMinAmount, filterMaxAmount]);

  const handleAddExpense = async () => {
    if (!newAmount || isNaN(newAmount)) {
      alert('Please enter a valid number for the amount.');
      return;
    }
    if (!newDescription) {
      alert('Please enter a description for the expense.');
      return;
    }
    if (!category) {
      alert('Please select a category for the expense.');
      return;
    }
    // Format the date consistently
    const dateString = formatDate(selectedDate);

    const newExpense = {
      amount: parseFloat(newAmount),
      description: newDescription,
      category: category,
      created: new Date().toISOString()
    };

    const dateDocRef = doc(db, 'expenses', dateString);
    const dateDocSnapshot = await getDoc(dateDocRef);

    if (!dateDocSnapshot.exists()) {
      await setDoc(dateDocRef, {
        created: new Date().toISOString()
      });
    }

    const expensesCollectionRef = collection(dateDocRef, 'details');
    await addDoc(expensesCollectionRef, newExpense);

    setNewAmount('');
    setNewDescription('');
    setShowForm(false);
    fetchExpenses(selectedDate);
  };

  const handleDeleteExpense = async (id) => {
    // You'll need to modify this to handle the nested structure
    // First, get the expense to find its date
    const expenseToDelete = expenses.find(exp => exp.id === id);
    if (!expenseToDelete || !expenseToDelete.date) {
      console.error('Cannot find expense or date information');
      return;
    }

    const dateDocRef = doc(db, 'expenses', expenseToDelete.date);
    const expenseDocRef = doc(collection(dateDocRef, 'details'), id);
    await deleteDoc(expenseDocRef);
    fetchExpenses(filterDate);
  };

  // Rest of your component remains the same...
  const toggleForm = () => {
    setShowForm(!showForm);
    setShowExpenses(false);
  };

  const toggleViewExpenses = () => {
    setShowExpenses(!showExpenses);
    setShowForm(false);
    if (!showExpenses) fetchExpenses(filterDate);
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  useEffect(() => {
    if (showExpenses) {
      fetchExpenses(filterDate);
    }
  }, [showExpenses, filterDate, fetchExpenses]);

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
          <div style={{ marginTop: '20px' }}>
            <input
              type="number"
              placeholder="Enter amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Enter description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              required
              style={{ marginLeft: '10px' }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{ marginLeft: '10px' }}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                fetchExpenses(date);
              }}
              dateFormat="yyyy-MM-dd"
              style={{ marginLeft: '10px' }}
            />
            <button onClick={handleAddExpense} style={{ marginLeft: '10px' }}>
              Submit
            </button>
          </div>
        )}

        {showExpenses && (
          <div style={{ marginTop: '20px' }}>
            <h3>Expense Analysis:</h3>
            <ExpenseCharts expenses={expenses} />

            <DatePicker
              selected={filterDate}
              onChange={(date) => setFilterDate(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Filter by date"
              style={{ marginBottom: '10px' }}
            />

            <input
              type="text"
              placeholder="Search by description"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ marginBottom: '10px' }}
            />
            <input
              type="number"
              placeholder="Min Amount"
              value={filterMinAmount}
              onChange={(e) => setFilterMinAmount(e.target.value)}
              style={{ marginBottom: '10px', marginLeft: '10px' }}
            />
            <input
              type="number"
              placeholder="Max Amount"
              value={filterMaxAmount}
              onChange={(e) => setFilterMaxAmount(e.target.value)}
              style={{ marginBottom: '10px', marginLeft: '10px' }}
            />

            <p style={{ fontWeight: 'bold' }}>
              Total Expenses: ${calculateTotalExpenses().toFixed(2)}
            </p>

            {expenses.length > 0 ? (
              <ul>
                {expenses.map((expense) => (
                  <li key={expense.id}>
                    {expense.date} - ${expense.amount} - {expense.description}
                    <button
                      style={{ marginLeft: '10px', color: 'red' }}
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No expenses found.</p>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;