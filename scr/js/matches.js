

let sortDirections = {};  // key: columnIndex, value: true (asc) or false (desc)
let toggleCount = 0;

function toggleFilters() {
    toggleCount++;

    const section = document.getElementById("filterSection");
    section.style.display = section.style.display === "none" ? "block" : "none";

    document.getElementById("toggleFilterButton").textContent = "Reset";

    if (toggleCount % 2 === 0) {
        resetMatchFilters(); // replace with the function you want to call
        toggleCount =0;
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
}

function resetMatchFilters(){
    document.getElementById("nameFilter").value = "";
    document.getElementById("loserFilter").value = "";
    document.getElementById("winnerFilter").value = "";
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

function updateWinnerSuggestions() {
    let input = document.getElementById("winnerFilter").value.toLowerCase();
    let suggestionBox = document.getElementById("winnerSuggestions");

    suggestionBox.innerHTML = "";
    if (!input) {
        suggestionBox.style.display = "none";
        return;
    }

    let filteredWinners = [...new Set(
        matchData
            .map(match => match.winner)
            .filter(name => name.toLowerCase().includes(input))
    )];
    
    filteredWinners.forEach(name => {
        let div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = name;
        div.onclick = function () {
            document.getElementById("winnerFilter").value = name;
            suggestionBox.style.display = "none";
            filterTable();
        };
        suggestionBox.appendChild(div);
    });

    suggestionBox.style.display = filteredWinners.length ? "block" : "none";
}

function updateLoserSuggestions() {
    let input = document.getElementById("loserFilter").value.toLowerCase();
    let suggestionBox = document.getElementById("loserSuggestions");

    suggestionBox.innerHTML = "";
    if (!input) {
        suggestionBox.style.display = "none";
        return;
    }

    let filteredLosers = [...new Set(
        matchData
            .map(match => match.loser)
            .filter(name => name.toLowerCase().includes(input))
    )];
    
    filteredLosers.forEach(name => {
        let div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = name;
        div.onclick = function () {
            document.getElementById("loserFilter").value = name;
            suggestionBox.style.display = "none";
            filterTable();
        };
        suggestionBox.appendChild(div);
    });

    suggestionBox.style.display = filteredLosers.length ? "block" : "none";
}

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
    fetch('scr/data/json/matches.json')
        .then(response => response.json())
        .then(data => {
            data.sort((a, b) => new Date(b.match_date) - new Date(a.match_date)); // sort by date descending
            matchData = data;
            displayData(matchData.slice(0, 100));
            populateDropdowns();
        })
        .catch(error => console.error("Error loading JSON:", error));
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
                cell.innerHTML = `<a href="player.html?name=${encodeURIComponent(playerName)}"; class="player-link">${playerName}</a>`;
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
        winner: get("winnerFilter"),
        loser: get("loserFilter"),
        event: get("eventFilter"),
        category: cat === "all" ? "" : cat,
        eventType: get("eventTypeFilter"),
        province: get("provinceFilter"),
        stage: get("stageFilter")
    };
}

function applyFilters(data, filters) {

    return data.filter(match => (
        (!filters.name || match.winner === filters.name || match.loser === filters.name) &&
        (!filters.winner || match.winner === filters.winner) &&
        (!filters.loser || match.loser === filters.loser) &&
        (!filters.event || match.event_name === filters.event) &&
        (!filters.category || filters.category === "All" || match.category === filters.category) &&
        (!filters.eventType || match.event_type === filters.eventType) &&
        (!filters.province || match.province === filters.province) &&
        (!filters.stage || match.stage === filters.stage)
    ));
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