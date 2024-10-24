import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FCSAPI_URL = 'https://fcsapi.com/api-v3/forex/latest';

export const getForexData = async (symbols: string[]) => {
  try {
    // Check if the API key is present
    const apiKey = process.env.FCSAPI_KEY;
    if (!apiKey) {
      throw new Error('FCSAPI_KEY is not defined in the environment variables.');
    }

    // Join the symbols array into a comma-separated string for the API call
    const symbolString = symbols.join(',');

    // Log the constructed URL and parameters for debugging
    console.log(`Making request to ${FCSAPI_URL} with symbols: ${symbolString} and API key: ${apiKey}`);

    // Make the API request
    const response = await axios.get(FCSAPI_URL, {
      params: {
        access_key: apiKey,
        symbol: symbolString
      }
    });

    // Check for response data
    if (!response.data || !response.data.response) {
      throw new Error('Invalid response from API');
    }

    // Extract and log the conversion data for each symbol
    const data = response.data.response;

    return data;
  } catch (error) {
    // Type guard or casting the error to 'Error'
    if (error instanceof Error) {
      console.error('Error fetching forex data:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
    throw error;
  }
};

