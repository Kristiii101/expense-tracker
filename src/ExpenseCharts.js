import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ExpenseCharts = ({ expenses = [] }) => {
  // Ensure expenses is an array and has items
  const validExpenses = Array.isArray(expenses) ? expenses : [];

  // Process data for category-based charts
  const categoryData = useMemo(() => {
    if (validExpenses.length === 0) return [];

    const categoryMap = validExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {});

    return Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2))
    }));
  }, [validExpenses]);

  // Process data for time-based charts
  const timeData = useMemo(() => {
    if (validExpenses.length === 0) return [];

    const timeMap = validExpenses.reduce((acc, expense) => {
      const date = expense.date?.slice(0, 7) || 'Unknown'; // Get YYYY-MM
      acc[date] = (acc[date] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {});

    return Object.entries(timeMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2))
      }));
  }, [validExpenses]);

  // If no data, show a message
  if (validExpenses.length === 0) {
    return (
      <div className="w-full text-center p-4">
        <p className="text-gray-500">No expense data available to display charts.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Distribution (Pie Chart) */}
        {categoryData.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({category, percent}) => 
                      `${category} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Monthly Trends (Bar Chart) */}
        {timeData.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Monthly Spending Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => {
                      if (!date || date === 'Unknown') return 'Unknown';
                      const [year, month] = date.split('-');
                      return `${month}/${year.slice(2)}`;
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => `$${value.toFixed(2)}`}
                    labelFormatter={(label) => {
                      if (!label || label === 'Unknown') return 'Unknown';
                      const [year, month] = label.split('-');
                      return `${month}/${year}`;
                    }}
                  />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCharts;