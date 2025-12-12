/**
 * Timezone Utility Functions for Indian Standard Time (IST)
 * IST = UTC + 5:30
 */

/**
 * Get current date and time in IST
 * @returns {Date} Current IST date
 */
const getISTDate = () => {
  const now = new Date();
  // Convert to IST by adding 5 hours 30 minutes
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  return istTime;
};

/**
 * Get start of day in IST (00:00:00)
 * @param {Date} date - Optional date, defaults to today
 * @returns {Date} Start of day in IST
 */
const getISTStartOfDay = (date = null) => {
  const targetDate = date ? new Date(date) : getISTDate();
  
  // Create IST date string
  const istDateString = targetDate.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse and create start of day
  const [month, day, year] = istDateString.split('/');
  const startOfDay = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
  
  return startOfDay;
};

/**
 * Get end of day in IST (23:59:59)
 * @param {Date} date - Optional date, defaults to today
 * @returns {Date} End of day in IST
 */
const getISTEndOfDay = (date = null) => {
  const targetDate = date ? new Date(date) : getISTDate();
  
  // Create IST date string
  const istDateString = targetDate.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse and create end of day
  const [month, day, year] = istDateString.split('/');
  const endOfDay = new Date(`${year}-${month}-${day}T23:59:59+05:30`);
  
  return endOfDay;
};

/**
 * Convert UTC date to IST
 * @param {Date} utcDate - UTC date
 * @returns {Date} IST date
 */
const convertToIST = (utcDate) => {
  if (!utcDate) return null;
  
  const date = new Date(utcDate);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset);
};

/**
 * Get IST date range for a specific date
 * @param {string|Date} dateInput - Date input
 * @returns {Object} { start, end } - Start and end of day in IST
 */
const getISTDateRange = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Get IST date string
  const istDateString = date.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [month, day, year] = istDateString.split('/');
  
  // Create start and end of day in IST
  const start = new Date(`${year}-${month}-${day}T00:00:00.000+05:30`);
  const end = new Date(`${year}-${month}-${day}T23:59:59.999+05:30`);
  
  return { start, end };
};

/**
 * Format date in IST
 * @param {Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
const formatISTDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleString('en-IN', defaultOptions);
};

/**
 * Format time in IST
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string (HH:MM AM/PM)
 */
const formatISTTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get current IST time in 24-hour format
 * @returns {number} Current hour (0-23)
 */
const getCurrentISTHour = () => {
  const now = new Date();
  const istHour = parseInt(now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hour12: false
  }));
  
  return istHour;
};

/**
 * Check if a date is today in IST
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today in IST
 */
const isISTToday = (date) => {
  const today = getISTDate();
  const checkDate = new Date(date);
  
  const todayStr = today.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const checkStr = checkDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  return todayStr === checkStr;
};

/**
 * Get IST date string in YYYY-MM-DD format
 * @param {Date} date - Optional date, defaults to today
 * @returns {string} Date string in YYYY-MM-DD format
 */
const getISTDateString = (date = null) => {
  const targetDate = date ? new Date(date) : getISTDate();
  
  const istDateString = targetDate.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [month, day, year] = istDateString.split('/');
  return `${year}-${month}-${day}`;
};

module.exports = {
  getISTDate,
  getISTStartOfDay,
  getISTEndOfDay,
  convertToIST,
  getISTDateRange,
  formatISTDate,
  formatISTTime,
  getCurrentISTHour,
  isISTToday,
  getISTDateString
};
