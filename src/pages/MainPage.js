import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseOperations } from '../hooks/useFirebaseOperations';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import LoadingSpinner from '../components/LoadingSpinner';
import { CATEGORIES, initialFormState } from '../config/constants';
import ExpenseHeatmap from '../components/ExpenseHeatmap';

function MainPage() {
  const navigate = useNavigate();
  const { fetchExpenses, addExpense, deleteExpense, isLoading } = useFirebaseOperations();
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showExpenses, setShowExpenses] = useState(true);
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

  // Delete expense
  const handleDeleteExpense = async (expense) => {
    try {
      const success = await deleteExpense(expense);
      if (success) {
        const updatedExpenses = await fetchExpenses(filters.date, filters);
        setExpenses(updatedExpenses);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const success = await addExpense(expenseData);
      if (success) {
        const updatedExpenses = await fetchExpenses(filters.date, filters);
        setExpenses(updatedExpenses);
        setShowForm(false);
        setShowExpenses(true);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  // Fetch current month's expenses
  const fetchCurrentMonthExpenses = async () => {
    try {
      const allExpenses = await fetchExpenses(null, {
        ...filters,
        date: null,
        text: '',
        minAmount: '',
        maxAmount: ''
      });
      
      setExpenses(allExpenses);
      setFilters(prev => ({
        ...prev,
        date: null,
        text: '',
        minAmount: '',
        maxAmount: ''
      }));
      
      setShowExpenses(true);
      setShowForm(false);
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      alert('Failed to fetch monthly expenses. Please try again.');
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setShowExpenses(false);
    resetForm();
  };

  const toggleViewExpenses = () => {
    setShowExpenses(!showExpenses);
    setShowForm(false);
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  useEffect(() => {
    if (showExpenses) {
      fetchExpenses(filters.date, filters).then(setExpenses);
    }
  }, [showExpenses, filters, fetchExpenses]);

  return (
    <div className="App">
      <header className="App-header">
        <p style={{ textAlign: 'center', color: '#ff5555', fontSize: 30 }}>
          Welcome to your expenses tracker.
        </p>

        <div className="button-group">
          <button className="add-expense-button" onClick={toggleForm}>
            Add a new expense
          </button>
          <button className="view-expense-button" onClick={toggleViewExpenses}>
            View all expenses
          </button>
          <button className="recurring-expense-button" onClick={() => navigate('/recurring')}>
            Recurring Expenses
          </button>
          <button className="budget-settings-button" onClick={() => navigate('/budgets')}>
            Budget Settings
          </button>
        </div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && (
          <>
            {showForm && (
              <ExpenseForm 
                formData={formData}
                handleFormChange={handleFormChange}
                handleAddExpense={handleAddExpense}
                CATEGORIES={CATEGORIES}
                resetForm={resetForm}
              />
            )}

            {showExpenses && (
              <>
                <ExpenseList 
                  expenses={expenses}
                  filters={filters}
                  setFilters={setFilters}
                  handleDeleteExpense={handleDeleteExpense}
                  fetchCurrentMonthExpenses={fetchCurrentMonthExpenses}
                  calculateTotalExpenses={calculateTotalExpenses}
                />
                <ExpenseHeatmap expenses={expenses} />    
              </>
            )}
          </>
        )}
      </header>
    </div>
  );
}

export default MainPage;
