let playerData = [];

let currentSortColumn = null;
let currentSortAsc = true;
let sortDirections = {};  // key: columnIndex, value: true (asc) or false (desc)


function loadSelectedData() {
    let selectedJson = document.getElementById("categorySelector").value;
    
    fetch(`scr/data/${selectedJson}`)
        .then(response => response.json())
        .then(data => {
            playerData = data;
            displayData(playerData);
            setSliderBounds();
        })
        .catch(error => console.error("Error loading JSON:", error));
}

// Load JSON data
fetch('scr/data/open_players.json')
    .then(response => response.json())
    .then(data => {
        playerData = data;
        displayData(playerData);
        setSliderBounds();
    })
    .catch(error => console.error("Error loading JSON:", error));

function displayData(data) {
    const tableBody = document.getElementById("player-table");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.colSpan = 6;
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
            <td>${player.rating}</td>
            <td>${player.club}</td>
            <td>${player.birth_year}</td>
            <td>${player.gender}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

function fetchAndDisplayFilteredData(sortColumn = null, ascending = true) {
    const selectedJson = document.getElementById("categorySelector").value;

    fetch(`scr/data/${selectedJson}`)
        .then(response => response.json())
        .then(data => {
            const name = document.getElementById("nameFilter").value.toLowerCase();
            const club = document.getElementById("clubFilter").value.toLowerCase();
            const gender = document.getElementById("genderFilter").value.toLowerCase();
            const ratingMin = parseInt(document.getElementById("ratingMin").value);
            const ratingMax = parseInt(document.getElementById("ratingMax").value);
            const yearMin = parseInt(document.getElementById("yearMin").value);
            const yearMax = parseInt(document.getElementById("yearMax").value);

            let filtered = data.filter(player => {
                return (!name || player.name.toLowerCase().includes(name)) &&
                    (!club || player.club.toLowerCase().includes(club)) &&
                    (gender === "both" || player.gender.toLowerCase() === gender) &&
                    (player.rating >= ratingMin && player.rating <= ratingMax) &&
                    (player.birth_year >= yearMin && player.birth_year <= yearMax);
            });

            if (sortColumn !== null) {
                const keys = ["maties_id", "name", "rating", "club", "birth_year", "gender"];
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


function sortTable(columnIndex) {
    const table = document.getElementById("player-table");
    const rows = Array.from(table.rows);
    
    // Toggle direction: true for ascending, false for descending
    sortDirections[columnIndex] = !sortDirections[columnIndex];

    rows.sort((a, b) => {
        const cellA = a.cells[columnIndex].textContent.trim();
        const cellB = b.cells[columnIndex].textContent.trim();

        const isNumber = !isNaN(cellA) && !isNaN(cellB);
        let comparison = 0;

        if (isNumber) {
            comparison = parseFloat(cellA) - parseFloat(cellB);
        } else {
            comparison = cellA.localeCompare(cellB);
        }

        return sortDirections[columnIndex] ? comparison : -comparison;
    });

    // Re-append sorted rows
    rows.forEach(row => table.appendChild(row));
}


function setSliderBounds() {
    let ratings = playerData.map(p => p.rating);
    let years = playerData.map(p => p.birth_year);
    document.getElementById("ratingMin").value = Math.min(...ratings);
    document.getElementById("ratingMax").value = Math.max(...ratings);
    document.getElementById("yearMin").value = Math.min(...years);
    document.getElementById("yearMax").value = Math.max(...years);
    updateSlider('rating');
    updateSlider('year');
}

function updateSlider(type) {
    let minSlider = document.getElementById(type + "Min");
    let maxSlider = document.getElementById(type + "Max");

    if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
        minSlider.value = maxSlider.value;
    }

    document.getElementById(type + "Values").textContent = `${minSlider.value} - ${maxSlider.value}`;
    filterTable();
}

// function filterTable() {
//     let selectedJson = document.getElementById("categorySelector").value;

//     fetch(`scr/data/${selectedJson}`)
//         .then(response => response.json())
//         .then(data => {
//             playerData = data;

//             let nameFilter = document.getElementById("nameFilter").value.toLowerCase();
//             let clubFilter = document.getElementById("clubFilter").value.toLowerCase();
//             let genderFilter = document.getElementById("genderFilter").value.toLowerCase();
//             let ratingMin = parseInt(document.getElementById("ratingMin").value);
//             let ratingMax = parseInt(document.getElementById("ratingMax").value);
//             let yearMin = parseInt(document.getElementById("yearMin").value);
//             let yearMax = parseInt(document.getElementById("yearMax").value);

//             let filteredData = playerData.filter(player => {
//                 return (!nameFilter || player.name.toLowerCase().includes(nameFilter)) &&
//                     (!clubFilter || player.club.toLowerCase().includes(clubFilter)) &&
//                     (genderFilter === "both" || player.gender.toLowerCase() === genderFilter) &&
//                     (player.rating >= ratingMin && player.rating <= ratingMax) &&
//                     (player.birth_year >= yearMin && player.birth_year <= yearMax);
//             });

//             displayData(filteredData);
//         })
//         .catch(error => console.error("Error reloading JSON during filtering:", error));
// }
function filterTable() {
    fetchAndDisplayFilteredData(); // no sorting
}
function sortTable(columnIndex) {
    sortDirections[columnIndex] = !sortDirections[columnIndex];
    fetchAndDisplayFilteredData(columnIndex, sortDirections[columnIndex]);
}

function syncInput(type, bound) {
let inputField = document.getElementById(type + bound.charAt(0).toUpperCase() + bound.slice(1) + "Input");
let slider = document.getElementById(type + bound.charAt(0).toUpperCase() + bound.slice(1));

if (parseInt(inputField.value) >= parseInt(slider.min) && parseInt(inputField.value) <= parseInt(slider.max)) {
    slider.value = inputField.value;
    updateSlider(type);
}
}

function updateSlider(type) {
    let minSlider = document.getElementById(type + "Min");
    let maxSlider = document.getElementById(type + "Max");
    let minInput = document.getElementById(type + "MinInput");
    let maxInput = document.getElementById(type + "MaxInput");

    if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
        minSlider.value = maxSlider.value;
    }

    minInput.value = minSlider.value;
    maxInput.value = maxSlider.value;

    filterTable();
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
function toggleFilters() {
    const section = document.getElementById("filterSection");
    section.style.display = section.style.display === "none" ? "block" : "none";
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
    document.getElementById("categorySelector").value = "open_players.json";


    setSliderBounds(); // Reset sliders to data-based min/max

    filterTable(); // Reapply default filters
    loadSelectedData();
}
