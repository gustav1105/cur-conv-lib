// List of supported currency pairs
const supportedCurrencies: string[] = [
  'GBP/USD',
  'EUR/GBP',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
  'EUR/USD',
  'NZD/USD',
  'ZAR/USD',
];

// Function to get supported currencies
export const getSupportedCurrencies = (): string[] => {
  return supportedCurrencies;
};

// Optionally, you can add a function to add new currencies dynamically
export const addCurrencyPair = (currencyPair: string): void => {
  if (!supportedCurrencies.includes(currencyPair)) {
    supportedCurrencies.push(currencyPair);
  }
};

// Function to remove a currency pair if needed
export const removeCurrencyPair = (currencyPair: string): void => {
  const index = supportedCurrencies.indexOf(currencyPair);
  if (index > -1) {
    supportedCurrencies.splice(index, 1);
  }
};
