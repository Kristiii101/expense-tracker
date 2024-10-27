import React from 'react';
import '../styles/ExpenseModal.css';

const ExpenseModal = ({ date, expenses, onClose }) => {
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Expenses for {new Date(date).toLocaleDateString()}</h3>
          <h4>Total: ${totalAmount.toFixed(2)}</h4>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {expenses.map(expense => (
            <div key={expense.id} className="expense-detail">
              <span className="expense-description">{expense.description}</span>
              <span className="expense-category">{expense.category}</span>
              <span className="expense-amount">${expense.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;