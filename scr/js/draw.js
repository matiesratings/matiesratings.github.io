// draw.js

// async function loadGroups() {
//     const response = await fetch("/scr/data/tournament/maties_open_25/R32.json");
//     const data = await response.json();
//     renderGroups(data);
// }
async function loadTournament() {
    const response = await fetch("/scr/data/tournament/maties_open_25/R32.json");
    const data = await response.json();
    renderNavToggles(data);
    renderGroups(data);
}

function renderNavToggles(data) {
    const nav = document.querySelector(".nav-links");
    nav.innerHTML = ""; // clear old nav items

    if (data.groups) {
        const groupsBtn = document.createElement("a");
        groupsBtn.textContent = "Groups";
        groupsBtn.href = "#";
        groupsBtn.onclick = () => renderGroups(data);
        nav.appendChild(groupsBtn);
    }

    if (data.knockouts) {
        const knockoutBtn = document.createElement("a");
        knockoutBtn.textContent = "Knockout";
        knockoutBtn.href = "#";
        knockoutBtn.onclick = () => renderKnockouts(data);
        nav.appendChild(knockoutBtn);
    }

    if (data.results) {
        const resultsBtn = document.createElement("a");
        resultsBtn.textContent = "Results";
        resultsBtn.href = "#";
        resultsBtn.onclick = () => renderGroupResults(data);
        nav.appendChild(resultsBtn);
    }
}


function renderGroups(data) {
    const container = document.getElementById("contentContainer");
    container.innerHTML = ""; // clear old content

    const groupsWrapper = document.createElement("div");
    groupsWrapper.id = "groups";
    groupsWrapper.className = "groups-container";

    data.groups.forEach(group => {
        const card = document.createElement("div");
        card.className = "group-card";

        const title = document.createElement("h2");
        title.textContent = group.name;
        card.appendChild(title);

        const ul = document.createElement("ul");
        ul.className = "player-list";

        group.players.forEach(player => {
            const li = document.createElement("li");

            const fullName = `${player.first_name} ${player.surname}`;

            const a = document.createElement("a");
            a.href = `player.html?name=${encodeURIComponent(fullName)}`;
            a.textContent = fullName;
            a.className = "player-link";

            li.appendChild(a);
            ul.appendChild(li);
        });

        card.appendChild(ul);
        groupsWrapper.appendChild(card);
    });
    container.appendChild(groupsWrapper);
}

function renderGroupResults() {
    const container = document.getElementById("contentContainer");
    container.innerHTML = "<h2>Group Results will be rendered here</h2>";
}

function loadInclude(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => document.getElementById(id).innerHTML = data);
}

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

