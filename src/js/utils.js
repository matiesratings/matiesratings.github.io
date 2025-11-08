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

/**
 * Converts a native select element to a custom dropdown that matches the suggestion-box style
 * @param {HTMLSelectElement} selectElement - The select element to convert
 */
function convertSelectToCustomDropdown(selectElement) {
    if (!selectElement || selectElement.classList.contains('custom-dropdown-converted')) {
        return;
    }

    // Check if this dropdown is in a filter container or meta-header before wrapping
    const isInFilterContainer = selectElement.closest('.filter-container');
    const isInMetaHeader = selectElement.closest('.meta-header');
    
    // Wrap the select in a custom dropdown container
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown';
    
    // Create display element
    const display = document.createElement('div');
    display.className = 'custom-dropdown-display';
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-dropdown-options';
    
    // Calculate width based on longest option text
    const calculateOptimalWidth = () => {
        let maxWidth = 0;
        // Use display element's computed style (should be in DOM by now)
        const computedStyle = window.getComputedStyle(display);
        
        Array.from(selectElement.options).forEach(option => {
            // Create a temporary element to measure text width
            const temp = document.createElement('span');
            temp.style.visibility = 'hidden';
            temp.style.position = 'absolute';
            temp.style.whiteSpace = 'nowrap';
            temp.style.fontSize = computedStyle.fontSize;
            temp.style.fontFamily = computedStyle.fontFamily;
            temp.style.fontWeight = computedStyle.fontWeight;
            temp.style.padding = computedStyle.padding;
            temp.textContent = option.textContent;
            document.body.appendChild(temp);
            const width = temp.offsetWidth;
            document.body.removeChild(temp);
            if (width > maxWidth) {
                maxWidth = width;
            }
        });
        // Add some padding for the dropdown arrow/click area
        return Math.max(maxWidth + 40, 100); // Minimum 100px
    };
    
    // Set the width based on longest option
    const setOptimalWidth = () => {
        // If in filter container, keep it at 100%
        if (isInFilterContainer) {
            wrapper.style.width = '100%';
        } else {
            const optimalWidth = calculateOptimalWidth();
            wrapper.style.width = optimalWidth + 'px';
        }
        display.style.width = '100%';
        optionsContainer.style.width = '100%';
    };
    
    // Get current selected option text
    const updateDisplay = () => {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        display.textContent = selectedOption ? selectedOption.textContent : '';
    };
    
    // Create option elements
    const createOptions = () => {
        optionsContainer.innerHTML = '';
        Array.from(selectElement.options).forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-dropdown-option';
            if (option.selected) {
                optionDiv.classList.add('selected');
            }
            optionDiv.textContent = option.textContent;
            optionDiv.dataset.value = option.value;
            optionDiv.dataset.index = index;
            
            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                // Update select value
                selectElement.selectedIndex = index;
                // Update display
                updateDisplay();
                // Update selected state
                optionsContainer.querySelectorAll('.custom-dropdown-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                optionDiv.classList.add('selected');
                // Hide dropdown
                optionsContainer.classList.remove('show');
                // Reset positioning when closed (mobile)
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    optionsContainer.style.position = '';
                    optionsContainer.style.top = '';
                    optionsContainer.style.left = '';
                    optionsContainer.style.width = '';
                }
                // Trigger change event
                const changeEvent = new Event('change', { bubbles: true });
                selectElement.dispatchEvent(changeEvent);
            });
            
            optionsContainer.appendChild(optionDiv);
        });
    };
    
    // Function to position dropdown correctly (handles fixed positioning on mobile)
    const positionDropdown = () => {
        if (!optionsContainer.classList.contains('show')) return;
        
        const rect = display.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // On mobile, use fixed positioning to escape stacking contexts
            // getBoundingClientRect() already gives viewport coordinates, perfect for fixed positioning
            optionsContainer.style.position = 'fixed';
            optionsContainer.style.top = rect.bottom + 'px';
            optionsContainer.style.left = rect.left + 'px';
            optionsContainer.style.width = rect.width + 'px';
            optionsContainer.style.zIndex = '2147483647';
        } else {
            // On desktop, use absolute positioning (default)
            optionsContainer.style.position = 'absolute';
            optionsContainer.style.top = '';
            optionsContainer.style.left = '';
            optionsContainer.style.width = '';
        }
    };
    
    // Toggle dropdown on display click
    display.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShowing = optionsContainer.classList.contains('show');
        // Close all other dropdowns first
        document.querySelectorAll('.custom-dropdown-options.show').forEach(dropdown => {
            if (dropdown !== optionsContainer) {
                dropdown.classList.remove('show');
                // Reset positioning for closed dropdowns
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    dropdown.style.position = '';
                    dropdown.style.top = '';
                    dropdown.style.left = '';
                    dropdown.style.width = '';
                }
            }
        });
        optionsContainer.classList.toggle('show', !isShowing);
        // Position dropdown correctly - always run on mobile
        const isMobile = window.innerWidth <= 768;
        if (!isShowing && isMobile) {
            // Force immediate positioning on mobile
            requestAnimationFrame(() => {
                positionDropdown();
            });
        } else if (!isShowing) {
            // Desktop - reset to absolute
            optionsContainer.style.position = 'absolute';
            optionsContainer.style.top = '';
            optionsContainer.style.left = '';
            optionsContainer.style.width = '';
        }
    });
    
    // Watch for show class changes and position immediately
    const showObserver = new MutationObserver(() => {
        if (optionsContainer.classList.contains('show')) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                // Position immediately when shown on mobile
                requestAnimationFrame(() => {
                    positionDropdown();
                });
            }
        }
    });
    showObserver.observe(optionsContainer, { 
        attributes: true, 
        attributeFilter: ['class'] 
    });
    
    // Reposition on scroll/resize when dropdown is open
    window.addEventListener('scroll', () => {
        if (optionsContainer.classList.contains('show')) {
            positionDropdown();
        }
    }, true);
    
    window.addEventListener('resize', () => {
        if (optionsContainer.classList.contains('show')) {
            positionDropdown();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            optionsContainer.classList.remove('show');
            // Reset positioning when closed
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                optionsContainer.style.position = '';
                optionsContainer.style.top = '';
                optionsContainer.style.left = '';
                optionsContainer.style.width = '';
            }
        }
    });
    
    // Initialize
    updateDisplay();
    createOptions();
    
    // Wrap select and add new elements
    selectElement.parentNode.insertBefore(wrapper, selectElement);
    wrapper.appendChild(selectElement);
    wrapper.appendChild(display);
    wrapper.appendChild(optionsContainer);
    
    // Set optimal width after elements are in DOM
    setTimeout(() => {
        setOptimalWidth();
    }, 0);
    
    // Watch for programmatic changes to select (options added/removed, selection changed)
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                // Options were added or removed
                shouldUpdate = true;
            } else if (mutation.type === 'attributes' && mutation.attributeName === 'selected') {
                // Selection changed
                shouldUpdate = true;
            }
        });
        if (shouldUpdate) {
            updateDisplay();
            createOptions();
            // Recalculate width if options changed
            setTimeout(() => setOptimalWidth(), 0);
        }
    });
    observer.observe(selectElement, { 
        attributes: true, 
        attributeFilter: ['selected'],
        childList: true,
        subtree: true
    });
    
    // Also listen for change events to update display
    selectElement.addEventListener('change', () => {
        updateDisplay();
        createOptions();
    });
    
    // Mark as converted
    selectElement.classList.add('custom-dropdown-converted');
}

/**
 * Converts all select elements on the page to custom dropdowns
 * @param {string} selector - Optional CSS selector to limit which selects to convert (default: 'select')
 */
function convertAllSelectsToCustomDropdowns(selector = 'select') {
    document.querySelectorAll(selector).forEach(select => {
        // Skip if already converted or if it's a special case
        if (!select.classList.contains('custom-dropdown-converted') && 
            !select.hasAttribute('data-no-custom')) {
            convertSelectToCustomDropdown(select);
        }
    });
}

