// draw.js

// Load JSON data
async function loadGroups() {
    const response = await fetch("scr/data/json/draw.json");
    const data = await response.json();
    renderGroups(data);
}

// Render Groups exactly as in your original code
function renderGroups(data) {
    const container = document.getElementById("groups");
    container.innerHTML = "";

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
        container.appendChild(card);
    });
}

// Placeholder for Knockouts view
function renderKnockouts() {
    const container = document.getElementById("groups");
    container.innerHTML = "<h2>Knockouts will be rendered here</h2>";
}

// Placeholder for Group Results view
function renderGroupResults() {
    const container = document.getElementById("groups");
    container.innerHTML = "<h2>Group Results will be rendered here</h2>";
}

// Load header and footer includes
function loadInclude(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => document.getElementById(id).innerHTML = data);
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
    // Load includes
    loadInclude("header-placeholder", "Sections/header.html");
    // loadInclude("footer-placeholder", "Sections/footer.html");

    // Set header title with line break
    const setTitle = () => {
        const titleElement = document.getElementById("header-title");
        if (titleElement) {
            titleElement.innerHTML = "Maties Open 2025 <br> Men's Singles Draw";
        } else {
            setTimeout(setTitle, 50);
        }
    };
    setTitle();

    // Setup toggle buttons
    const btnGroups = document.getElementById("btnGroups");
    const btnKnockouts = document.getElementById("btnKnockouts");
    const btnGroupResults = document.getElementById("btnGroupResults");

    btnGroups.addEventListener("click", loadGroups);
    btnKnockouts.addEventListener("click", renderKnockouts);
    btnGroupResults.addEventListener("click", renderGroupResults);

    // Render default view
    loadGroups();
});
