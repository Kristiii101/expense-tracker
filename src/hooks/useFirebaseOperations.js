import { useState, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { formatDateForDB } from '../utils/dateUtils';

export const useFirebaseOperations = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchExpenses = useCallback(async (date = null, filters = {}) => {
    setIsLoading(true);
    try {
      let expensesData = [];
  
      if (date) {
        // Fetch expenses for a specific date
        const formattedDate = formatDateForDB(date);
        const dateDocRef = doc(db, 'expenses', formattedDate);
        const detailsCollectionRef = collection(dateDocRef, 'details');
        const querySnapshot = await getDocs(detailsCollectionRef);
        
        expensesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Fetch all expenses
        const expensesCollectionRef = collection(db, 'expenses');
        const datesSnapshot = await getDocs(expensesCollectionRef);
        
        for (const dateDoc of datesSnapshot.docs) {
          const detailsCollectionRef = collection(dateDoc.ref, 'details');
          const detailsSnapshot = await getDocs(detailsCollectionRef);
          
          const expensesForDate = detailsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          expensesData = [...expensesData, ...expensesForDate];
        }
      }
  
      // Apply filters if any
      return expensesData.filter(expense => {
        const matchesText = !filters.text || 
          expense.description.toLowerCase().includes(filters.text.toLowerCase());
        const matchesMinAmount = !filters.minAmount || 
          expense.amount >= parseFloat(filters.minAmount);
        const matchesMaxAmount = !filters.maxAmount || 
          expense.amount <= parseFloat(filters.maxAmount);
        
        return matchesText && matchesMinAmount && matchesMaxAmount;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  

  const addExpense = async (formData) => {
    setIsLoading(true);
    try {
      const dateString = formatDateForDB(formData.date);
      const now = new Date();
      
      // Create the expense object with all required fields
      const newExpense = {
        amount: parseFloat(formData.amount),
        originalAmount: parseFloat(formData.originalAmount),
        originalCurrency: formData.originalCurrency,
        category: formData.category,
        description: formData.description,
        date: dateString,
        created: {
          iso: now.toISOString(),
          timestamp: Timestamp.fromDate(now)
        }
      };
  
      // Reference to the date document
      const dateDocRef = doc(db, 'expenses', dateString);
      
      // Reference to the details collection inside the date document
      const detailsCollectionRef = collection(dateDocRef, 'details');
      
      // First ensure the date document exists
      await setDoc(dateDocRef, {
        created: {
          iso: now.toISOString(),
          timestamp: Timestamp.fromDate(now)
        }
      }, { merge: true });
  
      // Add the expense to the details subcollection
      const docRef = await addDoc(detailsCollectionRef, newExpense);
      
      return {
        id: docRef.id,
        ...newExpense
      };
    } finally {
      setIsLoading(false);
    }
  };
  

  const deleteExpense = async (expense) => {
    setIsLoading(true);
    try {
      const dateDocRef = doc(db, 'expenses', expense.date);
      const expenseDocRef = doc(collection(dateDocRef, 'details'), expense.id);
      await deleteDoc(expenseDocRef);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalBudget = async () => {
    try {
      const budgetDoc = doc(db, 'budgets', 'limits');
      const budgetSnapshot = await getDoc(budgetDoc);
      
      if (!budgetSnapshot.exists()) {
        return { totalBudget: 0, currency: 'EUR' };
      }
  
      const budgetData = budgetSnapshot.data();
      const totalBudget = Object.entries(budgetData)
        .filter(([key, value]) => key !== 'currency' && typeof value === 'number')
        .reduce((sum, [_, value]) => sum + value, 0);
  
      return { 
        totalBudget, 
        currency: budgetData.currency || 'EUR' 
      };
    } catch (error) {
      console.log('Budget fetch error:', error);
      return { totalBudget: 0, currency: 'EUR' };
    }
  };

  return {
    fetchExpenses,
    fetchTotalBudget,
    addExpense,
    deleteExpense,
    isLoading
  };
};