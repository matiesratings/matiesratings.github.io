let playerData = [];
let currentSortColumn = null;
let currentSortAsc = true;
let sortDirections = {};  // key: columnIndex, value: true (asc) or false (desc)

/**
 * Loads rating data for the selected category
 */
function loadSelectedData() {
    let selectedJson = document.getElementById("categorySelector").value;
    if (!selectedJson) {
        console.error("No category selected");
        displayEmpty();
        return;
    }

    fetch(`/src/data/json/${selectedJson}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${selectedJson}: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error(`Invalid data format for ${selectedJson}`);
            }
            playerData = data;
            displayData(playerData);
            setSliderBounds();
        })
        .catch(error => {
            console.error("Error loading rating data:", error);
            displayEmpty();
        });
}



// Load initial data on page load
fetch('/src/data/json/open_ratings.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load open_ratings.json: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format: expected array");
        }
        playerData = data;
        displayData(playerData);
        setSliderBounds();
    })
    .catch(error => {
        console.error("Error loading initial rating data:", error);
        displayEmpty();
    });

function displayEmpty(){
    let row = document.createElement("tr");
    let cell = document.createElement("td");
    cell.colSpan = 6;
    
    if (window.innerWidth > 480) {
        cell.colSpan = 6;
    } else {
        cell.colSpan = 3;
    }

    cell.textContent = "Results coming soon...";
    cell.style.color = "white";
    cell.style.backgroundColor = "black";
    cell.style.border = "1px solid maroon";
    cell.style.padding = "10px";
    cell.style.fontSize = "24px";  // Adjust this value as needed
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
}
function displayData(data) {
    const tableBody = document.getElementById("player-table");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        displayEmpty();
        return;
    }

    data.slice(0, 100).forEach(player => {
        // We add the text-table-clamp and a bottom border to the row
        let row = `<tr class="text-table-clamp border-b border-maroon">`; 
        // Add border-r (right border) to each cell for vertical separation
        row += `<td class="small-collumn border-r border-maroon">${player.rank}</td>`; 
        
        row += `<td class="border-r border-maroon"><a href="/pages/player.html?name=${encodeURIComponent(player.name)}" class="player-link">${player.name}</a></td>`;
        
        row += `<td class="mobile-hidden-col border-r border-maroon">${player.club}</td>`;
        row += `<td class="border-r border-maroon">${player.rating}</td>`;
        row += `<td class="border-r border-maroon">${player.played}</td>`;
        
        // The last cell doesn't need a right border if the table has an outer border
        row += `<td>${player.win_per}</td>`; 
        
        row += `</tr>`;
        tableBody.innerHTML += row;
    });
}

function fetchAndDisplayFilteredData(sortColumn = null, ascending = true) {
    const selectedJson = document.getElementById("categorySelector")?.value;
    if (!selectedJson) {
        console.error("Category selector not found");
        displayEmpty();
        return;
    }

    fetch(`/src/data/json/${selectedJson}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${selectedJson}: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error(`Invalid data format for ${selectedJson}`);
            }
            
            const name = document.getElementById("nameFilter")?.value.toLowerCase() || "";
            const club = document.getElementById("clubFilter")?.value.toLowerCase() || "";
            const ratingMin = parseInt(document.getElementById("ratingMin")?.value) || 0;
            const ratingMax = parseInt(document.getElementById("ratingMax")?.value) || 3000;

            let filtered = data.filter(player => {
                const playerRating = parseInt(player.rating) || 0;
                return (!name || (player.name && player.name.toLowerCase().includes(name))) &&
                    (!club || (player.club && player.club.toLowerCase().includes(club))) &&
                    (playerRating >= ratingMin && playerRating <= ratingMax);
            });

            if (sortColumn !== null) {
                const numericKeys = ["rank", "rating", "played", "win_per"];
                const keys = ["rank", "name", "club","rating", "played","win_per"];
                const key = keys[sortColumn];

                if (key) {
                    filtered.sort((a, b) => {
                        let valA = a[key];
                        let valB = b[key];
                    
                        if (numericKeys.includes(key)) {
                            valA = Number(valA) || 0;
                            valB = Number(valB) || 0;
                            return ascending ? valA - valB : valB - valA;
                        } else {
                            valA = String(valA || "");
                            valB = String(valB || "");
                            return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
                        }
                    });
                }
            }

            displayData(filtered);
        })
        .catch(error => {
            console.error("Error fetching filtered data:", error);
            displayEmpty();
        });
}

function filterTable() {
    fetchAndDisplayFilteredData(); // no sorting
}
function sortTable(columnIndex) {
    sortDirections[columnIndex] = !sortDirections[columnIndex];
    fetchAndDisplayFilteredData(columnIndex, sortDirections[columnIndex]);
}


let clubList = [];

document.addEventListener("DOMContentLoaded", function () {
    fetch("/src/data/json/clubs.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load clubs.json: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && Array.isArray(data.clubs)) {
                clubList = data.clubs;
            } else {
                console.warn("Invalid clubs data format");
                clubList = [];
            }
        })
        .catch(error => {
            console.error("Error loading clubs data:", error);
            clubList = [];
        });
});
const tableBody = document.getElementById("player-table");


function updateClubSuggestions() {
    let input = document.getElementById("clubFilter").value.toLowerCase();
    let suggestionBox = document.getElementById("clubSuggestions");

    suggestionBox.innerHTML = "";
    if (!input) {
        suggestionBox.style.display = "none";
        return;
    }

    let filteredClubs = clubList.filter(club => club.toLowerCase().includes(input));
    
    filteredClubs.forEach(club => {
        let div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = club;
        div.onclick = function () {
            document.getElementById("clubFilter").value = club;
            suggestionBox.style.display = "none";
            filterTable();
        };
        suggestionBox.appendChild(div);
    });

    suggestionBox.style.display = filteredClubs.length ? "block" : "none";
}

document.addEventListener("click", function (event) {
    let suggestionBox = document.getElementById("clubSuggestions");
    if (!document.getElementById("clubFilter").contains(event.target)) {
    suggestionBox.style.display = "none";
    }
});
function updateNameSuggestions() {
    let input = document.getElementById("nameFilter").value.toLowerCase();
    let suggestionBox = document.getElementById("nameSuggestions");

    suggestionBox.innerHTML = "";
    if (!input) {
        suggestionBox.style.display = "none";
        return;
    }

    let filteredNames = playerData
        .map(player => player.name)
        .filter(name => name.toLowerCase().includes(input));

    filteredNames.forEach(name => {
        let div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = name;
        div.onclick = function () {
            document.getElementById("nameFilter").value = name;
            suggestionBox.style.display = "none";
            filterTable();
        };
        suggestionBox.appendChild(div);
    });

    suggestionBox.style.display = filteredNames.length ? "block" : "none";
}

document.addEventListener("click", function (event) {
    let suggestionBox = document.getElementById("nameSuggestions");
    if (!document.getElementById("nameFilter").contains(event.target)) {
        suggestionBox.style.display = "none";
    }
});

function toggleNav() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}


let toggleCount = 0;

function toggleFilters() {
    toggleCount++;

    const section = document.getElementById("filterSection");
    const button = document.getElementById("toggleFilterButton");
    
    if (section.classList.contains("hidden")) {
        section.classList.remove("hidden");
        button.textContent = "Reset";
    } else {
        section.classList.add("hidden");
        button.textContent = "Filter";
    }

    if (toggleCount % 2 === 0) {
        resetFilters();
        toggleCount = 0;
        button.textContent = "Filter";
    }
}

document.addEventListener('click', function(event) {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    // Check if the click was outside the navigation menu and the hamburger button
    if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
        navLinks.classList.remove('active');
    }
});

function resetFilters() {
    document.getElementById("nameFilter").value = "";
    document.getElementById("clubFilter").value = "";
    // document.getElementById("categorySelector").value = "open_ratings.json"; 
    setSliderBounds();
    filterTable();
    loadSelectedData();
}




// --------------------------------------SLIDER
function setSliderBounds() {
    if (!playerData || playerData.length === 0) {
        return;
    }
    let ratings = playerData.map(p => p.rating).filter(r => r != null && !isNaN(r));
    if (ratings.length === 0) {
        return;
    }
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    
    const minSlider = document.getElementById("ratingMin");
    const maxSlider = document.getElementById("ratingMax");
    const minInput = document.getElementById("ratingMinInput");
    const maxInput = document.getElementById("ratingMaxInput");
    
    if (minSlider) {
        minSlider.min = minRating;
        minSlider.max = maxRating;
        minSlider.value = minRating;
    }
    if (maxSlider) {
        maxSlider.min = minRating;
        maxSlider.max = maxRating;
        maxSlider.value = maxRating;
    }
    if (minInput) {
        minInput.min = minRating;
        minInput.max = maxRating;
        minInput.value = minRating;
    }
    if (maxInput) {
        maxInput.min = minRating;
        maxInput.max = maxRating;
        maxInput.value = maxRating;
    }
    
    updateSlider('rating');
}

function updateSlider(type) {
    const minSlider = document.getElementById(type + "Min");
    const maxSlider = document.getElementById(type + "Max");
    const minInput = document.getElementById(type + "MinInput");
    const maxInput = document.getElementById(type + "MaxInput");

    if (!minSlider || !maxSlider || !minInput || !maxInput) {
        return;
    }

    // Ensure min doesn't exceed max
    if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
        minSlider.value = maxSlider.value;
    }
    if (parseInt(maxSlider.value) < parseInt(minSlider.value)) {
        maxSlider.value = minSlider.value;
    }

    // Sync input fields with sliders
    minInput.value = minSlider.value;
    maxInput.value = maxSlider.value;

    filterTable();
}

function syncInput(type, bound) {
    const inputField = document.getElementById(type + bound.charAt(0).toUpperCase() + bound.slice(1) + "Input");
    const slider = document.getElementById(type + bound.charAt(0).toUpperCase() + bound.slice(1));

    if (!inputField || !slider) {
        return;
    }

    const inputValue = parseInt(inputField.value);
    const minValue = parseInt(slider.min);
    const maxValue = parseInt(slider.max);

    if (!isNaN(inputValue) && inputValue >= minValue && inputValue <= maxValue) {
        slider.value = inputValue;
        updateSlider(type);
    } else {
        // Reset to slider value if input is invalid
        inputField.value = slider.value;
    }
}
// ---------------------------------------------