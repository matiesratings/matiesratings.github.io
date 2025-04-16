let matchData = [];

// Load match data
fetch('scr/data/matches.json')
    .then(response => response.json())
    .then(data => {
        matchData = data;
        displayData(matchData);
        populateDropdowns();
    })
    .catch(error => console.error("Error loading JSON:", error));
    document.getElementById("categorySelector").value = "Men's Singles";

function displayData(data) {
    const tableBody = document.getElementById("match-table");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.colSpan = 10;
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

    data.slice(0, 100).forEach(match => {
        let row = `<tr>
        <td>${match.match_id}</td>
        <td>${match.match_date}</td>
        <td>${match.event_name}</td>
        <td>${match.event_type}</td>
        <td>${match.category}</td>
        <td>${match.province}</td>
        <td>${match.stage}</td>
        <td>${match.winner}</td>
        <td>${match.loser}</td>
        <td>${match.score}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

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




function sortTable(columnIndex) {
    // Fetch match data again
    fetch('scr/data/matches.json')
        .then(response => response.json())
        .then(data => {
            // Apply filters first
            let nameFilter = document.getElementById("nameFilter").value.toLowerCase();
            let winnerFilter = document.getElementById("winnerFilter").value.toLowerCase();
            let loserFilter = document.getElementById("loserFilter").value.toLowerCase();
            let eventFilter = document.getElementById("eventFilter").value.toLowerCase();
            let categoryFilter = document.getElementById("categorySelector").value.toLowerCase();
            let eventTypeFilter = document.getElementById("eventTypeFilter").value.toLowerCase();
            let provinceFilter = document.getElementById("provinceFilter").value.toLowerCase();
            let stageFilter = document.getElementById("stageFilter").value.toLowerCase();
            if (categoryFilter === "all") {
                categoryFilter = ""; // Allow all categories
            }
            
            // Filter the data based on input values
            let filteredData = data.filter(match => {
                return (
                    (nameFilter === "" || match.winner.toLowerCase().includes(nameFilter) || match.loser.toLowerCase().includes(nameFilter)) &&
                    (winnerFilter === "" || match.winner.toLowerCase().includes(winnerFilter)) &&
                    (loserFilter === "" || match.loser.toLowerCase().includes(loserFilter)) &&
                    (eventFilter === "" || match.event_name.toLowerCase().includes(eventFilter)) &&
                    (categoryFilter === "" || match.category.toLowerCase().includes(categoryFilter)) &&
                    (eventTypeFilter === "" || match.event_type.toLowerCase().includes(eventTypeFilter)) &&
                    (provinceFilter === "" || match.province.toLowerCase().includes(provinceFilter)) &&
                    (stageFilter === "" || match.stage.toLowerCase().includes(stageFilter))
                );
            });

            // Toggle direction: true for ascending, false for descending
            sortDirections[columnIndex] = !sortDirections[columnIndex];

            // Column mapping based on the columnIndex
            const columnMapping = [
                'match_id',        // 0: match_id
                'match_date',      // 1: match_date
                'event_name',      // 2: event_name
                'event_type',      // 3: event_type
                'category',        // 4: category
                'province',        // 5: province
                'stage',           // 6: stage
                'winner',          // 7: winner
                'loser',           // 8: loser
                'score'            // 9: score
            ];

            // Sort the filtered data based on the selected column
            let sortedData = filteredData.sort((a, b) => {
                const propA = a[columnMapping[columnIndex]];
                const propB = b[columnMapping[columnIndex]];

                // If the property is a number, compare numerically
                if (!isNaN(propA) && !isNaN(propB)) {
                    return sortDirections[columnIndex] ? propA - propB : propB - propA;
                }

                // Otherwise, compare lexicographically (strings)
                return sortDirections[columnIndex] ? propA.localeCompare(propB) : propB.localeCompare(propA);
            });


            displayData(sortedData);
        })
        .catch(error => console.error("Error loading JSON:", error));
}

function filterTable() {
    let nameFilter = document.getElementById("nameFilter").value.toLowerCase();
    let winnerFilter = document.getElementById("winnerFilter").value.toLowerCase();
    let loserFilter = document.getElementById("loserFilter").value.toLowerCase();
    let eventFilter = document.getElementById("eventFilter").value.toLowerCase();
    let categoryFilter = document.getElementById("categorySelector").value.toLowerCase();
    let eventTypeFilter = document.getElementById("eventTypeFilter").value.toLowerCase();
    let provinceFilter = document.getElementById("provinceFilter").value.toLowerCase();
    let stageFilter = document.getElementById("stageFilter").value.toLowerCase();
    if (categoryFilter === "all") {
        categoryFilter = ""; // Allow all categories
    }

    // Fetch match data again
    fetch('scr/data/matches.json')
        .then(response => response.json())
        .then(data => {
            // Filter the data
            let filteredData = data.filter(match => {
                return (
                    (nameFilter === "" || match.winner.toLowerCase().includes(nameFilter) || match.loser.toLowerCase().includes(nameFilter)) &&
                    (winnerFilter === "" || match.winner.toLowerCase().includes(winnerFilter)) &&
                    (loserFilter === "" || match.loser.toLowerCase().includes(loserFilter)) &&
                    (eventFilter === "" || match.event_name.toLowerCase().includes(eventFilter)) &&
                    (categoryFilter === "" || match.category.toLowerCase().includes(categoryFilter)) &&
                    (eventTypeFilter === "" || match.event_type.toLowerCase().includes(eventTypeFilter)) &&
                    (provinceFilter === "" || match.province.toLowerCase().includes(provinceFilter)) &&
                    (stageFilter === "" || match.stage.toLowerCase().includes(stageFilter))
                );
            });

            // Limit results to 100
            displayData(filteredData);
        })
        .catch(error => console.error("Error loading JSON:", error));
}