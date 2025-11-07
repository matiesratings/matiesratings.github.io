/**
 * Shared utility functions for the Maties Rating System website
 */

/**
 * Loads HTML content from a file and inserts it into an element
 * @param {string} id - The ID of the element to insert content into
 * @param {string} file - The path to the HTML file to load
 * @param {Function} callback - Optional callback function to execute after loading
 */
function loadInclude(id, file, callback = null) {
    fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${file}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = data;
                if (callback) callback();
            } else {
                console.error(`Element with id "${id}" not found`);
            }
        })
        .catch(error => {
            console.error(`Error loading include ${file}:`, error);
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `<p style="color: red;">Error loading content</p>`;
            }
        });
}

/**
 * Toggles the mobile navigation menu
 */
function toggleNav() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

/**
 * Sets up event listener to close navigation menu when clicking outside
 */
function setupNavCloseOnOutsideClick() {
    document.addEventListener('click', function(event) {
        const navLinks = document.querySelector('.nav-links');
        const hamburger = document.querySelector('.hamburger');
        
        if (navLinks && hamburger) {
            // Check if the click was outside the navigation menu and the hamburger button
            if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
                navLinks.classList.remove('active');
            }
        }
    });
}

/**
 * Sets the header title with retry logic
 * @param {string} title - The title text to set
 * @param {number} retryDelay - Delay in milliseconds before retrying (default: 50)
 * @param {number} maxRetries - Maximum number of retries (default: 20)
 */
function setHeaderTitle(title, retryDelay = 50, maxRetries = 20) {
    let attempts = 0;
    const setTitle = () => {
        const titleElement = document.getElementById("header-title");
        if (titleElement) {
            titleElement.textContent = title;
        } else if (attempts < maxRetries) {
            attempts++;
            setTimeout(setTitle, retryDelay);
        } else {
            console.warn("Could not set header title: element not found after retries");
        }
    };
    setTitle();
}

/**
 * Sets the header title with HTML content (allows line breaks)
 * @param {string} html - The HTML content to set
 * @param {number} retryDelay - Delay in milliseconds before retrying (default: 50)
 * @param {number} maxRetries - Maximum number of retries (default: 20)
 */
function setHeaderTitleHTML(html, retryDelay = 50, maxRetries = 20) {
    let attempts = 0;
    const setTitle = () => {
        const titleElement = document.getElementById("header-title");
        if (titleElement) {
            titleElement.innerHTML = html;
        } else if (attempts < maxRetries) {
            attempts++;
            setTimeout(setTitle, retryDelay);
        } else {
            console.warn("Could not set header title: element not found after retries");
        }
    };
    setTitle();
}

/**
 * Generic error handler for fetch requests
 * @param {Error} error - The error object
 * @param {string} context - Context description for the error
 */
function handleFetchError(error, context = "Data") {
    console.error(`Error loading ${context}:`, error);
    // Could show user-friendly error message here
    return null;
}

/**
 * Fetches JSON data with error handling
 * @param {string} url - The URL to fetch
 * @returns {Promise<Object|Array|null>} The parsed JSON data or null on error
 */
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        handleFetchError(error, `JSON from ${url}`);
        return null;
    }
}

/**
 * Initialize common page functionality
 * @param {Object} options - Configuration options
 * @param {string} options.headerFile - Path to header HTML file
 * @param {string} options.footerFile - Optional path to footer HTML file
 * @param {string|Function} options.title - Title string or function to set title
 * @param {boolean} options.setupNav - Whether to setup navigation close handler (default: true)
 */
function initPage(options = {}) {
    const {
        headerFile = "/components/header.html",
        footerFile = null,
        title = null,
        setupNav = true
    } = options;

    document.addEventListener("DOMContentLoaded", function() {
        // Load header
        if (headerFile) {
            loadInclude("header-placeholder", headerFile, () => {
                // Set title after header loads if provided
                if (title) {
                    if (typeof title === 'function') {
                        title();
                    } else if (title.includes('<br>') || title.includes('<')) {
                        setHeaderTitleHTML(title);
                    } else {
                        setHeaderTitle(title);
                    }
                }
            });
        }

        // Load footer if provided
        if (footerFile) {
            loadInclude("footer-placeholder", footerFile);
        }

        // Setup navigation close handler
        if (setupNav) {
            setupNavCloseOnOutsideClick();
        }
    });
}

// Export functions for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadInclude,
        toggleNav,
        setupNavCloseOnOutsideClick,
        setHeaderTitle,
        setHeaderTitleHTML,
        handleFetchError,
        fetchJSON,
        initPage
    };
}

