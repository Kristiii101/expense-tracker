import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import { useNavigate } from 'react-router-dom';
import RecurringCharts from '../components/RecurringCharts';
import '../styles/RecurringExpenses.css';

const RecurringExpenses = () => {
  const navigate = useNavigate();
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    frequency: 'Monthly',
    startDate: new Date(),
    endDate: null,
    paymentMethod: '',
    status: 'Completed',
    notifications: {
      enabled: false,
      reminderDays: 3
    }
  });

  const frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  const statuses = ['Completed', 'Active', 'Paused'];
  const paymentMethods = ['Credit Card', 'Bank Transfer', 'Cash', 'Other'];

  const changeMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  // Fetch expenses
  const fetchRecurringExpenses = useCallback(async () => {
    const startOfMonth = new Date(selectedDate);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
  
    const endOfMonth = new Date(selectedDate);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
  
    const snapshot = await getDocs(collection(db, 'recurringExpenses'));
    const expenses = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(expense => {
        const expenseDate = new Date(expense.created.seconds * 1000);
        return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
      });
  
    setRecurringExpenses(expenses);
  }, [selectedDate]);
  
  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add or Update expense
  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) {
      alert('Please enter both amount and description');
      return;
    }

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        created: Timestamp.fromDate(new Date()),
        startDate: Timestamp.fromDate(formData.startDate),
        endDate: formData.endDate ? Timestamp.fromDate(formData.endDate) : null
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'recurringExpenses', formData.id), expenseData);
      } else {
        await addDoc(collection(db, 'recurringExpenses'), expenseData);
      }

      resetForm();
      fetchRecurringExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  // Edit expense
  const handleEdit = (expense) => {
    setFormData({
      ...expense,
      startDate: expense.startDate ? new Date(expense.startDate.seconds * 1000) : new Date(),
      endDate: expense.endDate ? new Date(expense.endDate.seconds * 1000) : null,
      created: Timestamp.fromDate(new Date())
    });
    setIsEditMode(true);
  };

  // Delete expense(s)
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'recurringExpenses', id));
    fetchRecurringExpenses();
  };

  const handleBulkDelete = async () => {
    for (const id of selectedExpenses) {
      await handleDelete(id);
    }
    setSelectedExpenses([]);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: '',
      frequency: 'Monthly',
      startDate: new Date(),
      endDate: null,
      paymentMethod: '',
      status: 'Completed',
      notifications: {
        enabled: false,
        reminderDays: 3
      }
    });
    setIsEditMode(false);
  };

  // Sort and filter expenses
  const getSortedAndFilteredExpenses = () => {
    let filtered = [...recurringExpenses];
    
    if (filterBy !== 'all') {
      filtered = filtered.filter(expense => expense.status === filterBy);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'date') return b.created - a.created;
      return 0;
    });
  };

  return (
    <div className="recurring-expenses-container">
      <button onClick={() => navigate('/')} className="back-button">
        Back to Dashboard
      </button>
      
      <div className="recurring-expenses-navigation">
        <button onClick={() => changeMonth(-1)}>Previous Month</button>
        <span>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => changeMonth(1)}>Next Month</button>
      </div>
  
      <div className="recurring-expenses-form">
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => handleFormChange('amount', e.target.value)}
          placeholder="Amount *"
          required
        />
        <input
          type="text"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Enter description *"
          required
        />
        <DatePicker
          selected={formData.startDate}
          onChange={(date) => handleFormChange('startDate', date)}
          placeholderText="Start Date"
        />
        <select
          value={formData.frequency}
          onChange={(e) => handleFormChange('frequency', e.target.value)}
        >
          {frequencies.map(freq => (
            <option key={freq} value={freq}>{freq}</option>
          ))}
        </select>
        <select
          value={formData.paymentMethod}
          onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
        >
          {paymentMethods.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
        <select
          value={formData.status}
          onChange={(e) => handleFormChange('status', e.target.value)}
        >
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        
        <div className="recurring-expenses-buttons">
          <button 
            className="recurring-expenses-submit"
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update Expense' : 'Add Expense'}
          </button>
          {isEditMode && (
            <button 
              className="recurring-expenses-cancel"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
  
      <div className="recurring-expense-controls">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
          <option value="all">All Status</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        {selectedExpenses.length > 0 && (
          <button onClick={handleBulkDelete}>Delete Selected</button>
        )}
      </div>
  
      <div className="recurring-expenses-list">
        {getSortedAndFilteredExpenses().map(expense => (
          <div key={expense.id} className="recurring-expense-item">
            <input
              type="checkbox"
              checked={selectedExpenses.includes(expense.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedExpenses([...selectedExpenses, expense.id]);
                } else {
                  setSelectedExpenses(selectedExpenses.filter(id => id !== expense.id));
                }
              }}
            />
            <div className="recurring-expense-details">
              <span>{expense.description}</span>
              <span>{expense.amount}</span>
              <span>{expense.status}</span>
            </div>
            <div className="recurring-expense-actions">
              <button onClick={() => handleEdit(expense)}>Edit</button>
              <button onClick={() => handleDelete(expense.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
  
      {recurringExpenses.length > 0 && (
        <RecurringCharts expenses={recurringExpenses} />
      )}
    </div>
  );
  
};

export default RecurringExpenses;
