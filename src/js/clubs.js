/**
 * Club Rankings page - displays all clubs ranked by average rating
 * with sortable columns and filtering.
 */

let clubData = [];
let sortDirections = {};
let currentCategory = "open";
let toggleCount = 0;

function getRatingKey() {
    if (currentCategory === "men") return "avg_men_rating";
    if (currentCategory === "women") return "avg_women_rating";
    return "avg_open_rating";
}

function displayData(data) {
    const tbody = document.getElementById("club-table");
    tbody.innerHTML = "";
    const ratingKey = getRatingKey();

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No clubs found.</td></tr>';
        return;
    }

    data.slice(0, 100).forEach((club, i) => {
        const rating = club[ratingKey];
        const ratingDisplay = rating !== null ? rating : "—";
        const top100 = (club.top100_men || 0) + (club.top100_women || 0);
        const winPct = club.overall_win_pct !== null ? club.overall_win_pct + "%" : "—";

        let row = `<tr>`;
        row += `<td class="small-column">${i + 1}</td>`;
        row += `<td><a href="/pages/club.html?club=${encodeURIComponent(club.club)}" class="player-link">${club.club}</a></td>`;
        row += `<td>${club.total_players}</td>`;
        row += `<td>${ratingDisplay}</td>`;
        row += `<td class="mobile-hidden-col">${top100}</td>`;
        row += `<td class="mobile-hidden-col">${club.top10_total || 0}</td>`;
        row += `<td>${winPct}</td>`;
        row += `</tr>`;
        tbody.innerHTML += row;
    });
}

function getFilteredSorted() {
    const filter = document.getElementById("clubFilter").value.toLowerCase();
    const ratingKey = getRatingKey();

    let filtered = clubData.filter(c =>
        !filter || c.club.toLowerCase().includes(filter)
    );

    // Default sort by selected rating category
    filtered.sort((a, b) => (b[ratingKey] || 0) - (a[ratingKey] || 0));

    return filtered;
}

function filterTable() {
    displayData(getFilteredSorted());
}

function sortTable(colIndex) {
    const keys = ["_rank", "club", "total_players", getRatingKey(), "_top100", "top10_total", "overall_win_pct"];
    const key = keys[colIndex];

    sortDirections[colIndex] = !sortDirections[colIndex];
    const asc = sortDirections[colIndex];

    let filtered = getFilteredSorted();

    filtered.sort((a, b) => {
        let va, vb;
        if (key === "_rank") return 0; // already ranked
        if (key === "_top100") {
            va = (a.top100_men || 0) + (a.top100_women || 0);
            vb = (b.top100_men || 0) + (b.top100_women || 0);
        } else {
            va = a[key]; vb = b[key];
        }
        if (va === null || va === undefined) va = -Infinity;
        if (vb === null || vb === undefined) vb = -Infinity;
        if (typeof va === "string") return va.localeCompare(vb) * (asc ? 1 : -1);
        return (va - vb) * (asc ? 1 : -1);
    });

    displayData(filtered);
}

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
        document.getElementById("clubFilter").value = "";
        filterTable();
        toggleCount = 0;
        button.textContent = "Filter";
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    loadInclude("header-placeholder", "/components/header.html");
    setupNavCloseOnOutsideClick();
    setHeaderTitle("Club Rankings");

    try {
        const res = await fetch("/src/data/json/club_stats.json");
        clubData = await res.json();
    } catch {
        document.getElementById("club-table").innerHTML =
            '<tr><td colspan="7" class="empty-state">Could not load club data.</td></tr>';
        return;
    }

    displayData(getFilteredSorted());

    // Category selector
    const sel = document.getElementById("sortCategory");
    sel.addEventListener("change", () => {
        currentCategory = sel.value;
        sortDirections = {};
        filterTable();
    });
    setTimeout(() => convertAllSelectsToCustomDropdowns(), 0);
});
