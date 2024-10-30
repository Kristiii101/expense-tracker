import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CURRENCIES } from '../config/currencies.js';
import { useCurrency } from '../context/CurrencyContext';

const ExpenseForm = ({ formData, handleFormChange, handleAddExpense, CATEGORIES, resetForm }) => {
  const [exchangeRates, setExchangeRates] = useState({});
  const [originalAmount, setOriginalAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const { preferredCurrency } = useCurrency();

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
  
    fetchExchangeRates();
  }, [preferredCurrency]);

  const handleAmountChange = (value) => {
    setOriginalAmount(value);
    convertAmount(value, selectedCurrency);
  };

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    convertAmount(originalAmount, currency);
  };

  const convertAmount = (amount, currency) => {
    if (!amount || !exchangeRates[currency]) return;
    const convertedAmount = amount / exchangeRates[currency];
    handleFormChange('amount', Number(convertedAmount.toFixed(2)));
  };

  const submitExpense = async () => {
    if (!formData.amount || isNaN(formData.amount)) {
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
      ...formData,
      amount: parseFloat(originalAmount),
      originalCurrency: selectedCurrency,
      exchangeRate: exchangeRates[selectedCurrency],
      description: `${formData.description} (${originalAmount} ${selectedCurrency})`
    };

    await handleAddExpense(expenseData);
    resetForm();
    setOriginalAmount('');
  };

  return (
    <div className="expense-form">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto mb-8">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-2">
            <input
              type="number"
              value={originalAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Amount"
              className="border p-2 rounded flex-1"
              required
            />
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="border p-2 rounded"
            >
              {CURRENCIES.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          
          <div className="converted-amount text-gray-600">
            Converted: {typeof formData.amount === 'number' ? formData.amount.toFixed(2) : '0.00'} {preferredCurrency}
          </div>

          <input
            type="text"
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            className="border p-2 rounded"
            required
          />

          <select
            value={formData.category}
            onChange={(e) => handleFormChange('category', e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <DatePicker
            selected={formData.date}
            onChange={(date) => handleFormChange('date', date)}
            dateFormat="yyyy-MM-dd"
            className="border p-2 rounded w-full"
          />
          <button
            onClick={submitExpense}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
