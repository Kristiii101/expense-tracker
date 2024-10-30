import { useState, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { formatDateForDB } from '../utils/dateUtils';

export const useFirebaseOperations = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchExpenses = useCallback(async (date = null, filters) => {
    setIsLoading(true);
    try {
      let expensesData = [];

      if (date) {
        const formattedDate = formatDateForDB(date);
        const dateDocRef = doc(db, 'expenses', formattedDate);
        const detailsCollectionRef = collection(dateDocRef, 'details');
        
        const data = await getDocs(detailsCollectionRef);
        expensesData = data.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: formattedDate
        }));
      } else {
        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
        for (const dateDoc of expensesSnapshot.docs) {
          const detailsCollectionRef = collection(dateDoc.ref, 'details');
          const detailsSnapshot = await getDocs(detailsCollectionRef);
          const expensesForDate = detailsSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            date: dateDoc.id
          }));
          expensesData = expensesData.concat(expensesForDate);
        }
      }

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
      
      const newExpense = {
        amount: parseFloat(formData.amount),
        originalCurrency: formData.currency || 'USD',
        convertedAmount: formData.convertedAmount || parseFloat(formData.amount),
        exchangeRate: formData.exchangeRate || 1,
        description: formData.description,
        category: formData.category,
        created: {
          iso: now.toISOString(),
          timestamp: Timestamp.fromDate(now)
        },
        date: dateString
      };
  
      const dateDocRef = doc(db, 'expenses', dateString);
      const dateDocSnapshot = await getDoc(dateDocRef);
  
      if (!dateDocSnapshot.exists()) {
        await setDoc(dateDocRef, {
          created: {
            iso: now.toISOString(),
            timestamp: Timestamp.fromDate(now)
          }
        });
      }
  
      const expensesCollectionRef = collection(dateDocRef, 'details');
      await addDoc(expensesCollectionRef, newExpense);
      return true;
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

  return {
    fetchExpenses,
    addExpense,
    deleteExpense,
    isLoading
  };
};
