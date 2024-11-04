import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CATEGORIES } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES } from '../config/currencies';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';

const BudgetLimits = () => {
  const [budgets, setBudgets] = useState({});
  const [tempBudgets, setTempBudgets] = useState({});
  const navigate = useNavigate();
  const { preferredCurrency, updatePreferredCurrency } = useCurrency();

  useEffect(() => {
    const fetchBudgets = async () => {
      const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
      if (budgetDoc.exists()) {
        const budgetData = budgetDoc.data();
        const rates = await CurrencyConverter.getExchangeRates(preferredCurrency);
        const convertedBudgets = {};
        
        Object.entries(budgetData).forEach(([category, amount]) => {
          if (category !== 'currency') {
            convertedBudgets[category] = CurrencyConverter.convertCurrency(
              amount,
              budgetData.currency || preferredCurrency,
              preferredCurrency,
              rates
            );
          }
        });
        
        setBudgets(convertedBudgets);
      }
    };

    fetchBudgets();
  }, [preferredCurrency]);

  const handleBudgetChange = (category, value) => {
    setTempBudgets(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const saveBudgets = async () => {
    // Get existing budgets from Firestore
    const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
    const existingBudgets = budgetDoc.exists() ? budgetDoc.data() : {};
  
    // Create an object with only the changed budgets
    const finalBudgets = {
      ...existingBudgets,
      ...Object.entries(tempBudgets).reduce((acc, [category, value]) => {
        if (value) {
          acc[category] = parseFloat(value);
        }
        return acc;
      }, {}),
      currency: preferredCurrency
    };
  
    // Save to Firestore
    await setDoc(doc(db, 'budgets', 'limits'), finalBudgets);
  
    // Update local state
    setBudgets(finalBudgets);
    setTempBudgets({});
  };
  

  return (
    <div className="budget-limits-container">
      <div className="currency-settings">
        <h3>Preferred Currency</h3>
        <select 
          value={preferredCurrency}
          onChange={(e) => updatePreferredCurrency(e.target.value)}
          className="currency-select"
        >
          {CURRENCIES.map(currency => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
      </div>

      <h2>Set Monthly Budget Limits ({preferredCurrency})</h2>

      <button onClick={() => navigate('/')} className="back-button">
        Back to Main
      </button>

      <div className="budget-inputs">
        {CATEGORIES.map(category => (
          <div key={category} className="budget-input-group">
            <label>{category}</label>
            <div className="input-with-currency">
              <input
                type="number"
                value={tempBudgets[category] || ''}
                onChange={(e) => handleBudgetChange(category, e.target.value)}
                placeholder={'New limit'}
                className="budget-input"
              />
              <span>{`Current: ${budgets[category]?.toFixed(2) || '0.00'}`}{preferredCurrency}</span>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={saveBudgets}
        className="save-button"
      >
        Save Budget Limits
      </button>
    </div>
  );
};

export default BudgetLimits;
