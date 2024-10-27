import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CATEGORIES } from '../config/constants';
import { useNavigate } from 'react-router-dom';

const BudgetLimits = () => {
  const [budgets, setBudgets] = useState({});
  const navigate = useNavigate();
  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
    if (budgetDoc.exists()) {
      setBudgets(budgetDoc.data());
    }
  };

  const handleBudgetChange = async (category, value) => {
    const newBudgets = { ...budgets, [category]: parseFloat(value) || 0 };
    setBudgets(newBudgets);
    await setDoc(doc(db, 'budgets', 'limits'), newBudgets);
  };

  return (
    <div className="budget-limits-container">
      <h2>Set Monthly Budget Limits</h2>
      <button onClick={() => navigate('/')} className="back-button">
        Back to Main
      </button>
      {CATEGORIES.map(category => (
        <div key={category} className="budget-input-group">
          <label>{category}</label>
          <input
            type="number"
            value={budgets[category] || ''}
            onChange={(e) => handleBudgetChange(category, e.target.value)}
            placeholder="Set monthly limit"
          />
        </div>
      ))}
    </div>
  );
};

export default BudgetLimits;
