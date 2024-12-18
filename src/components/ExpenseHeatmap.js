import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-calendar-heatmap/dist/styles.css';
import ExpenseModal from './ExpenseModal';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConverter } from '../utils/CurrencyConvertor';
import { useFirebaseOperations } from '../hooks/useFirebaseOperations';
import '../styles/ExpenseHeatmap.css';

const BUDGET_PERCENTAGES = {
  LOW: 0.02,
  MEDIUM: 0.05,
  HIGH: 0.10,
  CRITICAL: 0.20,
  OVERTHETOP: 0.30
};

const ExpenseHeatmap = ({ expenses }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [rates, setRates] = useState({});
  const [totalBudget, setTotalBudget] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState('EUR');
  
  const { preferredCurrency } = useCurrency();
  const { fetchTotalBudget } = useFirebaseOperations();

  // Calculate daily budget threshold
  const getDailyBudgetThresholds = (budget) => ({
    LOW: (budget / 10) * BUDGET_PERCENTAGES.LOW,
    MEDIUM: (budget / 10) * BUDGET_PERCENTAGES.MEDIUM,
    HIGH: (budget / 10) * BUDGET_PERCENTAGES.HIGH,
    CRITICAL: (budget / 10) * BUDGET_PERCENTAGES.CRITICAL,
    OVERTHETOP: (budget / 10) * BUDGET_PERCENTAGES.OVERTHETOP
  });

  useEffect(() => {
    const loadRatesAndBudget = async () => {
      const data = await fetchTotalBudget();
      setTotalBudget(data.totalBudget);
      setBudgetCurrency(data.currency);
      
      const currentRates = await CurrencyConverter.getExchangeRates(preferredCurrency);
      setRates(currentRates);
    };
    
    loadRatesAndBudget();
  }, [fetchTotalBudget, preferredCurrency]);

  const displayAmount = (expense) => {
    if (!expense?.originalCurrency) return 0;
    if (expense.originalCurrency === preferredCurrency) return parseFloat(expense.originalAmount);
    
    return parseFloat(CurrencyConverter.convertCurrency(
      expense.originalAmount,
      expense.originalCurrency,
      preferredCurrency,
      rates
    )) || 0;
  };

  const heatmapData = expenses.reduce((acc, expense) => {
    const dateStr = expense.date?.seconds 
      ? new Date(expense.date.seconds * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const convertedAmount = displayAmount(expense);
    
    if (!acc[dateStr]) {
      acc[dateStr] = { amount: convertedAmount, expenses: [expense] };
    } else {
      acc[dateStr].amount += convertedAmount;
      acc[dateStr].expenses.push(expense);
    }
    return acc;
  }, {});

  const values = Object.entries(heatmapData).map(([date, data]) => ({
    date,
    count: data.amount,
    expenses: data.expenses
  }));

  const handleYearChange = (increment) => {
    setSelectedYear(prev => prev + increment);
  };

  const thresholds = getDailyBudgetThresholds(totalBudget);

  const getColorScale = (amount) => {
    if (!amount) return 'color-empty';
    
    const amountInBudgetCurrency = CurrencyConverter.convertCurrency(
      amount,
      preferredCurrency,
      budgetCurrency,
      rates
    );

    if (amountInBudgetCurrency >= thresholds.OVERTHETOP) return 'color-scale-4';
    if (amountInBudgetCurrency >= thresholds.CRITICAL) return 'color-scale-3';
    if (amountInBudgetCurrency >= thresholds.HIGH) return 'color-scale-2';
    if (amountInBudgetCurrency >= thresholds.MEDIUM) return 'color-scale-1';
    return 'color-scale-0';
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h3>Spending Patterns</h3>
        <div className="year-selector">
          <button onClick={() => handleYearChange(-1)}>←</button>
          <span>{selectedYear}</span>
          <button onClick={() => handleYearChange(1)}>→</button>
        </div>
      </div>
      
      <CalendarHeatmap
        startDate={new Date(selectedYear, 0, 1)}
        endDate={new Date(selectedYear, 11, 31)}
        values={values}
        classForValue={(value) => value ? getColorScale(value.count) : 'color-empty'}
        tooltipDataAttrs={value => ({
          'data-tip': value?.count 
            ? `${value.expenses.length} expenses totaling ${value.count.toFixed(2)} ${preferredCurrency}`
            : 'No expenses'
        })}
        onClick={value => value && setSelectedDay({ date: value.date, expenses: value.expenses })}
      />
      
      <ReactTooltip />
      
      {selectedDay && (
        <ExpenseModal
          date={selectedDay.date}
          expenses={selectedDay.expenses}
          onClose={() => setSelectedDay(null)}
        />
      )}
      
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} className={`legend-item color-scale-${level}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default ExpenseHeatmap;
