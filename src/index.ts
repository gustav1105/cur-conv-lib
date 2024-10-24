import { initDB, query } from './db';
import { getSupportedCurrencies } from './supportedCurrencies';
import { getForexData } from './fcsapi';

// Task to be run
const runTask = async () => {
  console.log('Running scheduled task...');
  
  try {
    const result = await query('SELECT NOW()');
    console.log('Task ran at:', result.rows[0].now);
    
    const currencies = getSupportedCurrencies();
    const forexData = await getForexData(currencies);
    const tableName = getTableNameForToday();

    await createTableForTodayIfNotExists(tableName);
    
    // Iterate over supported currencies and their corresponding data
    for (let i = 0; i < currencies.length; i++) {
      const symbol = currencies[i];
      const fD = forexData[i];  // Assuming forexData matches currencies array in length

      // Log the forex data
      console.log(fD);

      // Insert the data into the table
      await insertDataIntoTable(tableName, symbol, fD);
    }
    
  } catch (error) {
    console.error('Error running task:', error);
  }
};

// Function to calculate milliseconds until midnight
const calculateTimeUntilMidnight = (currentTime: Date): number => {
  const midnight = new Date(currentTime);
  midnight.setHours(24, 0, 0, 0); // Midnight of the next day
  return midnight.getTime() - currentTime.getTime();
};

// Function to start the scheduler
const startScheduler = async () => {
  try {
    const result = await query('SELECT NOW()');
    const currentTime = new Date(result.rows[0].now);
    console.log('Current time from DB:', currentTime);

    const timeUntilMidnight = calculateTimeUntilMidnight(currentTime);
    console.log(`Time until midnight: ${timeUntilMidnight / 1000} seconds`);

    // Schedule the task to run at midnight
    setTimeout(() => {
      runTask(); // First run at midnight
      setInterval(runTask, 24 * 60 * 60 * 1000); // Run every 24 hours after that
    }, timeUntilMidnight);

  } catch (error) {
    console.error('Error setting up scheduler:', error);
  }
};

// Handle graceful shutdown
const handleShutdown = () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
};

// Listen for termination signals (graceful shutdown)
process.on('SIGINT', handleShutdown);  // Handle Ctrl+C
process.on('SIGTERM', handleShutdown); // Handle Docker stop

// Initialize DB connection and run task immediately
const initialize = async () => {
  try {
    console.log('Initializing database connection...');
    await initDB();
    console.log('Database connection initialized.');

    // Run the task immediately after initialization
    await runTask(); 

    // Start the scheduler for midnight and beyond
    await startScheduler();
    await fetchTodayData();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};

// Function to generate table name based on today's date
const getTableNameForToday = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(today.getDate()).padStart(2, '0');
  return `exchange_${year}_${month}_${day}`;
};

// Function to create the table for today if it doesn't exist
const createTableForTodayIfNotExists = async (tableName: string) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(10) NOT NULL,
      open DECIMAL(10, 6),
      high DECIMAL(10, 6),
      low DECIMAL(10, 6),
      close DECIMAL(10, 6),
      change DECIMAL(10, 6),
      change_percent DECIMAL(5, 2),
      timestamp BIGINT,  -- epoch timestamp
      last_update TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await query(createTableQuery);
  console.log(`Table ${tableName} created or already exists`);
};

// Function to insert forex data into the table
const insertDataIntoTable = async (tableName: string, symbol: string, data: any) => {
  const changePercent = parseFloat(data.cp.replace('%', ''));
  const timestamp = parseInt(data.t);  // Assuming 't' is in seconds or milliseconds

  // Log before inserting
  console.log(`Inserting data for ${symbol}: Open: ${data.o}, High: ${data.h}, Low: ${data.l}, Close: ${data.c}, Change: ${data.ch}, Change Percent: ${changePercent}, Timestamp: ${timestamp}`);

  const insertQuery = `
    INSERT INTO ${tableName} (symbol, open, high, low, close, change, change_percent, timestamp, last_update)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  `;
  await query(insertQuery, [
    symbol,         // symbol (s)
    data.o,         // open (o)
    data.h,         // high (h)
    data.l,         // low (l)
    data.c,         // close (c)
    data.ch,        // change (ch)
    changePercent,  // change_percent (cp)
    timestamp       // timestamp (t)
  ]);

  console.log(`Data for ${symbol} inserted into ${tableName}`);
};

// Function to fetch today's data
const fetchTodayData = async () => {
  const tableName = getTableNameForToday(); // Get today's table name
  try {
    const queryText = `SELECT symbol AS s, open AS o, high AS h, low AS l, close AS c, change AS ch, change_percent AS cp, timestamp AS t, last_update AS tm FROM ${tableName}`;
    const result = await query(queryText);

    if (result.rows.length > 0) {
      console.log(`Data from ${tableName}:`);
      result.rows.forEach(row => {
        console.log(`Symbol: ${row.s}, Open: ${row.o}, High: ${row.h}, Low: ${row.l}, Close: ${row.c}, Change: ${row.ch}, Change Percent: ${row.cp}, Timestamp: ${row.t}, Last Update: ${row.tm}`);
      });
    } else {
      console.log(`No data found in table ${tableName}`);
    }
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error);
  }
};

// Start the app
initialize();

