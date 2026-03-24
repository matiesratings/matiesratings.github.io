/**
 * Player profile page - loads ratings, match history, clutch stats,
 * and renders the player info card with filtering/sorting for matches.
 */

// ── State ──

const params = new URLSearchParams(window.location.search);
const playerName = params.get("name");
if (!playerName) {
    document.body.innerHTML = "<p>No player specified.</p>";
    throw new Error("Missing player name");
}

let matchData = [];
let sortDirections = {};
let toggleCount = 0;
let activeFilterButton = null;

// Stage ordering for chronological sort (lower = earlier in tournament)
const STAGE_ORDER = {
    "groups": 0, "group": 0, "group stage": 0,
    "round of 128": 1, "r128": 1,
    "round of 64": 2, "r64": 2,
    "round of 32": 3, "r32": 3,
    "round of 16": 4, "r16": 4,
    "quarterfinals": 5, "quarterfinal": 5, "quarter-final": 5, "qf": 5,
    "semifinals": 6, "semifinal": 6, "semi-final": 6, "sf": 6,
    "3rd place": 7, "third place": 7, "bronze": 7, "playoff": 7,
    "final": 8, "finals": 8
};

function getStageOrder(stage) {
    if (!stage) return 0;
    return STAGE_ORDER[stage.toLowerCase()] ?? 0;
}

function chronologicalSort(a, b) {
    // Primary: date descending
    const dateA = new Date(a.match_date), dateB = new Date(b.match_date);
    if (dateA.getTime() !== dateB.getTime()) return dateB - dateA;
    // Secondary: event name (group same-event matches)
    const eventCmp = (a.event_name || "").localeCompare(b.event_name || "");
    if (eventCmp !== 0) return eventCmp;
    // Tertiary: stage order ascending (groups first → finals last)
    return getStageOrder(b.stage) - getStageOrder(a.stage);
}

// ── Rating categories ──

const RATING_CATEGORIES = [
    { id: "open", label: "Open", file: "open_ratings.json" },
    { id: "men", label: "Men's", file: "men_ratings.json" },
    { id: "women", label: "Women's", file: "women_ratings.json" },
    { id: "mo40", label: "Men's 40+", file: "mo40_ratings.json" },
    { id: "mo50", label: "Men's 50+", file: "mo50_ratings.json" },
    { id: "mo60", label: "Men's 60+", file: "mo60_ratings.json" },
    { id: "bu19", label: "Boys U19", file: "bu19_ratings.json" },
    { id: "gu19", label: "Girls U19", file: "gu19_ratings.json" },
    { id: "bu15", label: "Boys U15", file: "bu15_ratings.json" },
    { id: "gu15", label: "Girls U15", file: "gu15_ratings.json" },
    { id: "bu13", label: "Boys U13", file: "bu13_ratings.json" },
    { id: "gu13", label: "Girls U13", file: "gu13_ratings.json" },
    { id: "bu11", label: "Boys U11", file: "bu11_ratings.json" },
    { id: "gu11", label: "Girls U11", file: "gu11_ratings.json" }
];

// ── Player info card ──

function loadPlayerInfo() {
    const allPlayersReq = fetch('/src/data/json/all_players.json').then(r => r.json());
    const clutchReq = fetch('/src/data/json/clutch_ratings.json').then(r => r.ok ? r.json() : []).catch(() => []);
    const ratingReqs = RATING_CATEGORIES.map(cat =>
        fetch(`/src/data/json/${cat.file}`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => [])
    );

    Promise.all([allPlayersReq, clutchReq, ...ratingReqs]).then(([allPlayers, clutchData, ...allRatings]) => {
        const nameLower = playerName.toLowerCase();
        const playerAll = allPlayers.find(p => p.name.toLowerCase() === nameLower);
        const gender = playerAll ? playerAll.gender : "Unknown";

        // Find player in each rating category
        const playerRatings = [];
        RATING_CATEGORIES.forEach((cat, i) => {
            const entry = allRatings[i].find(p => p.name.toLowerCase() === nameLower);
            if (entry) playerRatings.push({ ...cat, data: entry });
        });

        // Determine primary rating: men's or women's based on gender, fallback to open
        let primary = null;
        if (gender === "Female") {
            primary = playerRatings.find(r => r.id === "women");
        } else {
            primary = playerRatings.find(r => r.id === "men");
        }
        if (!primary) primary = playerRatings.find(r => r.id === "open");
        if (!primary && playerRatings.length > 0) primary = playerRatings[0];

        const infoTable = document.getElementById("player-info-table").querySelector("tbody");
        infoTable.innerHTML = "";

        if (!primary) {
            infoTable.innerHTML = `<tr><td colspan="2" class="empty-state">No rating info found for this player.</td></tr>`;
            return;
        }

        const p = primary.data;
        const otherRatings = playerRatings.filter(r => r.id !== primary.id);

        // Other ratings as small cards
        let otherRatingsHtml = "";
        if (otherRatings.length > 0) {
            otherRatingsHtml = `<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:16px;">
                ${otherRatings.map(r => `<div style="border:1px solid var(--color-border); border-radius:8px; padding:8px 14px; text-align:center; min-width:70px;">
                    <div style="font-size:clamp(16px,2.5vw,20px); font-weight:bold; opacity:0.8;">${r.data.rating}</div>
                    <div style="font-size:clamp(10px,2vw,12px); opacity:0.4; margin-top:2px;">${r.label}</div>
                </div>`).join("")}
            </div>`;
        }

        // Stats columns
        const statsHeaders = [];
        const statsValues = [];
        if (p.played) { statsHeaders.push("Played"); statsValues.push(p.played); }
        if (p.won) { statsHeaders.push("Won"); statsValues.push(p.won); }
        if (p.lost) { statsHeaders.push("Lost"); statsValues.push(p.lost); }
        if (p.win_per) { statsHeaders.push("Win %"); statsValues.push(p.win_per + "%"); }
        const statsHtml = statsHeaders.length > 0
            ? `<div style="display:flex; justify-content:center; gap:clamp(14px,4vw,28px); font-size:clamp(13px,2.5vw,16px);">
                ${statsHeaders.map((h, i) => `<div style="text-align:center;">
                    <div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${statsValues[i]}</div>
                    <div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase; letter-spacing:0.5px;">${h}</div>
                </div>`).join("")}
            </div>`
            : "";

        // Detail lines
        const details = [];
        if (p.best_win) {
            const bwMatch = p.best_win.match(/^(.+?)\s*\((\d+)\)$/);
            if (bwMatch) {
                const bwName = bwMatch[1].trim();
                const bwRating = bwMatch[2];
                details.push(`Best Win: <strong><a href="/pages/player.html?name=${encodeURIComponent(bwName)}" class="player-link">${bwName}</a> (${bwRating})</strong>`);
            } else {
                details.push(`Best Win: <strong>${p.best_win}</strong>`);
            }
        }
        if (p.max_rating) details.push(`Peak: <strong>${p.max_rating}</strong>${p.max_rating_date ? ` (${p.max_rating_date})` : ""}`);
        if (p.last_played) details.push(`Last Played: <strong>${p.last_played}</strong>`);
        const detailHtml = details.length > 0
            ? `<div style="margin-top:14px; font-size:clamp(11px,2vw,14px); opacity:0.65; line-height:1.8;">${details.join("<br>")}</div>`
            : "";

        // Clutch stats
        const clutchPlayer = clutchData.find(c => c.name.toLowerCase() === nameLower);
        let clutchHtml = "";
        if (clutchPlayer && clutchPlayer.deciders > 0) {
            clutchHtml = `<div style="text-align:center; margin-top:14px;">
                <div style="font-size:clamp(10px,2vw,12px); opacity:0.4; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Clutch Rating <span style="text-transform:none; letter-spacing:0;">(decider sets won)</span></div>
                <div style="display:flex; justify-content:center; gap:clamp(14px,4vw,28px);">
                    <div style="text-align:center;"><div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${clutchPlayer.clutch_rate}%</div><div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase;">Clutch Rate</div></div>
                    <div style="text-align:center;"><div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${clutchPlayer.clutch_wins}/${clutchPlayer.deciders}</div><div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase;">Deciders Won</div></div>
                    <div style="text-align:center;"><div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${clutchPlayer.decider_pct}%</div><div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase;">Go to Decider</div></div>
                </div>
            </div>`;
        }

        const divider = '<div style="border-top:1px solid var(--color-primary); margin:14px auto; width:60%;"></div>';

        infoTable.innerHTML = `
            <tr>
                <td colspan="2" class="player-info-content">
                    <h2 class="player-rating">${p.rating}</h2>
                    <div style="font-size:clamp(12px,2.5vw,16px); opacity:0.5; margin-top:-10px; margin-bottom:10px;">${primary.label} Rating</div>
                    ${p.club ? `<h2 class="player-club">${p.club}</h2>` : ""}
                    ${statsHtml ? divider + statsHtml : ""}
                    ${detailHtml ? divider + detailHtml : ""}
                    ${clutchHtml ? divider + clutchHtml : ""}
                    ${otherRatingsHtml ? divider + otherRatingsHtml : ""}
                </td>
            </tr>
        `;
    }).catch(() => {
        const infoTable = document.getElementById("player-info-table").querySelector("tbody");
        infoTable.innerHTML = `<tr><td colspan="2" class="empty-state">Could not load player info.</td></tr>`;
    });
}

// ── Match history ──

function loadMatchData() {
    fetch('/src/data/json/matches.json')
        .then(response => response.json())
        .then(data => {
            matchData = data.filter(
                match => match.winner === playerName || match.loser === playerName
            );
            matchData.sort(chronologicalSort);
            displayData(matchData.slice(0, 100));
            populateDropdowns();
            resetFilterButtons();
            setTimeout(() => convertAllSelectsToCustomDropdowns(), 0);
        })
        .catch(error => console.error("Error loading match data:", error));
}

function displayData(data) {
    const tableBody = document.getElementById("match-table");
    tableBody.innerHTML = "";
    const isMobile = window.innerWidth <= 768;

    if (data.length === 0) {
        const colspan = isMobile ? 4 : 10;
        tableBody.innerHTML = `<tr><td colspan="${colspan}" class="empty-state">Results coming soon...</td></tr>`;
        return;
    }

    data.slice(0, 100).forEach(match => {
        let row = `<tr>`;
        row += `<td class="mobile-hidden-col">${match.match_id}</td>`;
        row += `<td class="mobile-hidden-col">${match.match_date}</td>`;
        row += `<td class="event-name-cell">${match.event_name}</td>`;
        row += `<td class="mobile-hidden-col">${match.event_type}</td>`;
        row += `<td class="mobile-hidden-col">${match.category}</td>`;
        row += `<td class="mobile-hidden-col">${match.province}</td>`;
        row += `<td class="mobile-hidden-col">${match.stage}</td>`;
        row += `<td><a href="/pages/player.html?name=${encodeURIComponent(match.winner)}" class="player-link">${match.winner}</a></td>`;
        row += `<td><a href="/pages/player.html?name=${encodeURIComponent(match.loser)}" class="player-link">${match.loser}</a></td>`;
        row += `<td>${match.score}</td>`;
        row += `</tr>`;
        tableBody.innerHTML += row;
    });
}

// ── Filtering ──

function resetFilterButtons() {
    activeFilterButton = null;
    document.getElementById("winsButton").classList.remove("active");
    document.getElementById("lossesButton").classList.remove("active");
}

function filterWins() {
    if (activeFilterButton === "wins") {
        resetFilterButtons();
        filterTable();
    } else {
        activeFilterButton = "wins";
        document.getElementById("winsButton").classList.add("active");
        document.getElementById("lossesButton").classList.remove("active");
        filterTable();
    }
}

function filterLosses() {
    if (activeFilterButton === "losses") {
        resetFilterButtons();
        filterTable();
    } else {
        activeFilterButton = "losses";
        document.getElementById("lossesButton").classList.add("active");
        document.getElementById("winsButton").classList.remove("active");
        filterTable();
    }
}

function getFilterValues() {
    const get = id => document.getElementById(id).value;
    return {
        name: get("nameFilter"),
        playerMode: get("playerFilterMode") || "both",
        event: get("eventFilter"),
        eventType: get("eventTypeFilter"),
        province: get("provinceFilter"),
        stage: get("stageFilter")
    };
}

function applyFilters(data, filters) {
    return data.filter(match => {
        if (filters.name) {
            const nameMatches = match.winner.toLowerCase().includes(filters.name.toLowerCase()) ||
                               match.loser.toLowerCase().includes(filters.name.toLowerCase());
            if (!nameMatches) return false;
            if (filters.playerMode === "win") {
                if (!match.winner.toLowerCase().includes(filters.name.toLowerCase())) return false;
            } else if (filters.playerMode === "loss") {
                if (!match.loser.toLowerCase().includes(filters.name.toLowerCase())) return false;
            }
        }
        return (
            (!filters.event || match.event_name === filters.event) &&
            (!filters.eventType || match.event_type === filters.eventType) &&
            (!filters.province || match.province === filters.province) &&
            (!filters.stage || match.stage === filters.stage)
        );
    });
}

function filterTable() {
    const filters = getFilterValues();
    let filteredData = applyFilters(matchData, filters);
    if (activeFilterButton === "wins") {
        filteredData = filteredData.filter(match => match.winner === playerName);
    } else if (activeFilterButton === "losses") {
        filteredData = filteredData.filter(match => match.loser === playerName);
    }
    displayData(filteredData.slice(0, 100));
}

// ── Sorting ──

function sortTable(columnIndex, forceDirection = null) {
    const filters = getFilterValues();
    let filtered = applyFilters(matchData, filters);
    if (activeFilterButton === "wins") {
        filtered = filtered.filter(match => match.winner === playerName);
    } else if (activeFilterButton === "losses") {
        filtered = filtered.filter(match => match.loser === playerName);
    }
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
        return (isNaN(valA) ? String(valA).localeCompare(String(valB)) : valA - valB) * (ascending ? 1 : -1);
    });
    displayData(filtered.slice(0, 100));
}

// ── Dropdowns ──

function populateDropdowns() {
    const eventTypes = [...new Set(matchData.map(m => m.event_type))];
    const provinces = [...new Set(matchData.map(m => m.province))];
    const stages = [...new Set(matchData.map(m => m.stage))];

    eventTypes.forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v; document.getElementById("eventTypeFilter").appendChild(o); });
    provinces.forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v; document.getElementById("provinceFilter").appendChild(o); });
    stages.forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v; document.getElementById("stageFilter").appendChild(o); });
}

// ── Suggestions ──

function updateNameSuggestions() {
    const input = document.getElementById("nameFilter").value.toLowerCase();
    const box = document.getElementById("nameSuggestions");
    box.innerHTML = "";
    if (!input) { box.style.display = "none"; return; }

    const names = [...new Set(matchData.map(m => [m.winner, m.loser]).flat().filter(n => n && n.toLowerCase().includes(input)))];
    names.forEach(name => {
        const div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = name;
        div.onclick = () => { document.getElementById("nameFilter").value = name; box.style.display = "none"; filterTable(); };
        box.appendChild(div);
    });
    box.style.display = names.length ? "block" : "none";
}

function updateEventSuggestions() {
    const input = document.getElementById("eventFilter").value.toLowerCase();
    const box = document.getElementById("eventSuggestions");
    box.innerHTML = "";
    if (!input) { box.style.display = "none"; return; }

    const events = [...new Set(matchData.map(m => m.event_name).filter(n => n && n.toLowerCase().includes(input)))];
    events.forEach(name => {
        const div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = name;
        div.onclick = () => { document.getElementById("eventFilter").value = name; box.style.display = "none"; filterTable(); };
        box.appendChild(div);
    });
    box.style.display = events.length ? "block" : "none";
}

// ── Filter toggle ──

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

function resetFilters() {
    document.getElementById("nameFilter").value = "";
    document.getElementById("playerFilterMode").value = "both";
    document.getElementById("eventFilter").value = "";
    document.getElementById("eventTypeFilter").value = "";
    document.getElementById("provinceFilter").value = "";
    document.getElementById("stageFilter").value = "";
    filterTable();
}

// ── Init ──

document.addEventListener("DOMContentLoaded", function () {
    loadInclude("header-placeholder", "/components/header.html", () => {
        const headerTitle = document.getElementById("header-title");
        if (headerTitle) headerTitle.textContent = playerName;
    });
    setupNavCloseOnOutsideClick();
    loadPlayerInfo();
    loadMatchData();
});
