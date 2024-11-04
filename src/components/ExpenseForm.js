import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CURRENCIES } from '../config/currencies';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';

const ExpenseForm = ({ formData, handleFormChange, handleAddExpense, CATEGORIES, resetForm }) => {
  const [rates, setRates] = useState(null);
  const [originalAmount, setOriginalAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const { preferredCurrency } = useCurrency();

  useEffect(() => {
    const loadRates = async () => {
      const newRates = await CurrencyConverter.getExchangeRates(selectedCurrency);
      setRates(newRates);
    }
    loadRates();
  }, [preferredCurrency, selectedCurrency]);

  const handleAmountChange = (value) => {
    setOriginalAmount(value);
    if (rates && value) {
      const convertedAmount = CurrencyConverter.convertCurrency(
        parseFloat(value),
        selectedCurrency,
        preferredCurrency,
        rates
      );
      handleFormChange('amount', parseFloat(convertedAmount));
    }
  };

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    if (rates && originalAmount) {
      const convertedAmount = CurrencyConverter.convertCurrency(
        parseFloat(originalAmount),
        currency,
        preferredCurrency,
        rates
      );
      handleFormChange('amount', parseFloat(convertedAmount));
    }
  };

  const displayConvertedAmount = () => {
    if (!rates || !originalAmount) return '0.00';
    
    const convertedAmount = CurrencyConverter.convertCurrency(
      parseFloat(originalAmount),
      selectedCurrency,
      preferredCurrency,
      rates
    );
    return convertedAmount.toFixed(2);
  };

  const submitExpense = async () => {
    if (!originalAmount || isNaN(originalAmount)) {
      alert('Please enter a valid number for the amount.');
      return;
    }
    if (!formData.description) {
      alert('Please enter a description for the expense.');
      return;
    }
    if (!formData.category) {
      alert('Please select a category for the expense.');
      return;
    }

    const expenseData = {
      amount: parseFloat(displayConvertedAmount()),
      originalAmount: parseFloat(originalAmount),
      originalCurrency: selectedCurrency,
      description: formData.description,
      category: formData.category,
      date: formData.date,
      timestamp: new Date().getTime()
    };

    await handleAddExpense(expenseData);
    resetForm();
    setOriginalAmount('');
    setSelectedCurrency(CURRENCIES[0]);
  };

  return (
    <div className="expense-form">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="number"
            placeholder="Amount"
            value={originalAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <select 
            value={selectedCurrency} 
            onChange={(e) => handleCurrencyChange(e.target.value)} 
            className="border p-2 rounded w-full"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>

          <DatePicker
            selected={formData.date}
            onChange={(date) => handleFormChange('date', date)}
            dateFormat="dd-MM-yyyy"
            className="border p-2 rounded w-full"
          />

          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            className="border p-2 rounded w-full"
          />

          <select 
            value={formData.category} 
            onChange={(e) => handleFormChange('category', e.target.value)} 
            className="border p-2 rounded w-full"
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <p className="text-lg font-bold mb-4">
          Converted Amount: {rates ? `${displayConvertedAmount()} ${preferredCurrency}` : 'Loading...'}
        </p>

        <button onClick={submitExpense} className="add-view-expense-button">
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default ExpenseForm;
