import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';
import '../styles/ExpenseModal.css';

const ExpenseModal = ({ date, expenses, onClose }) => {
  const [rates, setRates] = useState({});
  const { preferredCurrency } = useCurrency();

  useEffect(() => {
    const loadRates = async () => {
      if (!expenses || expenses.length === 0) return;
      
      const uniqueCurrencies = [...new Set(expenses
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
    loadRates();
  }, [expenses]);

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

  const totalAmount = expenses.reduce((sum, expense) => {
    return sum + parseFloat(displayAmount(expense));
  }, 0);

  const formatDate = (dateString) => {
    let date;
    
    if (dateString?.seconds) {
      date = new Date(dateString.seconds * 1000);
    } else if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else {
      date = new Date();
    }
  
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}/${month}/${year}`;
  };
  

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Expenses for {formatDate(date)}</h3>
          <h4>Total: {totalAmount.toFixed(2)} {preferredCurrency}</h4>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {expenses.map(expense => (
            <div key={expense.id} className="expense-detail">
              <span className="expense-description">{expense.description}</span>
              <span className="expense-category">{expense.category}</span>
              <span className="expense-amount">
                {displayAmount(expense)} {preferredCurrency}
                {expense.originalCurrency !== preferredCurrency && 
                  ` (${expense.originalAmount} ${expense.originalCurrency})`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
