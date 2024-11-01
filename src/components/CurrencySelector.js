import React from 'react';
import { CURRENCIES } from '../config/currencies';
import { useCurrency } from '../context/CurrencyContext';

const CurrencySelector = () => {
  const { updatePreferredCurrency } = useCurrency();

  return (
    <div className="currency-selector">
      <h2>Welcome to Expense Tracker</h2>
      <p>Please select your preferred currency to get started:</p>
      <select 
        onChange={(e) => updatePreferredCurrency(e.target.value)}
        defaultValue=""
        className="currency-select"
      >
        <option value="" disabled>Select a currency</option>
        {CURRENCIES.map(currency => (
          <option key={currency} value={currency}>{currency}</option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;