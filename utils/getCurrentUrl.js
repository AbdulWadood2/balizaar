// getCurrentUrl.js

/**
 * Get the current URL of the server
 * @param {Object} req - The request object
 * @returns {string} - The current URL
 */
function getCurrentUrl(req) {
  const currentUrl = `http://${req.headers.host}${req.url}`;
  return currentUrl;
}

module.exports = getCurrentUrl;
