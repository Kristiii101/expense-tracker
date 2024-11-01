class CurrencyConverter {
  static async getExchangeRates(baseCurrency) {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return null;
    }
  }

  static convertCurrency(amount, fromCurrency, toCurrency, rates) {
    if (!amount || !rates || !fromCurrency || !toCurrency) {
      return 0;
    }

    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = rates[toCurrency] / rates[fromCurrency];
    return amount * rate;
  }

  static formatAmount(amount, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static async convertAndFormat(amount, fromCurrency, toCurrency) {
    const rates = await this.getExchangeRates(fromCurrency);
    if (!rates) return null;

    const convertedAmount = this.convertCurrency(amount, fromCurrency, toCurrency, rates);
    return this.formatAmount(convertedAmount, toCurrency);
  }
}

export { CurrencyConverter };
