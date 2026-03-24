/**
 * Club Profile page - shows detailed stats for a single club
 * with member listing.
 */

let clubStats = null;
let allMembers = [];
let memberFilter = "all";
let memberSortDir = {};

const JUNIOR_CATS = ["bu19", "bu15", "bu13", "bu11", "gu19", "gu15", "gu13", "gu11"];
const ALL_CATS = [
    { id: "open", label: "Open" }, { id: "men", label: "Men's" }, { id: "women", label: "Women's" },
    { id: "mo40", label: "Men's 40+" }, { id: "mo50", label: "Men's 50+" }, { id: "mo60", label: "Men's 60+" },
    { id: "bu19", label: "Boys U19" }, { id: "gu19", label: "Girls U19" },
    { id: "bu15", label: "Boys U15" }, { id: "gu15", label: "Girls U15" },
    { id: "bu13", label: "Boys U13" }, { id: "gu13", label: "Girls U13" },
    { id: "bu11", label: "Boys U11" }, { id: "gu11", label: "Girls U11" }
];

function playerLink(name) {
    return `<a href="/pages/player.html?name=${encodeURIComponent(name)}" class="player-link">${name}</a>`;
}

function renderClubCard(club) {
    const card = document.getElementById("club-card");
    const divider = '<div style="border-top:1px solid var(--color-primary); margin:14px auto; width:60%;"></div>';

    // Headline stats - prefer open rating
    const avgRating = club.avg_open_rating || club.avg_men_rating || club.avg_women_rating;
    const ratingLabel = club.avg_open_rating ? "Avg Open Rating" : club.avg_men_rating ? "Avg Men's Rating" : "Avg Women's Rating";

    const stats = [];
    stats.push(`<div style="text-align:center;"><div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${club.total_players}</div><div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase;">Players</div></div>`);
    if (avgRating) stats.push(`<div style="text-align:center;"><div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${avgRating}</div><div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase;">${ratingLabel}</div></div>`);
    if (club.overall_win_pct !== null) stats.push(`<div style="text-align:center;"><div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${club.overall_win_pct}%</div><div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase;">Win Rate</div></div>`);
    if (club.top10_total) stats.push(`<div style="text-align:center;"><div style="font-size:clamp(20px,4vw,28px); font-weight:bold;">${club.top10_total}</div><div style="font-size:clamp(10px,2vw,12px); opacity:0.45; text-transform:uppercase;">Top 10s</div></div>`);

    const statsHtml = `<div style="display:flex; justify-content:center; gap:clamp(14px,4vw,28px);">${stats.join("")}</div>`;

    // Composition bar
    const barHtml = `<div style="display:flex; height:8px; border-radius:4px; overflow:hidden; margin-top:14px; width:80%; margin-left:auto; margin-right:auto;">
        <div style="width:${club.pct_men}%; background:#8B0000;" title="Men ${club.pct_men}%"></div>
        <div style="width:${club.pct_women}%; background:#cc4444;" title="Women ${club.pct_women}%"></div>
        <div style="width:${club.pct_juniors}%; background:#666;" title="Juniors ${club.pct_juniors}%"></div>
    </div>
    <div style="display:flex; justify-content:center; gap:16px; margin-top:6px; font-size:clamp(10px,2vw,12px); opacity:0.5;">
        <span style="color:#8B0000;">Men ${club.pct_men}%</span>
        <span style="color:#cc4444;">Women ${club.pct_women}%</span>
        <span style="color:#666;">Juniors ${club.pct_juniors}%</span>
    </div>`;

    // Detail lines
    const details = [];
    if (club.highest_rated_player) {
        details.push(`Highest Rated: ${playerLink(club.highest_rated_player.name)} <strong>(${club.highest_rated_player.rating})</strong>`);
    }
    if (club.highest_rated_woman) {
        details.push(`Top Woman: ${playerLink(club.highest_rated_woman.name)} <strong>(${club.highest_rated_woman.rating})</strong>`);
    }
    if (club.top_clutch_player) {
        details.push(`Best Clutch: ${playerLink(club.top_clutch_player.name)} <strong>(${club.top_clutch_player.clutch_rate}%)</strong>`);
    }
    const detailHtml = details.length > 0
        ? `<div style="margin-top:14px; font-size:clamp(11px,2vw,14px); opacity:0.65; line-height:1.8;">${details.join("<br>")}</div>`
        : "";

    // Top 100 callout
    let top100Html = "";
    if (club.top100_men || club.top100_women) {
        const parts = [];
        if (club.top100_men) parts.push(`<strong>${club.top100_men}</strong> in Men's Top 100`);
        if (club.top100_women) parts.push(`<strong>${club.top100_women}</strong> in Women's Top 100`);
        top100Html = `<div style="text-align:center; margin-top:14px; font-size:clamp(11px,2vw,14px); opacity:0.65;">${parts.join(" &bull; ")}</div>`;
    }

    // Top 10 breakdown
    let top10Html = "";
    const top10Entries = ALL_CATS.filter(c => club[`top10_${c.id}`] > 0);
    if (top10Entries.length > 0) {
        top10Html = `<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:14px;">
            ${top10Entries.map(c => `<div style="border:1px solid var(--color-border); border-radius:8px; padding:6px 12px; text-align:center;">
                <div style="font-size:clamp(16px,2.5vw,20px); font-weight:bold; opacity:0.8;">${club[`top10_${c.id}`]}</div>
                <div style="font-size:clamp(9px,1.8vw,11px); opacity:0.4;">${c.label} Top 10</div>
            </div>`).join("")}
        </div>`;
    }

    card.innerHTML = `
        ${statsHtml}
        ${divider}
        ${barHtml}
        ${detailHtml ? divider + detailHtml : ""}
        ${top100Html ? divider + top100Html : ""}
        ${top10Html ? divider + top10Html : ""}
    `;
}

// ── Members table ──

function renderMembers() {
    const tbody = document.getElementById("members-table");
    tbody.innerHTML = "";

    let filtered = allMembers;
    if (memberFilter === "men") filtered = allMembers.filter(m => m.gender === "Male" && !m.isJunior);
    else if (memberFilter === "women") filtered = allMembers.filter(m => m.gender === "Female" && !m.isJunior);
    else if (memberFilter === "juniors") filtered = allMembers.filter(m => m.isJunior);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No members in this category.</td></tr>';
        return;
    }

    filtered.forEach((m, i) => {
        const rating = m.rating || "—";
        const played = m.played || "—";
        const winPct = m.win_per ? m.win_per + "%" : "—";
        tbody.innerHTML += `<tr>
            <td class="small-column">${i + 1}</td>
            <td>${playerLink(m.name)}</td>
            <td>${rating}</td>
            <td class="mobile-hidden-col">${played}</td>
            <td class="mobile-hidden-col">${winPct}</td>
        </tr>`;
    });
}

function filterMembers(filter) {
    memberFilter = filter;
    document.querySelectorAll("#memberToggles button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    renderMembers();
}

function sortMembers(colIndex) {
    const keys = ["_rank", "name", "rating", "played", "win_per"];
    const key = keys[colIndex];
    memberSortDir[colIndex] = !memberSortDir[colIndex];
    const asc = memberSortDir[colIndex];

    allMembers.sort((a, b) => {
        if (key === "_rank") return 0;
        let va = a[key], vb = b[key];
        if (va === null || va === undefined) va = typeof vb === "string" ? "zzz" : -Infinity;
        if (vb === null || vb === undefined) vb = typeof va === "string" ? "zzz" : -Infinity;
        if (typeof va === "string") return va.localeCompare(vb) * (asc ? 1 : -1);
        return (va - vb) * (asc ? 1 : -1);
    });
    renderMembers();
}

// ── Init ──

document.addEventListener("DOMContentLoaded", async function () {
    loadInclude("header-placeholder", "/components/header.html");
    setupNavCloseOnOutsideClick();

    const params = new URLSearchParams(window.location.search);
    const clubName = params.get("club");
    if (!clubName) {
        document.querySelector("main").innerHTML = '<p class="empty-state">No club specified.</p>';
        return;
    }

    setHeaderTitle(clubName);

    // Load club stats
    try {
        const statsRes = await fetch("/src/data/json/club_stats.json");
        const allStats = await statsRes.json();
        clubStats = allStats.find(c => c.club === clubName);
    } catch { /* handled below */ }

    if (!clubStats) {
        document.getElementById("club-card").innerHTML = '<p class="empty-state">Club not found.</p>';
        return;
    }

    renderClubCard(clubStats);

    // Load all data sources
    const [allPlayersRes, menRes, womenRes, openRes] = await Promise.all([
        fetch("/src/data/json/all_players.json").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/src/data/json/men_ratings.json").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/src/data/json/women_ratings.json").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/src/data/json/open_ratings.json").then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    // Tag juniors
    const juniorNames = new Set();
    for (const catId of JUNIOR_CATS) {
        try {
            const res = await fetch(`/src/data/json/${catId}_ratings.json`);
            if (res.ok) {
                const data = await res.json();
                data.filter(p => p.club === clubName).forEach(p => juniorNames.add(p.name));
            }
        } catch { /* skip */ }
    }

    // Index ratings by name (prefer open rating for display)
    const openByName = {};
    openRes.filter(p => p.club === clubName).forEach(p => { openByName[p.name] = p; });
    const menByName = {};
    menRes.filter(p => p.club === clubName).forEach(p => { menByName[p.name] = p; });
    const womenByName = {};
    womenRes.filter(p => p.club === clubName).forEach(p => { womenByName[p.name] = p; });

    // Build member list from all_players (every member, rated or not)
    const clubPlayers = allPlayersRes.filter(p => p.club === clubName);
    for (const p of clubPlayers) {
        const ratingSource = openByName[p.name] || menByName[p.name] || womenByName[p.name];
        allMembers.push({
            name: p.name,
            gender: p.gender || "Unknown",
            rating: ratingSource ? ratingSource.rating : null,
            played: ratingSource ? ratingSource.played : null,
            win_per: ratingSource ? ratingSource.win_per : null,
            isJunior: juniorNames.has(p.name)
        });
    }

    // Sort: rated players first (by rating desc), then unrated alphabetically
    allMembers.sort((a, b) => {
        if (a.rating && !b.rating) return -1;
        if (!a.rating && b.rating) return 1;
        if (a.rating && b.rating) return b.rating - a.rating;
        return a.name.localeCompare(b.name);
    });

    renderMembers();
});
