import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [preferredCurrency, setPreferredCurrency] = useState(null);

    const updatePreferredCurrency = async (currency) => {
        await setDoc(doc(db, 'settings', 'currency'), { preferred: currency });
        setPreferredCurrency(currency);
    };

    useEffect(() => {
        loadPreferredCurrency();
    }, []);

    const loadPreferredCurrency = async () => {
        const currencyDoc = await getDoc(doc(db, 'settings', 'currency'));
        if (currencyDoc.exists()) {
        setPreferredCurrency(currencyDoc.data().preferred);
        } else {
        await setDoc(doc(db, 'settings', 'currency'), { preferred: 'USD' });
        setPreferredCurrency('USD');
        }
    };

    if (!preferredCurrency) return null;

    return (
        <CurrencyContext.Provider value={{ preferredCurrency, updatePreferredCurrency }}>
        {children}
        </CurrencyContext.Provider>
    );
};
  

export const useCurrency = () => useContext(CurrencyContext);
