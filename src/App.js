import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import CategoryExpenses from './pages/CategoryExpenses';
import RecurringExpenses from './pages/RecurringExpenses';
import BudgetLimits from './pages/BudgetLimits';
import { CurrencyProvider } from './context/CurrencyContext';

function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/category/:category" element={<CategoryExpenses />} />
          <Route path="/recurring" element={<RecurringExpenses />} />
          <Route path="/budgets" element={<BudgetLimits />} />
        </Routes>
      </BrowserRouter>
    </CurrencyProvider>
  );
}

export default App;
