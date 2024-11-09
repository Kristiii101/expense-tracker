import React from 'react';
import { Pie } from 'react-chartjs-2';
import { getCategoryColor } from '../utils/CategoryColors';
import { useCurrency } from '../context/CurrencyContext';

const RecurringCharts = ({ expenses }) => {
  const { preferredCurrency } = useCurrency();

  const expensesByDescription = expenses.reduce((acc, expense) => {
    acc[expense.description] = (acc[expense.description] || 0) + expense.amount;
    return acc;
  }, {});

  const sortedDescriptions = Object.entries(expensesByDescription)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [desc, amount]) => {
      acc[desc] = amount;
      return acc;
    }, {});

  const labels = Object.keys(sortedDescriptions);
  const amounts = Object.values(sortedDescriptions);
  const colors = labels.map(desc => getCategoryColor(desc));

  const pieChartData = {
    labels: labels,
    datasets: [{
      data: amounts,
      backgroundColor: colors.map(color => color + '90'),
      borderColor: colors,
      borderWidth: 1,
    }],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: `Recurring Expenses Distribution (${preferredCurrency})`
      }
    }
  };

  return (
    <div className="charts-container">
      <div className="chart-wrapper pie-chart">
        <h3>Recurring Expenses Distribution</h3>
        <Pie data={pieChartData} options={pieOptions} />
      </div>
    </div>
  );
};

export default RecurringCharts;
