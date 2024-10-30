import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CATEGORIES } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES } from '../config/currencies.js';
import { useCurrency } from '../context/CurrencyContext';
import '../styles/BudgetLimits.css';

const BudgetLimits = () => {
  const [budgets, setBudgets] = useState({});
  const [tempBudgets, setTempBudgets] = useState({});
  const [exchangeRates, setExchangeRates] = useState({});
  const navigate = useNavigate();
  const { preferredCurrency, updatePreferredCurrency } = useCurrency();

  const convertAmount = useCallback((amount, fromCurrency, toCurrency = preferredCurrency) => {
    if (!exchangeRates[fromCurrency] || fromCurrency === toCurrency) return amount;
    
    // Direct conversion using exchange rates
    const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    return (amount * rate).toFixed(2);
  }, [exchangeRates, preferredCurrency]);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${preferredCurrency}`);
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };
  
    const fetchBudgets = async () => {
      const budgetDoc = await getDoc(doc(db, 'budgets', 'limits'));
      if (budgetDoc.exists()) {
        const budgetData = budgetDoc.data();
        const storedCurrency = budgetData.currency || preferredCurrency;
        
        if (storedCurrency !== preferredCurrency) {
          const convertedBudgets = {};
          Object.keys(budgetData)
            .filter(key => key !== 'currency')
            .forEach(category => {
              convertedBudgets[category] = convertAmount(budgetData[category], storedCurrency);
            });
          setBudgets(convertedBudgets);
        } else {
          const { currency, ...budgetValues } = budgetData;
          setBudgets(budgetValues);
        }
      }
    };
  
    fetchBudgets();
    fetchExchangeRates();
  }, [preferredCurrency, convertAmount]);

  const handleBudgetChange = (category, value) => {
    setTempBudgets(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const saveBudgets = async () => {
    const finalBudgets = {};
    Object.keys(tempBudgets).forEach(category => {
      finalBudgets[category] = parseFloat(tempBudgets[category]) || 0;
    });
    await setDoc(doc(db, 'budgets', 'limits'), {
      ...finalBudgets,
      currency: preferredCurrency
    });
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

      {CATEGORIES.map(category => (
        <div key={category} className="budget-input-group">
          <label>{category}</label>
          <div className="input-with-currency">
            <input
              type="number"
              value={tempBudgets[category] || ''}
              onChange={(e) => handleBudgetChange(category, e.target.value)}
              placeholder="Set monthly limit"
            />
            <span>{preferredCurrency}</span>
          </div>
          <div className="current-budget">
            Current limit: {budgets[category] || 0} {preferredCurrency}
          </div>
        </div>
      ))}

      <button 
        onClick={saveBudgets}
        className="save-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Save Budget Limits
      </button>
    </div>
  );
};

export default BudgetLimits;
