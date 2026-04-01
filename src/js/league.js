/**
 * League page logic - handles both team leagues and individual leagues.
 * Generates round-robin (or double round-robin) schedules, computes standings,
 * and renders fixtures, standings, and rosters.
 */

let leagueData = null;
let currentDivision = null;
let currentView = "standings";
let lastCompletedRoundIdx = -1;
let isIndividual = false;
let ratingsMap = {}; // name → rating

/** Helper: wrap a name in a player link */
function playerLink(name) {
    const encoded = encodeURIComponent(name);
    return `<a href="/pages/player.html?name=${encoded}" class="player-link">${name}</a>`;
}

// ── Schedule generation ──

function generateRoundRobin(names) {
    const teams = [...names];
    if (teams.length % 2 !== 0) teams.push(null);
    const n = teams.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
        const matches = [];
        for (let i = 0; i < n / 2; i++) {
            const home = teams[i];
            const away = teams[n - 1 - i];
            if (home !== null && away !== null) {
                matches.push({ home, away, completed: false });
            }
        }
        rounds.push(matches);
        const last = teams.pop();
        teams.splice(1, 0, last);
    }
    return rounds;
}

function generateDoubleRoundRobin(names) {
    const first = generateRoundRobin(names);
    const second = first.map(round =>
        round.map(m => ({ home: m.away, away: m.home, completed: false }))
    );
    return [...first, ...second];
}

function mergeResults(schedule, results) {
    for (const result of results) {
        const ri = result.round - 1;
        if (ri >= 0 && ri < schedule.length) {
            const match = schedule[ri].find(
                m => m.home === result.home && m.away === result.away
            );
            if (match) {
                match.home_score = result.home_score;
                match.away_score = result.away_score;
                match.completed = true;
            }
        }
    }
}

// ── Standings computation ──

function computeStandings(schedule, names) {
    const stats = {};
    for (const name of names) {
        stats[name] = { name, played: 0, won: 0, lost: 0, points: 0, mf: 0, ma: 0, gf: 0, ga: 0 };
    }
    for (const round of schedule) {
        for (const m of round) {
            if (!m.completed) continue;
            const h = stats[m.home], a = stats[m.away];
            if (!h || !a) continue;
            h.played++; a.played++;
            h.mf += m.home_score; h.ma += m.away_score;
            a.mf += m.away_score; a.ma += m.home_score;
            if (m.home_score > m.away_score) { h.won++; h.points += 2; a.lost++; }
            else { a.won++; a.points += 2; h.lost++; }
            // Accumulate individual game scores from matches (rubbers)
            if (m.matches) {
                for (const rm of m.matches) {
                    h.gf += (rm.home_games || 0);
                    h.ga += (rm.away_games || 0);
                    a.gf += (rm.away_games || 0);
                    a.ga += (rm.home_games || 0);
                }
            }
        }
    }
    // Sort: Pts → MF-MA → GF-GA → rating (looked up from global ratingsData)
    return Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if ((b.mf - b.ma) !== (a.mf - a.ma)) return (b.mf - b.ma) - (a.mf - a.ma);
        if ((b.gf - b.ga) !== (a.gf - a.ga)) return (b.gf - b.ga) - (a.gf - a.ga);
        // Rating tiebreaker
        const ar = ratingsMap[a.name] || 0;
        const br = ratingsMap[b.name] || 0;
        if (br !== ar) return br - ar;
        return a.name.localeCompare(b.name);
    });
}

function computePlayerStandings(schedule, teams) {
    const stats = {};
    const teamMap = {};
    for (const team of teams) {
        teamMap[team.name] = team;
        for (const p of team.players) {
            stats[team.name + "|" + p] = { name: p, team: team.name, played: 0, won: 0, lost: 0 };
        }
    }
    let fi = 0;
    for (const round of schedule) {
        for (const m of round) {
            if (!m.completed) { fi++; continue; }
            const ht = teamMap[m.home], at = teamMap[m.away];
            if (!ht || !at) { fi++; continue; }
            const total = m.home_score + m.away_score;
            for (let r = 0; r < total; r++) {
                const hp = ht.players[(fi + r) % ht.players.length];
                const ap = at.players[(fi + r) % at.players.length];
                const hk = m.home + "|" + hp, ak = m.away + "|" + ap;
                stats[hk].played++; stats[ak].played++;
                if (r < m.home_score) { stats[hk].won++; stats[ak].lost++; }
                else { stats[ak].won++; stats[hk].lost++; }
            }
            fi++;
        }
    }
    return Object.values(stats).sort((a, b) => {
        // Players with matches first, then by win%, then by name
        if (a.played !== b.played && (a.played === 0 || b.played === 0)) return b.played - a.played;
        if (a.played > 0 && b.played > 0) {
            const ap = a.won / a.played, bp = b.won / b.played;
            if (bp !== ap) return bp - ap;
            if (b.won !== a.won) return b.won - a.won;
        }
        return a.name.localeCompare(b.name);
    });
}

// ── Ratings lookup ──

async function loadRatings() {
    try {
        const [menRes, womenRes] = await Promise.all([
            fetch("/src/data/json/men_ratings.json"),
            fetch("/src/data/json/women_ratings.json")
        ]);
        const men = menRes.ok ? await menRes.json() : [];
        const women = womenRes.ok ? await womenRes.json() : [];
        for (const p of [...men, ...women]) {
            ratingsMap[p.name] = p.rating;
        }
    } catch { /* ratings are optional */ }
}

function getRating(name) {
    return ratingsMap[name] || null;
}

// ── Rendering ──

function formatDate(dateStr) {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

function renderTeamStandings(standings) {
    const el = document.getElementById("team-standings");
    if (!el) return;
    const label = isIndividual ? "Player" : "Team";
    const forLabel = isIndividual ? "GF" : "MF";
    const againstLabel = isIndividual ? "GA" : "MA";
    const showRating = isIndividual;
    let html = `<table class="league-table"><thead><tr>
        <th>#</th><th class="text-left">${label}</th>
        ${showRating ? '<th>Rating</th>' : ''}
        <th>P</th><th>W</th><th>L</th>
        <th class="mobile-hidden-col">${forLabel}</th><th class="mobile-hidden-col">${againstLabel}</th><th>Pts</th>
    </tr></thead><tbody>`;
    standings.forEach((t, i) => {
        const nameCell = isIndividual ? playerLink(t.name) : t.name;
        const rating = showRating ? getRating(t.name) : null;
        const ratingCell = showRating
            ? `<td>${rating !== null ? rating : '<span style="opacity:0.3">—</span>'}</td>`
            : '';
        html += `<tr><td>${i + 1}</td>
            <td class="text-left league-team-name">${nameCell}</td>
            ${ratingCell}
            <td>${t.played}</td><td>${t.won}</td><td>${t.lost}</td>
            <td class="mobile-hidden-col">${t.mf}</td><td class="mobile-hidden-col">${t.ma}</td>
            <td><strong>${t.points}</strong></td></tr>`;
    });
    el.innerHTML = html + `</tbody></table>`;
}

function renderPlayerStandings(players) {
    const el = document.getElementById("player-standings");
    if (!el) return;
    let html = `<table class="league-table"><thead><tr>
        <th>#</th><th class="text-left">Player</th>
        <th class="text-left mobile-hidden-col">Team</th>
        <th>P</th><th>W</th><th>L</th><th>Win%</th>
    </tr></thead><tbody>`;
    players.forEach((p, i) => {
        const pct = p.played > 0 ? Math.round((p.won / p.played) * 100) : 0;
        html += `<tr><td>${i + 1}</td>
            <td class="text-left league-team-name">${playerLink(p.name)}</td>
            <td class="text-left league-team-name mobile-hidden-col">${p.team}</td>
            <td>${p.played}</td><td>${p.won}</td><td>${p.lost}</td>
            <td><strong>${pct}%</strong></td></tr>`;
    });
    el.innerHTML = html + `</tbody></table>`;
}

function renderFixtures(schedule, roundDates, finalsDate) {
    const el = document.getElementById("fixtures-container");
    if (!el) return -1;
    let html = "", last = -1;
    schedule.forEach((round, idx) => {
        if (round.some(m => m.completed)) last = idx;
        const date = roundDates[idx] || null;
        html += `<div class="fixture-round" id="fixture-round-${idx}">
            <div class="fixture-round-header">
                <span class="fixture-round-title">Round ${idx + 1}</span>
                <span class="fixture-round-date">${formatDate(date)}</span>
            </div><div class="fixture-round-matches">`;
        for (const m of round) {
            const hw = m.completed && m.home_score > m.away_score;
            const aw = m.completed && m.away_score > m.home_score;
            const homeName = isIndividual ? playerLink(m.home) : m.home;
            const awayName = isIndividual ? playerLink(m.away) : m.away;
            html += `<div class="fixture-card ${m.completed ? "completed" : "upcoming"}">
                <div class="fixture-team ${hw ? "winner" : ""}">${homeName}</div>`;
            if (m.completed) {
                html += `<div class="fixture-score">
                    <span class="${hw ? "score-winner" : ""}">${m.home_score}</span>
                    <span class="score-separator">-</span>
                    <span class="${aw ? "score-winner" : ""}">${m.away_score}</span></div>`;
            } else {
                html += `<div class="fixture-vs">vs</div>`;
            }
            html += `<div class="fixture-team ${aw ? "winner" : ""}">${awayName}</div></div>`;
        }
        html += `</div></div>`;
    });

    // Finals block
    if (finalsDate) {
        html += `<div class="fixture-round" id="fixture-round-finals">
            <div class="fixture-round-header">
                <span class="fixture-round-title">Finals</span>
                <span class="fixture-round-date">${formatDate(finalsDate)}</span>
            </div><div class="fixture-round-matches">
                <div class="fixture-card upcoming">
                    <div class="fixture-team" style="opacity:0.5;">TBD</div>
                    <div class="fixture-vs">vs</div>
                    <div class="fixture-team" style="opacity:0.5;">TBD</div>
                </div>
            </div></div>`;
    }

    el.innerHTML = html;
    return last;
}

function scrollToLatestFixture(idx) {
    if (idx < 0) return;
    const el = document.getElementById("fixture-round-" + idx);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
}

function renderRosters(division) {
    const el = document.getElementById("rosters-container");
    if (!el) return;
    let html = '<div class="rosters-grid">';
    for (const team of division.teams) {
        html += `<div class="roster-card"><h3 class="roster-team-name">${team.name}</h3>
            <ul class="roster-player-list">`;
        for (const p of team.players) html += `<li>${playerLink(p)}</li>`;
        html += `</ul></div>`;
    }
    el.innerHTML = html + "</div>";
}

// ── Sponsor ──

function renderSponsor() {
    const bar = document.getElementById("sponsor-bar");
    if (!bar || !leagueData.sponsor) return;
    const s = leagueData.sponsor;
    bar.classList.remove("hidden");
    bar.innerHTML = `<a href="${s.url}" target="_blank" rel="noopener" class="sponsor-link">
        <span class="sponsor-label">Sponsored by</span>
        <img src="${s.banner}" alt="${s.name}" class="sponsor-banner">
    </a>`;

    // Replace the left header logo with the sponsor logo
    if (s.logo) {
        const swapLogo = () => {
            const leftLogo = document.querySelector(".header-logo-container > img.header-logo");
            if (leftLogo) {
                const link = document.createElement("a");
                link.href = s.url;
                link.target = "_blank";
                link.rel = "noopener";
                link.ariaLabel = s.name;
                const img = document.createElement("img");
                img.src = s.logo;
                img.alt = s.name;
                img.className = "header-logo header-logo-circular";
                link.appendChild(img);
                leftLogo.parentNode.replaceChild(link, leftLogo);
            } else {
                setTimeout(swapLogo, 50);
            }
        };
        swapLogo();
    }

    // On mobile, move the sponsor banner into the header (between navbar and logos)
    const moveBannerOnMobile = () => {
        const navbar = document.querySelector(".navbar");
        const logoContainer = document.querySelector(".header-logo-container");
        if (!navbar || !logoContainer) {
            setTimeout(moveBannerOnMobile, 50);
            return;
        }

        const mobileBar = bar.cloneNode(true);
        mobileBar.id = "sponsor-bar-mobile";
        mobileBar.className = "sponsor-bar-mobile";
        logoContainer.parentNode.insertBefore(mobileBar, logoContainer);

        // Show/hide based on screen width
        const toggle = () => {
            const mobile = window.innerWidth <= 768;
            bar.classList.toggle("hidden", mobile);
            mobileBar.classList.toggle("hidden", !mobile);
        };
        toggle();
        window.addEventListener("resize", toggle);
    };
    moveBannerOnMobile();
}

// ── Info modal ──

function renderInfoModal() {
    const body = document.getElementById("infoModalBody");
    if (!body || !leagueData.info) return;
    body.innerHTML = leagueData.info.map(p => `<p>${p}</p>`).join("");
}

function setupInfoModal() {
    const btn = document.getElementById("infoBtn");
    const modal = document.getElementById("infoModal");
    const close = document.getElementById("infoModalClose");
    btn.addEventListener("click", () => modal.classList.add("active"));
    close.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
}

// ── View switching ──

function switchView(view) {
    currentView = view;
    document.querySelectorAll("#viewToggles button").forEach(btn => {
        btn.classList.toggle("active-toggle", btn.dataset.view === view);
    });
    document.getElementById("standings-container").classList.toggle("hidden", view !== "standings");
    document.getElementById("fixtures-container").classList.toggle("hidden", view !== "fixtures");
    document.getElementById("rosters-container").classList.toggle("hidden", view !== "rosters");
    if (view === "fixtures") scrollToLatestFixture(lastCompletedRoundIdx);
}

function switchStandingsSub(sub) {
    document.querySelectorAll("#standings-sub-toggles button").forEach(btn => {
        btn.classList.toggle("active-toggle", btn.dataset.sub === sub);
    });
    document.getElementById("team-standings").classList.toggle("hidden", sub !== "team");
    document.getElementById("player-standings").classList.toggle("hidden", sub !== "player");
}

// ── Division handling ──

let currentGender = null; // "mens", "womens", or null (for CL-style flat list)

function getDivisionLabel(div) {
    if (div.id === "womens") return "Women's";
    if (div.id === "premier") return "Premier";
    if (div.id === "first") return "1st";
    if (div.id === "second") return "2nd";
    const mw = div.id.match(/^(?:mens|womens)_([a-z])$/);
    if (mw) return mw[1].toUpperCase();
    return div.name;
}

function hasGenderDivisions() {
    return leagueData.divisions.some(d => d.id.startsWith("mens_") || d.id.startsWith("womens_"));
}

function getGenders() {
    const genders = [];
    if (leagueData.divisions.some(d => d.id.startsWith("mens_"))) genders.push("mens");
    if (leagueData.divisions.some(d => d.id.startsWith("womens_"))) genders.push("womens");
    return genders;
}

function getDivisionsForGender(gender) {
    return leagueData.divisions.filter(d => d.id.startsWith(gender + "_"));
}

function switchGender(gender) {
    currentGender = gender;
    document.querySelectorAll(".league-gender-btn").forEach(btn => {
        btn.classList.toggle("active-toggle", btn.dataset.gender === gender);
    });
    renderDivisionButtons();
    // Auto-select first division in this gender
    const divs = getDivisionsForGender(gender);
    if (divs.length > 0) loadDivision(divs[0].id);
}

function renderDivisionButtons() {
    const container = document.getElementById("divisionButtons");
    container.innerHTML = "";
    const divs = currentGender ? getDivisionsForGender(currentGender) : leagueData.divisions;
    for (const div of divs) {
        const btn = document.createElement("button");
        btn.className = "league-division-btn";
        btn.dataset.division = div.id;
        btn.textContent = getDivisionLabel(div);
        btn.addEventListener("click", () => loadDivision(div.id));
        container.appendChild(btn);
    }
}

function loadDivision(divisionId) {
    const division = leagueData.divisions.find(d => d.id === divisionId);
    if (!division) return;
    currentDivision = division;

    document.querySelectorAll(".league-division-btn").forEach(btn => {
        btn.classList.toggle("active-toggle", btn.dataset.division === divisionId);
    });

    if (isIndividual && division.players && !division.teams) {
        division.teams = division.players.map(p => ({ name: p, players: [p] }));
    }

    const names = division.teams.map(t => t.name);
    const schedule = leagueData.double_round_robin
        ? generateDoubleRoundRobin(names)
        : generateRoundRobin(names);
    mergeResults(schedule, division.results);

    const roundDates = division.round_dates || leagueData.round_dates || [];
    const finalsDate = division.finals_date || null;
    renderTeamStandings(computeStandings(schedule, names));

    if (!isIndividual) {
        renderPlayerStandings(computePlayerStandings(schedule, division.teams));
    }

    lastCompletedRoundIdx = renderFixtures(schedule, roundDates, finalsDate);
    renderRosters(division);

    if (currentView === "fixtures") scrollToLatestFixture(lastCompletedRoundIdx);
}

// ── Init ──

async function initLeague() {
    const params = new URLSearchParams(window.location.search);
    const leagueId = params.get("league");
    if (!leagueId) {
        document.querySelector("main").innerHTML = '<p class="empty-state">No league specified.</p>';
        return;
    }

    try {
        const res = await fetch(`/src/data/league/${leagueId}.json`);
        if (!res.ok) throw new Error();
        leagueData = await res.json();
    } catch {
        document.querySelector("main").innerHTML = '<p class="empty-state">Could not load league data.</p>';
        return;
    }

    isIndividual = leagueData.type === "individual";

    setHeaderTitle(leagueData.league_name + " " + leagueData.season);
    await loadRatings();
    renderSponsor();
    renderInfoModal();

    if (isIndividual) {
        document.querySelector('[data-view="rosters"]').style.display = "none";
        document.getElementById("standings-sub-toggles").style.display = "none";
    }

    // Hide Teams tab if no player data in any division
    const hasPlayerData = leagueData.divisions.some(d =>
        d.teams && d.teams.some(t => t.players && t.players.length > 0)
    );
    if (!hasPlayerData && !isIndividual) {
        document.querySelector('[data-view="rosters"]').style.display = "none";
        document.getElementById("standings-sub-toggles").style.display = "none";
    }

    // Build gender + division buttons (or flat list for CL-style leagues)
    const genderContainer = document.getElementById("genderButtons");
    if (hasGenderDivisions()) {
        const genders = getGenders();
        for (const g of genders) {
            const btn = document.createElement("button");
            btn.className = "league-division-btn league-gender-btn";
            btn.dataset.gender = g;
            btn.textContent = g === "mens" ? "Men's" : "Women's";
            btn.addEventListener("click", () => switchGender(g));
            genderContainer.appendChild(btn);
        }
        // Auto-select first gender
        switchGender(genders[0]);
    } else {
        // Flat list (Champions League style)
        genderContainer.style.display = "none";
        renderDivisionButtons();
        if (leagueData.divisions.length > 0) loadDivision(leagueData.divisions[0].id);
    }

    document.querySelectorAll("#viewToggles button").forEach(btn => {
        btn.addEventListener("click", () => switchView(btn.dataset.view));
    });
    document.querySelectorAll("#standings-sub-toggles button").forEach(btn => {
        btn.addEventListener("click", () => switchStandingsSub(btn.dataset.sub));
    });

    setupInfoModal();
    switchView("standings");
}

document.addEventListener("DOMContentLoaded", function () {
    loadInclude("header-placeholder", "/components/header.html");
    setupNavCloseOnOutsideClick();
    initLeague();
});
