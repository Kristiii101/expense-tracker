export const CATEGORIES = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Other'
  ];

export const CATEGORY_COLORS = {
  'Food & Dining': '#FF6384',
  'Transportation': '#36A2EB',
  'Shopping': '#FFCE56',
  'Bills & Utilities': '#4BC0C0',
  'Entertainment': '#9966FF',
  'Healthcare': '#FF9F40',
  'Other': '#C9CBCF'
};
  
export const initialFormState = {
  amount: '',
  description: '',
  category: '',
  date: new Date()
};

export const INITIAL_BUDGET_LIMITS = {
  'Food & Dining': 500,
  'Transportation': 300,
  'Shopping': 400,
  'Bills & Utilities': 1000,
  'Entertainment': 200,
  'Healthcare': 300,
  'Other': 200
};

