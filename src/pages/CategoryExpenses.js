import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebaseOperations } from '../hooks/useFirebaseOperations';
import '../styles/CategoryExpenses.css';

const CategoryExpenses = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const { fetchExpenses } = useFirebaseOperations();

  const calculateCategoryTotal = () => {
    return categoryExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  useEffect(() => {
    const loadCategoryExpenses = async () => {
      const allExpenses = await fetchExpenses(null, {
        date: null,
        text: '',
        minAmount: '',
        maxAmount: ''
      });
      const filtered = allExpenses.filter(expense => 
        expense.category === decodeURIComponent(category)
      );
      setCategoryExpenses(filtered);
    };
    
    loadCategoryExpenses();
  }, [category, fetchExpenses]);

  return (
    <div className="category-expenses">
      <button onClick={() => navigate('/')} className="back-button">
        Back to Main
      </button>
      <h2>Total Expenses for {decodeURIComponent(category)}: ${calculateCategoryTotal().toFixed(2)}</h2>
      <div className="expense-list">
        {categoryExpenses.length > 0 ? (
          categoryExpenses.map(expense => (
            <div key={expense.id} className="expense-item">
              <span>{expense.description}</span>
              <span>${expense.amount.toFixed(2)}</span>
              <span>{new Date(expense.date).toLocaleDateString()}</span>
            </div>
          ))
        ) : (
          <p>No expenses found for this category.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryExpenses;
