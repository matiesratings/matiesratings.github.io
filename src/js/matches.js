

let sortDirections = {};  // key: columnIndex, value: true (asc) or false (desc)
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
        resetMatchFilters();
        toggleCount = 0;
        button.textContent = "Filter";
    }
}
function populateDropdowns() {
    let eventTypes = [...new Set(matchData.map(match => match.event_type))];
    let provinces = [...new Set(matchData.map(match => match.province))];
    let stages = [...new Set(matchData.map(match => match.stage))];

    eventTypes.forEach(eventType => {
        let option = document.createElement("option");
        option.value = eventType;
        option.textContent = eventType;
        document.getElementById("eventTypeFilter").appendChild(option);
    });

    provinces.forEach(province => {
        let option = document.createElement("option");
        option.value = province;
        option.textContent = province;
        document.getElementById("provinceFilter").appendChild(option);
    });

    stages.forEach(stage => {
        let option = document.createElement("option");
        option.value = stage;
        option.textContent = stage;
        document.getElementById("stageFilter").appendChild(option);
    });
    
    // Convert selects to custom dropdowns after options are populated
    if (typeof convertAllSelectsToCustomDropdowns === 'function') {
        setTimeout(() => convertAllSelectsToCustomDropdowns(), 0);
    }
}

function resetMatchFilters(){
    document.getElementById("nameFilter").value = "";
    document.getElementById("playerFilterMode").value = "both";
    document.getElementById("eventFilter").value = "";
    document.getElementById("eventTypeFilter").value = "";
    document.getElementById("provinceFilter").value = "";
    document.getElementById("stageFilter").value = "";

    
    filterTable();
    

    document.getElementById("toggleFilterButton").textContent = "Filter";

}

function updateNameSuggestions() {
    let input = document.getElementById("nameFilter").value.toLowerCase();
    let suggestionBox = document.getElementById("nameSuggestions");

    suggestionBox.innerHTML = "";
    if (!input) {
        suggestionBox.style.display = "none";
        return;
    }

    let filteredNames = [...new Set(
        matchData
            .map(match => [match.winner, match.loser])
            .flat()
            .filter(name => name.toLowerCase().includes(input))
    )];
    
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

// Removed updateWinnerSuggestions and updateLoserSuggestions - now handled by updateNameSuggestions

function updateEventSuggestions() {
    let input = document.getElementById("eventFilter").value.toLowerCase();
    let suggestionBox = document.getElementById("eventSuggestions");

    suggestionBox.innerHTML = "";
    if (!input) {
        suggestionBox.style.display = "none";
        return;
    }

    let filteredEvents = [...new Set(
        matchData
            .map(match => match.event_name)
            .filter(name => name.toLowerCase().includes(input))
    )];
    
    filteredEvents.forEach(name => {
        let div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = name;
        div.onclick = function () {
            document.getElementById("eventFilter").value = name;
            suggestionBox.style.display = "none";
            filterTable();
        };
        suggestionBox.appendChild(div);
    });

    suggestionBox.style.display = filteredEvents.length ? "block" : "none";
}
function toggleNav() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}




let matchData = [];

function loadMatchData() {
    fetch('/src/data/json/matches.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load matches.json: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error("Invalid data format: expected array");
            }
            data.sort((a, b) => {
                try {
                    return new Date(b.match_date) - new Date(a.match_date);
                } catch (e) {
                    return 0;
                }
            }); // sort by date descending
            matchData = data;
            displayData(matchData.slice(0, 100));
            populateDropdowns();
        })
        .catch(error => {
            console.error("Error loading match data:", error);
            displayData([]); // Show empty state
        });
}

loadMatchData();

// function displayData(data) {
//     const tableBody = document.getElementById("match-table");
//     tableBody.innerHTML = "";

//     if (data.length === 0) {
//         const row = tableBody.insertRow();
//         const cell = row.insertCell();
//         cell.colSpan = window.innerWidth > 480 ? 10 : 4;
//         cell.textContent = "Results coming soon...";
//         Object.assign(cell.style, {
//             color: "white",
//             backgroundColor: "black",
//             border: "1px solid maroon",
//             padding: "10px",
//             fontSize: "24px"
//         });
//         return;
//     }

//     // Get the visible column indices by checking the header row
//     const headerCells = document.querySelectorAll("#match-table-head th");
//     const visibleColumnIndices = [];
//     const isMobile = window.innerWidth < 780;

//     headerCells.forEach((th, index) => {
//         const isHiddenMobileCol = th.classList.contains("mobile-hidden-col");
//         if (!(isMobile && isHiddenMobileCol)) {
//             visibleColumnIndices.push(index);
//         }
//     });


//     data.forEach(match => {
//         const row = tableBody.insertRow();
//         const values = Object.values(match);
//         visibleColumnIndices.forEach(index => {
//             const cell = row.insertCell();
//             cell.textContent = values[index];
//         });
//     });


// }

function displayData(data) {
    const tableBody = document.getElementById("match-table");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = window.innerWidth > 480 ? 10 : 4;
        cell.textContent = "Results coming soon...";
        Object.assign(cell.style, {
            color: "white",
            backgroundColor: "black",
            border: "1px solid maroon",
            padding: "10px",
            fontSize: "24px"
        });
        return;
    }

    // Define consistent column order
    const columnKeys = ['match_id', 'match_date', 'event_name', 'event_type', 'category', 'province', 'stage', 'winner', 'loser', 'score'];

    // Determine visible columns based on header visibility
    const headerCells = document.querySelectorAll("#match-table-head th");
    const visibleColumnIndices = [];
    const isMobile = window.innerWidth < 780;

    headerCells.forEach((th, index) => {
        const isHiddenMobileCol = th.classList.contains("mobile-hidden-col");
        if (!(isMobile && isHiddenMobileCol)) {
            visibleColumnIndices.push(index);
        }
    });

    data.forEach(match => {
        const row = tableBody.insertRow();
        visibleColumnIndices.forEach(index => {
            const key = columnKeys[index];
            const cell = row.insertCell();

            if (key === "winner" || key === "loser") {
                const playerName = match[key];
                cell.innerHTML = `<a href="/pages/player.html?name=${encodeURIComponent(playerName)}" class="player-link">${playerName}</a>`;
            } else {
                cell.textContent = match[key];
            }
        });
    });
}


function getFilterValues() {
    const get = id => document.getElementById(id).value;
    const cat = get("categorySelector");
    return {
        name: get("nameFilter"),
        playerMode: get("playerFilterMode") || "both",
        event: get("eventFilter"),
        category: cat === "all" ? "" : cat,
        eventType: get("eventTypeFilter"),
        province: get("provinceFilter"),
        stage: get("stageFilter")
    };
}

function applyFilters(data, filters) {
    return data.filter(match => {
        // Player name filter with mode (both/win/loss)
        if (filters.name) {
            const nameMatches = match.winner.toLowerCase().includes(filters.name.toLowerCase()) || 
                               match.loser.toLowerCase().includes(filters.name.toLowerCase());
            if (!nameMatches) return false;
            
            // Apply mode filter if name matches
            if (filters.playerMode === "win") {
                if (!match.winner.toLowerCase().includes(filters.name.toLowerCase())) return false;
            } else if (filters.playerMode === "loss") {
                if (!match.loser.toLowerCase().includes(filters.name.toLowerCase())) return false;
            }
            // If mode is "both", we already checked nameMatches above
        }
        
        // Other filters
        return (
            (!filters.event || match.event_name === filters.event) &&
            (!filters.category || filters.category === "All" || match.category === filters.category) &&
            (!filters.eventType || match.event_type === filters.eventType) &&
            (!filters.province || match.province === filters.province) &&
            (!filters.stage || match.stage === filters.stage)
        );
    });
}

function sortTable(columnIndex, forceDirection = null) {
    const filters = getFilterValues();
    let filtered = applyFilters(matchData, filters);

    const columnMap = ['match_id', 'match_date', 'event_name', 'event_type', 'category', 'province', 'stage', 'winner', 'loser', 'score'];
    const key = columnMap[columnIndex];

    if (forceDirection !== null) {
        sortDirections[columnIndex] = false;
    } else {
        sortDirections[columnIndex] = !sortDirections[columnIndex];
    }
    const ascending = sortDirections[columnIndex];

    filtered.sort((a, b) => {
        const valA = a[key], valB = b[key];
        return (isNaN(valA) ? valA.localeCompare(valB) : valA - valB) * (ascending ? 1 : -1);
    });

    displayData(filtered.slice(0, 100));
}

function filterTable() {
    const filters = getFilterValues();
    let filteredData = applyFilters(matchData, filters);
    displayData(filteredData.slice(0, 100)); // Display first 100 matches after sorting
}



document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("categorySelector").value = "All";

});