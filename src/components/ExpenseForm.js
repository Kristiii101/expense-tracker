// Create a new component for the expense form
import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ExpenseForm = ({ formData, handleFormChange, handleAddExpense, CATEGORIES }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto mb-8">
      <div className="grid grid-cols-1 gap-4">
        <input
          type="number"
          placeholder="Enter amount"
          value={formData.amount}
          onChange={(e) => handleFormChange('amount', e.target.value)}
          className="border p-2 rounded"
          required
        />
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
          className="react-datepicker-wrapper"
        />
        <button
          onClick={handleAddExpense}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ExpenseForm;
