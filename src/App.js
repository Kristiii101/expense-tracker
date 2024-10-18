import React, { useState } from 'react';
import './App.css';

function App() {
  // State to manage the list of expenses
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);

  // State to manage input for new expense
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // State for filtering expenses
  const [filterText, setFilterText] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  // Handle form submission for adding a new expense
  const handleAddExpense = () => {
    if (!newAmount || isNaN(newAmount)) {
      alert('Please enter a valid number for the amount.');
      return;
    }
    if (!newDescription) {
      alert('Please enter a description for the expense.');
      return;
    }

    const newExpense = {
      amount: parseFloat(newAmount),
      description: newDescription
    };
    setExpenses([...expenses, newExpense]);

    setNewAmount('');
    setNewDescription('');
    setShowForm(false); 
  };

  // Function to delete an expense by index
  const handleDeleteExpense = (index) => {
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(updatedExpenses);
  };

  // Function to toggle the form for adding a new expense
  const toggleForm = () => {
    setShowForm(!showForm);
    setShowExpenses(false);
  };

  // Function to toggle the view for all expenses
  const toggleViewExpenses = () => {
    setShowExpenses(!showExpenses);
    setShowForm(false);
  };

  // Calculate the total sum of all expenses
  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Filter expenses based on filterText, filterMinAmount, and filterMaxAmount
  const filteredExpenses = expenses.filter((expense) => {
    const matchesDescription = expense.description
      .toLowerCase()
      .includes(filterText.toLowerCase());

    const withinMinAmount =
      !filterMinAmount || expense.amount >= parseFloat(filterMinAmount);

    const withinMaxAmount =
      !filterMaxAmount || expense.amount <= parseFloat(filterMaxAmount);

    return matchesDescription && withinMinAmount && withinMaxAmount;
  });

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
            <button onClick={handleAddExpense} style={{ marginLeft: '10px' }}>
              Submit
            </button>
          </div>
        )}

        {showExpenses && (
          <div style={{ marginTop: '20px' }}>
            <h3>All Expenses:</h3>

            {/* Filter Inputs */}
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

            {/* Display the total amount */}
            <p style={{ fontWeight: 'bold' }}>
              Total Expenses: ${calculateTotalExpenses().toFixed(2)}
            </p>

            {/* Filtered list of expenses */}
            {filteredExpenses.length > 0 ? (
              <ul>
                {filteredExpenses.map((expense, index) => (
                  <li key={index}>
                    ${expense.amount} - {expense.description}
                    <button
                      style={{ marginLeft: '10px', color: 'red' }}
                      onClick={() => handleDeleteExpense(index)}
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
