let playerData = [];

// Load JSON data
fetch('players.json')
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
    data.forEach(player => {
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

function sortTable(columnIndex) {
    playerData.sort((a, b) => {
        let valA = Object.values(a)[columnIndex];
        let valB = Object.values(b)[columnIndex];
        return (isNaN(valA) ? valA.localeCompare(valB) : valA - valB);
    });
    displayData(playerData);
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

function filterTable() {
    let nameFilter = document.getElementById("nameFilter").value.toLowerCase();
    let clubFilter = document.getElementById("clubFilter").value.toLowerCase();
    let genderFilter = document.getElementById("genderFilter").value.toLowerCase();
    let ratingMin = parseInt(document.getElementById("ratingMin").value);
    let ratingMax = parseInt(document.getElementById("ratingMax").value);
    let yearMin = parseInt(document.getElementById("yearMin").value);
    let yearMax = parseInt(document.getElementById("yearMax").value);

    let filteredData = playerData.filter(player => {
        return (!nameFilter || player.name.toLowerCase().includes(nameFilter)) &&
               (!clubFilter || player.club.toLowerCase().includes(clubFilter)) &&
               (genderFilter === "both" || player.gender.toLowerCase() === genderFilter) &&
               (player.rating >= ratingMin && player.rating <= ratingMax) &&
               (player.birth_year >= yearMin && player.birth_year <= yearMax);
    });

    displayData(filteredData);
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
    fetch("clubs.json")
        .then(response => response.json())
        .then(data => {
            clubList = data.clubs;
        });
});

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

document.addEventListener('click', function(event) {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    // Check if the click was outside the navigation menu and the hamburger button
    if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
        navLinks.classList.remove('active');
    }
});