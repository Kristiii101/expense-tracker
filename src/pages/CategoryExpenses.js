import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import CategorySidebar from '../components/CategorySidebar';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';
import '../styles/CategoryManager.css';


const CategoryExpenses = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [rates, setRates] = useState({});
  const { preferredCurrency } = useCurrency();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadCategoryExpenses = async () => {
      const startOfMonth = new Date(selectedDate);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
    
      const endOfMonth = new Date(selectedDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);
    
      const q = query(collection(db, 'expenses'));
      const querySnapshot = await getDocs(q);
      
      const allExpenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const filtered = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date.seconds * 1000);
        return expense.category === decodeURIComponent(category) &&
               expenseDate >= startOfMonth &&
               expenseDate <= endOfMonth;
      });
      
      setCategoryExpenses(filtered);
    
      const uniqueCurrencies = [...new Set(filtered
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
    
    
    loadCategoryExpenses();
  }, [category, selectedDate]);
  

  const changeMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };
  

  const displayAmount = (expense) => {
    if (!expense || !expense.originalCurrency) {
      return '0.00';
    }

    if (expense.originalCurrency === preferredCurrency) {
      return parseFloat(expense.originalAmount).toFixed(2);
    }

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
  };

  const calculateCategoryTotal = () => {
    if (!rates || categoryExpenses.length === 0) return '0.00';
    
    return categoryExpenses.reduce((total, expense) => {
      const amount = displayAmount(expense);
      return total + parseFloat(amount);
    }, 0).toFixed(2);
  };
  

  const formatDate = (expenseDate) => {
    let date;
    
    if (expenseDate instanceof Date) {
      date = expenseDate;
    } else if (expenseDate?.seconds) {
      date = new Date(expenseDate.seconds * 1000);
    } else {
      date = new Date();
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="category-page">
      <CategorySidebar currentCategory={decodeURIComponent(category)} />
      <div className="category-content">
        <div className="category-expenses">
          <button onClick={() => navigate('/')} className="back-button">
            Back to Main
          </button>
          <div className="month-navigation">
          <button 
            onClick={() => changeMonth(-1)} 
            className="month-nav-button"
          >
            Previous Month
          </button>
          <span className="current-month">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => changeMonth(1)} 
            className="month-nav-button"
          >
            Next Month
          </button>
        </div>
          <h2>Total Expenses for {decodeURIComponent(category)}: {calculateCategoryTotal()} {preferredCurrency}</h2>
          <div className="expense-list">
            {categoryExpenses.length > 0 ? (
              categoryExpenses.map(expense => (
                <div key={expense.id} className="expense-item">
                  <span>{expense.description}</span>
                  <span>
                    {displayAmount(expense)} {preferredCurrency}
                    {expense.originalCurrency !== preferredCurrency && 
                      ` (${expense.originalAmount} ${expense.originalCurrency})`}
                  </span>
                  <span>{formatDate(expense.date)}</span>
                </div>
              ))
            ) : (
              <p>No expenses found for this category.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryExpenses;
