/**
 * League page logic - generates round-robin schedules, computes standings,
 * and renders the league view with fixtures and standings.
 */

let leagueData = null;
let currentDivision = null;
let currentView = "standings";
let lastCompletedRoundIdx = -1;

/**
 * Generate a round-robin schedule using the circle method.
 */
function generateRoundRobin(teamNames) {
    const teams = [...teamNames];
    if (teams.length % 2 !== 0) teams.push(null);
    const n = teams.length;
    const rounds = [];

    for (let round = 0; round < n - 1; round++) {
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

/**
 * Merge completed results into the generated schedule
 */
function mergeResults(schedule, results) {
    for (const result of results) {
        const roundIndex = result.round - 1;
        if (roundIndex >= 0 && roundIndex < schedule.length) {
            const match = schedule[roundIndex].find(
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

/**
 * Compute team standings from the schedule
 */
function computeStandings(schedule, teamNames) {
    const stats = {};
    for (const name of teamNames) {
        stats[name] = { name, played: 0, won: 0, lost: 0, points: 0, mf: 0, ma: 0 };
    }

    for (const round of schedule) {
        for (const match of round) {
            if (!match.completed) continue;
            const home = stats[match.home];
            const away = stats[match.away];
            if (!home || !away) continue;

            home.played++;
            away.played++;
            home.mf += match.home_score;
            home.ma += match.away_score;
            away.mf += match.away_score;
            away.ma += match.home_score;

            if (match.home_score > match.away_score) {
                home.won++;
                home.points += 2;
                away.lost++;
            } else {
                away.won++;
                away.points += 2;
                home.lost++;
            }
        }
    }

    return Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if ((b.mf - b.ma) !== (a.mf - a.ma)) return (b.mf - b.ma) - (a.mf - a.ma);
        return b.mf - a.mf;
    });
}

/**
 * Compute individual player standings from the schedule.
 */
function computePlayerStandings(schedule, teams) {
    const playerStats = {};
    const teamMap = {};

    for (const team of teams) {
        teamMap[team.name] = team;
        for (const player of team.players) {
            playerStats[team.name + "|" + player] = {
                name: player,
                team: team.name,
                played: 0,
                won: 0,
                lost: 0
            };
        }
    }

    let fixtureIdx = 0;
    for (const round of schedule) {
        for (const match of round) {
            if (!match.completed) { fixtureIdx++; continue; }

            const homeTeam = teamMap[match.home];
            const awayTeam = teamMap[match.away];
            if (!homeTeam || !awayTeam) { fixtureIdx++; continue; }

            const totalRubbers = match.home_score + match.away_score;
            const hPlayers = homeTeam.players;
            const aPlayers = awayTeam.players;

            for (let r = 0; r < totalRubbers; r++) {
                const hp = hPlayers[(fixtureIdx + r) % hPlayers.length];
                const ap = aPlayers[(fixtureIdx + r) % aPlayers.length];
                const hKey = match.home + "|" + hp;
                const aKey = match.away + "|" + ap;

                playerStats[hKey].played++;
                playerStats[aKey].played++;

                if (r < match.home_score) {
                    playerStats[hKey].won++;
                    playerStats[aKey].lost++;
                } else {
                    playerStats[aKey].won++;
                    playerStats[hKey].lost++;
                }
            }
            fixtureIdx++;
        }
    }

    return Object.values(playerStats)
        .filter(p => p.played > 0)
        .sort((a, b) => {
            const aPct = a.won / a.played;
            const bPct = b.won / b.played;
            if (bPct !== aPct) return bPct - aPct;
            if (b.won !== a.won) return b.won - a.won;
            return b.played - a.played;
        });
}

function formatDate(dateStr) {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * Render the team standings table
 */
function renderTeamStandings(standings) {
    const container = document.getElementById("team-standings");
    if (!container) return;

    let html = `<table class="league-table">
        <thead><tr>
            <th>#</th>
            <th class="text-left">Team</th>
            <th>P</th><th>W</th><th>L</th>
            <th>MF</th><th>MA</th><th>Pts</th>
        </tr></thead><tbody>`;

    standings.forEach((team, i) => {
        html += `<tr>
            <td>${i + 1}</td>
            <td class="text-left league-team-name">${team.name}</td>
            <td>${team.played}</td><td>${team.won}</td><td>${team.lost}</td>
            <td>${team.mf}</td><td>${team.ma}</td>
            <td><strong>${team.points}</strong></td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

/**
 * Render individual player standings table
 */
function renderPlayerStandings(players) {
    const container = document.getElementById("player-standings");
    if (!container) return;

    let html = `<table class="league-table">
        <thead><tr>
            <th>#</th>
            <th class="text-left">Player</th>
            <th class="text-left mobile-hidden-col">Team</th>
            <th>P</th><th>W</th><th>L</th><th>Win%</th>
        </tr></thead><tbody>`;

    players.forEach((p, i) => {
        const winPct = p.played > 0 ? Math.round((p.won / p.played) * 100) : 0;
        html += `<tr>
            <td>${i + 1}</td>
            <td class="text-left league-team-name">${p.name}</td>
            <td class="text-left league-team-name mobile-hidden-col">${p.team}</td>
            <td>${p.played}</td><td>${p.won}</td><td>${p.lost}</td>
            <td><strong>${winPct}%</strong></td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

/**
 * Render the fixtures view
 */
function renderFixtures(schedule, roundDates) {
    const container = document.getElementById("fixtures-container");
    if (!container) return -1;

    let html = "";
    let lastCompleted = -1;

    schedule.forEach((round, index) => {
        const roundNum = index + 1;
        const date = roundDates[index] || null;
        if (round.some(m => m.completed)) lastCompleted = index;

        html += `<div class="fixture-round" id="fixture-round-${index}">
            <div class="fixture-round-header">
                <span class="fixture-round-title">Round ${roundNum}</span>
                <span class="fixture-round-date">${formatDate(date)}</span>
            </div>
            <div class="fixture-round-matches">`;

        for (const match of round) {
            const homeWon = match.completed && match.home_score > match.away_score;
            const awayWon = match.completed && match.away_score > match.home_score;

            html += `<div class="fixture-card ${match.completed ? "completed" : "upcoming"}">
                <div class="fixture-team ${homeWon ? "winner" : ""}">${match.home}</div>`;

            if (match.completed) {
                html += `<div class="fixture-score">
                    <span class="${homeWon ? "score-winner" : ""}">${match.home_score}</span>
                    <span class="score-separator">-</span>
                    <span class="${awayWon ? "score-winner" : ""}">${match.away_score}</span>
                </div>`;
            } else {
                html += `<div class="fixture-vs">vs</div>`;
            }

            html += `<div class="fixture-team ${awayWon ? "winner" : ""}">${match.away}</div>
            </div>`;
        }

        html += `</div></div>`;
    });

    container.innerHTML = html;
    return lastCompleted;
}

function scrollToLatestFixture(idx) {
    if (idx < 0) return;
    const el = document.getElementById("fixture-round-" + idx);
    if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
}

/**
 * Render team rosters
 */
function renderRosters(division) {
    const container = document.getElementById("rosters-container");
    if (!container) return;

    let html = '<div class="rosters-grid">';
    for (const team of division.teams) {
        html += `<div class="roster-card">
            <h3 class="roster-team-name">${team.name}</h3>
            <ul class="roster-player-list">`;
        for (const player of team.players) {
            html += `<li>${player}</li>`;
        }
        html += `</ul></div>`;
    }
    html += "</div>";
    container.innerHTML = html;
}

/**
 * Switch main view
 */
function switchView(view) {
    currentView = view;
    document.querySelectorAll("#viewToggles button").forEach(btn => {
        btn.classList.toggle("active-toggle", btn.dataset.view === view);
    });
    document.getElementById("standings-container").classList.toggle("hidden", view !== "standings");
    document.getElementById("fixtures-container").classList.toggle("hidden", view !== "fixtures");
    document.getElementById("rosters-container").classList.toggle("hidden", view !== "rosters");

    if (view === "fixtures") {
        scrollToLatestFixture(lastCompletedRoundIdx);
    }
}

/**
 * Switch standings sub-view (team / player)
 */
function switchStandingsSub(sub) {
    document.querySelectorAll("#standings-sub-toggles button").forEach(btn => {
        btn.classList.toggle("active-toggle", btn.dataset.sub === sub);
    });
    document.getElementById("team-standings").classList.toggle("hidden", sub !== "team");
    document.getElementById("player-standings").classList.toggle("hidden", sub !== "player");
}

/**
 * Short label for division buttons
 */
function getDivisionLabel(div) {
    if (div.id === "womens") return "Women's";
    const match = div.id.match(/mens_([a-z])/);
    if (match) return match[1].toUpperCase();
    return div.name;
}

/**
 * Load and render a division
 */
function loadDivision(divisionId) {
    const division = leagueData.divisions.find(d => d.id === divisionId);
    if (!division) return;
    currentDivision = division;

    document.querySelectorAll(".league-division-btn").forEach(btn => {
        btn.classList.toggle("active-toggle", btn.dataset.division === divisionId);
    });

    const teamNames = division.teams.map(t => t.name);
    const schedule = generateRoundRobin(teamNames);
    mergeResults(schedule, division.results);

    renderTeamStandings(computeStandings(schedule, teamNames));
    renderPlayerStandings(computePlayerStandings(schedule, division.teams));
    lastCompletedRoundIdx = renderFixtures(schedule, leagueData.round_dates);
    renderRosters(division);

    if (currentView === "fixtures") {
        scrollToLatestFixture(lastCompletedRoundIdx);
    }
}

/**
 * Setup info modal
 */
function setupInfoModal() {
    const btn = document.getElementById("infoBtn");
    const modal = document.getElementById("infoModal");
    const closeBtn = document.getElementById("infoModalClose");

    btn.addEventListener("click", () => modal.classList.add("active"));
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("active");
    });
}

/**
 * Initialize the league page
 */
async function initLeague() {
    const params = new URLSearchParams(window.location.search);
    const leagueId = params.get("league");
    if (!leagueId) {
        document.querySelector("main").innerHTML =
            '<p class="empty-state">No league specified.</p>';
        return;
    }

    try {
        const response = await fetch(`/src/data/league/${leagueId}.json`);
        if (!response.ok) throw new Error("League not found");
        leagueData = await response.json();
    } catch (err) {
        document.querySelector("main").innerHTML =
            '<p class="empty-state">Could not load league data.</p>';
        return;
    }

    setHeaderTitle(leagueData.league_name + " " + leagueData.season);

    // Division buttons
    const btnContainer = document.getElementById("divisionButtons");
    for (const div of leagueData.divisions) {
        const btn = document.createElement("button");
        btn.className = "league-division-btn";
        btn.dataset.division = div.id;
        btn.textContent = getDivisionLabel(div);
        btn.addEventListener("click", () => loadDivision(div.id));
        btnContainer.appendChild(btn);
    }

    // Main view toggles
    document.querySelectorAll("#viewToggles button").forEach(btn => {
        btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    // Standings sub-toggles
    document.querySelectorAll("#standings-sub-toggles button").forEach(btn => {
        btn.addEventListener("click", () => switchStandingsSub(btn.dataset.sub));
    });

    setupInfoModal();

    if (leagueData.divisions.length > 0) {
        loadDivision(leagueData.divisions[0].id);
    }
    switchView("standings");
}

document.addEventListener("DOMContentLoaded", function () {
    loadInclude("header-placeholder", "/components/header.html");
    setupNavCloseOnOutsideClick();
    initLeague();
});
