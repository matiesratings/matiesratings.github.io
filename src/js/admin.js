/**
 * League Admin - add results, preview standings, download updated JSON.
 */

// ── Auth (simple client-side gate) ──
const CREDENTIALS = { user: "admin", pass: "maties2026" };

// ── State ──
let leagueData = null;
let leagueId = null;
let currentSchedule = null;
let currentDivision = null;

// ── Round-robin generation (same as league.js) ──

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
            if (home !== null && away !== null)
                matches.push({ home, away, completed: false });
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

function computeStandings(schedule, names) {
    const stats = {};
    for (const name of names) {
        stats[name] = { name, played: 0, won: 0, lost: 0, points: 0, mf: 0, ma: 0 };
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
        }
    }
    return Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if ((b.mf - b.ma) !== (a.mf - a.ma)) return (b.mf - b.ma) - (a.mf - a.ma);
        return b.mf - a.mf;
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

// ── UI helpers ──

function show(id) { document.getElementById(id).classList.remove("hidden"); }
function hide(id) { document.getElementById(id).classList.add("hidden"); }

// ── Login ──

function setupLogin() {
    const btn = document.getElementById("loginBtn");
    const passInput = document.getElementById("loginPass");

    function tryLogin() {
        const user = document.getElementById("loginUser").value.trim();
        const pass = passInput.value;
        if (user === CREDENTIALS.user && pass === CREDENTIALS.pass) {
            hide("login-gate");
            show("admin-panel");
        } else {
            show("loginError");
        }
    }

    btn.addEventListener("click", tryLogin);
    passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
}

// ── League loading ──

async function loadLeague(id) {
    if (!id) { leagueData = null; leagueId = null; return; }
    try {
        const res = await fetch(`/src/data/league/${id}.json`);
        leagueData = await res.json();
        leagueId = id;
    } catch {
        leagueData = null;
        leagueId = null;
    }
}

function populateDivisions() {
    const sel = document.getElementById("divisionSelect");
    sel.innerHTML = '<option value="">-- Select --</option>';
    if (!leagueData) { sel.disabled = true; return; }
    for (const div of leagueData.divisions) {
        const opt = document.createElement("option");
        opt.value = div.id;
        opt.textContent = div.name;
        sel.appendChild(opt);
    }
    sel.disabled = false;
}

function getNames(division) {
    const isIndividual = leagueData.type === "individual";
    if (isIndividual && division.players) return division.players;
    return division.teams.map(t => t.name);
}

function buildSchedule(division) {
    const names = getNames(division);
    const schedule = leagueData.double_round_robin
        ? generateDoubleRoundRobin(names)
        : generateRoundRobin(names);
    mergeResults(schedule, division.results);
    return schedule;
}

function populateRounds() {
    const sel = document.getElementById("roundSelect");
    sel.innerHTML = '<option value="">-- Select --</option>';

    const divId = document.getElementById("divisionSelect").value;
    if (!divId || !leagueData) { sel.disabled = true; return; }

    currentDivision = leagueData.divisions.find(d => d.id === divId);
    if (!currentDivision) { sel.disabled = true; return; }

    currentSchedule = buildSchedule(currentDivision);
    const roundDates = currentDivision.round_dates || leagueData.round_dates || [];

    for (let i = 0; i < currentSchedule.length; i++) {
        const round = currentSchedule[i];
        const allDone = round.every(m => m.completed);
        const someDone = round.some(m => m.completed);
        const date = roundDates[i] ? ` (${formatDate(roundDates[i])})` : "";
        const status = allDone ? " - Complete" : someDone ? " - Partial" : "";
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `Round ${i + 1}${date}${status}`;
        sel.appendChild(opt);
    }
    sel.disabled = false;
}

// ── Match input form ──

function showMatchInputs() {
    const roundIdx = parseInt(document.getElementById("roundSelect").value);
    if (isNaN(roundIdx) || !currentSchedule) {
        hide("fixtures-form");
        return;
    }

    const round = currentSchedule[roundIdx];
    const roundDates = currentDivision.round_dates || leagueData.round_dates || [];
    const date = roundDates[roundIdx] ? formatDate(roundDates[roundIdx]) : "";
    document.getElementById("fixtures-form-title").textContent =
        `Round ${roundIdx + 1} Results${date ? " — " + date : ""}`;

    let html = "";
    round.forEach((m, i) => {
        const hasScore = m.completed;
        html += `<div class="admin-match" data-index="${i}">
            <span class="admin-match-home">${m.home}</span>
            <input type="number" class="admin-score" id="home-score-${i}"
                min="0" max="7" value="${hasScore ? m.home_score : ""}" placeholder="-">
            <span class="admin-match-vs">-</span>
            <input type="number" class="admin-score" id="away-score-${i}"
                min="0" max="7" value="${hasScore ? m.away_score : ""}" placeholder="-">
            <span class="admin-match-away">${m.away}</span>
        </div>`;
    });

    document.getElementById("match-inputs").innerHTML = html;
    show("fixtures-form");
    showExistingResults();
}

// ── Save results ──

function saveResults() {
    const roundIdx = parseInt(document.getElementById("roundSelect").value);
    if (isNaN(roundIdx) || !currentSchedule || !currentDivision) return;

    const round = currentSchedule[roundIdx];
    let added = 0;

    round.forEach((m, i) => {
        const homeVal = document.getElementById(`home-score-${i}`).value;
        const awayVal = document.getElementById(`away-score-${i}`).value;
        if (homeVal === "" || awayVal === "") return;

        const hs = parseInt(homeVal);
        const as = parseInt(awayVal);
        if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) return;

        // Check if result already exists for this round/match
        const existing = currentDivision.results.find(
            r => r.round === roundIdx + 1 && r.home === m.home && r.away === m.away
        );

        if (existing) {
            existing.home_score = hs;
            existing.away_score = as;
        } else {
            currentDivision.results.push({
                round: roundIdx + 1,
                home: m.home,
                away: m.away,
                home_score: hs,
                away_score: as
            });
        }

        m.home_score = hs;
        m.away_score = as;
        m.completed = true;
        added++;
    });

    if (added === 0) return;

    // Rebuild schedule and show standings
    currentSchedule = buildSchedule(currentDivision);
    const names = getNames(currentDivision);
    const standings = computeStandings(currentSchedule, names);
    renderAdminStandings(standings);
    show("standings-preview");
    show("publish-section");

    document.getElementById("json-path").textContent =
        `src/data/league/${leagueId}.json`;

    // Refresh round selector status
    populateRounds();
    document.getElementById("roundSelect").value = roundIdx;
    showMatchInputs();
}

// ── Standings preview ──

function renderAdminStandings(standings) {
    const isIndividual = leagueData.type === "individual";
    const label = isIndividual ? "Player" : "Team";
    const fl = isIndividual ? "GF" : "MF";
    const al = isIndividual ? "GA" : "MA";

    let html = `<table class="league-table"><thead><tr>
        <th>#</th><th class="text-left">${label}</th>
        <th>P</th><th>W</th><th>L</th>
        <th>${fl}</th><th>${al}</th><th>Pts</th>
    </tr></thead><tbody>`;
    standings.forEach((t, i) => {
        html += `<tr><td>${i + 1}</td>
            <td class="text-left league-team-name">${t.name}</td>
            <td>${t.played}</td><td>${t.won}</td><td>${t.lost}</td>
            <td>${t.mf}</td><td>${t.ma}</td>
            <td><strong>${t.points}</strong></td></tr>`;
    });
    document.getElementById("admin-standings").innerHTML = html + `</tbody></table>`;
}

// ── Existing results list ──

function showExistingResults() {
    if (!currentDivision) { hide("existing-results"); return; }
    const results = currentDivision.results;
    if (results.length === 0) { hide("existing-results"); return; }

    const sorted = [...results].sort((a, b) => a.round - b.round);
    let html = `<table class="league-table"><thead><tr>
        <th>R</th><th class="text-left">Home</th>
        <th>Score</th><th class="text-left">Away</th>
    </tr></thead><tbody>`;
    for (const r of sorted) {
        const hw = r.home_score > r.away_score;
        const aw = r.away_score > r.home_score;
        html += `<tr>
            <td>${r.round}</td>
            <td class="text-left league-team-name${hw ? " winner" : ""}">${r.home}</td>
            <td>${r.home_score} - ${r.away_score}</td>
            <td class="text-left league-team-name${aw ? " winner" : ""}">${r.away}</td>
        </tr>`;
    }
    document.getElementById("results-list").innerHTML = html + `</tbody></table>`;
    show("existing-results");
}

// ── GitHub API publish ──

const GITHUB_REPO = "matiesratings/matiesratings.github.io";

function getToken() {
    return localStorage.getItem("github_pat") || "";
}

function saveToken() {
    const token = document.getElementById("githubToken").value.trim();
    if (!token) return;
    localStorage.setItem("github_pat", token);
    hide("token-setup");
    showPublishStatus("Token saved.", "success");
}

function showPublishStatus(msg, type) {
    const el = document.getElementById("publish-status");
    el.textContent = msg;
    el.style.color = type === "success" ? "#4caf50" : type === "error" ? "#ff6b6b" : "#ffb74d";
    el.classList.remove("hidden");
}

async function publishToGitHub() {
    const token = getToken();
    if (!token) {
        show("token-setup");
        showPublishStatus("Enter a GitHub token first.", "warn");
        return;
    }

    const filePath = `src/data/league/${leagueId}.json`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
    const content = getUpdatedJSON();
    const encoded = btoa(unescape(encodeURIComponent(content)));

    const btn = document.getElementById("publishBtn");
    btn.disabled = true;
    btn.textContent = "Publishing...";

    try {
        // Get current file SHA
        const getRes = await fetch(apiUrl, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" }
        });
        if (!getRes.ok) {
            if (getRes.status === 401 || getRes.status === 403) {
                localStorage.removeItem("github_pat");
                show("token-setup");
                throw new Error("Invalid or expired token. Please enter a new one.");
            }
            throw new Error(`GitHub API error: ${getRes.status}`);
        }
        const fileData = await getRes.json();

        // Commit updated file
        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Update ${leagueData.league_name} results`,
                content: encoded,
                sha: fileData.sha
            })
        });

        if (!putRes.ok) {
            const err = await putRes.json();
            throw new Error(err.message || `Commit failed: ${putRes.status}`);
        }

        showPublishStatus("Published! Site will update in ~1 minute.", "success");
    } catch (err) {
        showPublishStatus(err.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Publish to Site";
    }
}

// ── Download / Copy (fallback) ──

function getUpdatedJSON() {
    return JSON.stringify(leagueData, null, 2);
}

function downloadJSON() {
    const blob = new Blob([getUpdatedJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${leagueId}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function copyJSON() {
    navigator.clipboard.writeText(getUpdatedJSON()).then(() => {
        const btn = document.getElementById("copyBtn");
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = orig, 2000);
    });
}

// ── Event wiring ──

function setupEvents() {
    document.getElementById("leagueSelect").addEventListener("change", async (e) => {
        await loadLeague(e.target.value);
        populateDivisions();
        document.getElementById("roundSelect").innerHTML = '<option value="">-- Select division first --</option>';
        document.getElementById("roundSelect").disabled = true;
        hide("fixtures-form");
        hide("standings-preview");
        hide("publish-section");
        hide("existing-results");
    });

    document.getElementById("divisionSelect").addEventListener("change", () => {
        populateRounds();
        hide("fixtures-form");
        hide("standings-preview");
        hide("publish-section");

        // Show existing results for division
        const divId = document.getElementById("divisionSelect").value;
        if (divId && leagueData) {
            currentDivision = leagueData.divisions.find(d => d.id === divId);
            currentSchedule = buildSchedule(currentDivision);
            showExistingResults();
        }
    });

    document.getElementById("roundSelect").addEventListener("change", showMatchInputs);
    document.getElementById("saveResultsBtn").addEventListener("click", saveResults);
    document.getElementById("publishBtn").addEventListener("click", publishToGitHub);
    document.getElementById("saveTokenBtn").addEventListener("click", saveToken);
    document.getElementById("downloadBtn").addEventListener("click", downloadJSON);
    document.getElementById("copyBtn").addEventListener("click", copyJSON);
}

// ── Init ──

document.addEventListener("DOMContentLoaded", function () {
    loadInclude("header-placeholder", "/components/header.html");
    setupNavCloseOnOutsideClick();
    setHeaderTitle("League Admin");
    setupLogin();
    setupEvents();
});
