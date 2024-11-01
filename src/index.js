import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './styles/App.css';
import './styles/BudgetLimits.css';
import './styles/CategoryExpenses.css';
import './styles/ChartsStyle.css';
import './styles/ExpenseForm.css';
import './styles/ExpenseHeatmap.css';
import './styles/ExpenseList.css';
import './styles/ExpenseModal.css';
import './styles/loading.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
