import React, { useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-calendar-heatmap/dist/styles.css';
import ExpenseModal from './ExpenseModal';
import '../styles/ExpenseHeatmap.css';


const ExpenseHeatmap = ({ expenses, onDayClick }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  const heatmapData = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        amount: expense.amount,
        expenses: [expense]
      };
    } else {
      acc[date].amount += expense.amount;
      acc[date].expenses.push(expense);
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
        classForValue={(value) => {
          if (!value) return 'color-empty';
          const intensity = Math.min(Math.floor(value.count / 100), 4);
          return `color-scale-${intensity}`;
        }}
        tooltipDataAttrs={value => ({
          'data-tip': value?.count 
            ? `${value.expenses.length} expenses totaling $${value.count.toFixed(2)}`
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