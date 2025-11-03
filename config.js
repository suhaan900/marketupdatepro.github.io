// Replace with your Alpha Vantage API key.
// Get one for free at: https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_KEY = "CN757V1MYJJ7C9PV";

// NSE symbols (Alpha Vantage uses .NS suffix)
const STOCK_SYMBOLS = ["RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS","HINDUNILVR.NS","LT.NS","BHARTIARTL.NS","AXISBANK.NS","ITC.NS","SBIN.NS","MARUTI.NS"];

// Chart default symbol and refresh
const CHART_SYMBOL = "RELIANCE.NS";
const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes
