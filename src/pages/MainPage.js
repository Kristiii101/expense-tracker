import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import ExpenseHeatmap from '../components/ExpenseHeatmap';
import { CATEGORIES } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import '../styles/App.css';

function MainPage() {
  const [showForm, setShowForm] = useState(false);
  const [showExpenses, setShowExpenses] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState({
    date: null,
    text: '',
    minAmount: '',
    maxAmount: ''
  });
  const navigate = useNavigate();
  const { preferredCurrency } = useCurrency();

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date(),
    description: '',
    category: '',
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      date: new Date(),
      description: '',
      category: '',
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        timestamp: new Date().getTime()
      });
      
      const newExpense = {
        id: docRef.id,
        ...expenseData
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleDeleteExpense = async (expense) => {
    try {
      await deleteDoc(doc(db, 'expenses', expense.id));
      setExpenses(prev => prev.filter(e => e.id !== expense.id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const fetchCurrentMonthExpenses = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'expenses'),
      where('timestamp', '>=', startOfMonth.getTime()),
      where('timestamp', '<=', endOfMonth.getTime())
    );

    const querySnapshot = await getDocs(q);
    const expensesList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setExpenses(expensesList);
    setFilters({
      date: null,
      text: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  useEffect(() => {
    fetchCurrentMonthExpenses();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="currency-info">
          <p>Current Currency: {preferredCurrency}</p>
          <button 
            className="change-currency-button"
            onClick={() => navigate('/budgets')}
          >
            Change Currency and Budget Limits
          </button>
        </div>

        <div className="button-group">
          <button className='add-view-expense-button' onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Hide Form' : 'Add New Expense'}
          </button>
          <button className='add-view-expense-button' onClick={() => setShowExpenses(!showExpenses)}>
            {showExpenses ? 'Hide Expenses' : 'Show Expenses'}
          </button>
          <button className='add-recurring-expense-button' onClick={() => navigate('/recurring')}>
            Manage Recurring Expenses
          </button>
        </div>

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
            />
            <ExpenseHeatmap expenses={expenses} />
          </>
        )}
      </header>
    </div>
  );
}

export default MainPage;
