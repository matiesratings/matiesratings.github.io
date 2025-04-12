fetch('scr/data/all_players.json')
    .then(response => response.json())
    .then(data => {
        playerData = data;
        displayData(playerData);
    }).catch(error => console.error("Error loading JSON:", error));


function displayData(data) {
    const tableBody = document.getElementById("player-table");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.colSpan = 5;
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
    data.slice(0, 100).forEach(player => {
        let row = `<tr>
            <td>${player.maties_id}</td>
            <td>${player.name}</td>
            <td>${player.club}</td>
            <td>${player.gender}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}
let sortDirections = {};  // key: columnIndex, value: true (asc) or false (desc)

function fetchAndDisplayFilteredData(sortColumn = null, ascending = true) {

    fetch(`scr/data/all_players.json`)
        .then(response => response.json())
        .then(data => {
            const name = document.getElementById("nameFilter").value.toLowerCase();
            const club = document.getElementById("clubFilter").value.toLowerCase();
            const gender = document.getElementById("genderFilter").value.toLowerCase();

            let filtered = data.filter(player => {
                return (!name || player.name.toLowerCase().includes(name)) &&
                    (!club || player.club.toLowerCase().includes(club)) &&
                    (gender === "both" || player.gender.toLowerCase() === gender)
                });

            if (sortColumn !== null) {
                const keys = ["maties_id", "name", "club", "gender"];
                const key = keys[sortColumn];

                filtered.sort((a, b) => {
                    const valA = a[key];
                    const valB = b[key];

                    if (typeof valA === "number" && typeof valB === "number") {
                        return ascending ? valA - valB : valB - valA;
                    } else {
                        return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    }
                });
            }

            displayData(filtered);
        })
        .catch(error => console.error("Error fetching data:", error));
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
    fetch("scr/data/clubs.json")
        .then(response => response.json())
        .then(data => {
            clubList = data.clubs;
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
    section.style.display = section.style.display === "none" ? "block" : "none";

    document.getElementById("toggleFilterButton").textContent = "Reset";

    if (toggleCount % 2 === 0) {
        resetFilters(); // replace with the function you want to call
        toggleCount =0;
        document.getElementById("toggleFilterButton").textContent = "Filter";
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
    document.getElementById("genderFilter").value = "both";
    filterTable();
}