import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CURRENCIES } from '../config/currencies';

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
        }
    };

    // Show a currency selection screen if no currency is set
    if (!preferredCurrency) {
        return (
            <div className="currency-selection-screen">
                <h2>Select Your Preferred Currency</h2>
                <select 
                    onChange={(e) => updatePreferredCurrency(e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>Select a currency</option>
                    {CURRENCIES.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <CurrencyContext.Provider value={{ preferredCurrency, updatePreferredCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

  

export const useCurrency = () => useContext(CurrencyContext);