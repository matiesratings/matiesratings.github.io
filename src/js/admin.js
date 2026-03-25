/**
 * League Admin - results, rosters, info editing, league creation.
 * Supports per-league auth + master admin.
 */

// ── Auth ──
const MASTER = { user: "admin", pass: "maties2026" };
const KNOWN_LEAGUES = ["champions_league", "maties_res_league"];
const GITHUB_REPO = "matiesratings/matiesratings.github.io";

let isMaster = false;
let accessibleLeagues = []; // league IDs this user can access

// ── State ──
let leagueData = null;
let leagueId = null;
let currentSchedule = null;
let currentDivision = null;
let isTeamLeague = false;
let resPlayers = null;
const NUM_MATCHES = 5;

// ── Round-robin ──

function generateRoundRobin(names) {
    const teams = [...names];
    if (teams.length % 2 !== 0) teams.push(null);
    const n = teams.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
        const matches = [];
        for (let i = 0; i < n / 2; i++) {
            const h = teams[i], a = teams[n - 1 - i];
            if (h !== null && a !== null) matches.push({ home: h, away: a, completed: false });
        }
        rounds.push(matches);
        const last = teams.pop();
        teams.splice(1, 0, last);
    }
    return rounds;
}

function generateDoubleRoundRobin(names) {
    const first = generateRoundRobin(names);
    return [...first, ...first.map(rd => rd.map(m => ({ home: m.away, away: m.home, completed: false })))];
}

function mergeResults(schedule, results) {
    for (const r of results) {
        const ri = r.round - 1;
        if (ri >= 0 && ri < schedule.length) {
            const m = schedule[ri].find(x => x.home === r.home && x.away === r.away);
            if (m) { m.home_score = r.home_score; m.away_score = r.away_score; m.completed = true; if (r.matches) m.matches = r.matches; }
        }
    }
}

function computeStandings(schedule, names) {
    const s = {}; names.forEach(n => { s[n] = { name: n, played: 0, won: 0, lost: 0, points: 0, mf: 0, ma: 0 }; });
    for (const rd of schedule) for (const m of rd) {
        if (!m.completed) continue;
        const h = s[m.home], a = s[m.away]; if (!h || !a) continue;
        h.played++; a.played++; h.mf += m.home_score; h.ma += m.away_score; a.mf += m.away_score; a.ma += m.home_score;
        if (m.home_score > m.away_score) { h.won++; h.points += 2; a.lost++; } else { a.won++; a.points += 2; h.lost++; }
    }
    return Object.values(s).sort((a, b) => (b.points - a.points) || ((b.mf - b.ma) - (a.mf - a.ma)) || (b.mf - a.mf));
}

function formatDate(ds) { if (!ds) return "TBD"; return new Date(ds + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" }); }

// ── UI helpers ──
function show(id) { document.getElementById(id)?.classList.remove("hidden"); }
function hide(id) { document.getElementById(id)?.classList.add("hidden"); }

// ── Login ──

async function tryLogin() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;

    // Check master
    if (user === MASTER.user && pass === MASTER.pass) {
        isMaster = true;
        accessibleLeagues = [...KNOWN_LEAGUES];
        showAdmin();
        return;
    }

    // Check per-league auth
    accessibleLeagues = [];
    for (const lid of KNOWN_LEAGUES) {
        try {
            const res = await fetch(`/src/data/league/${lid}.json`);
            if (!res.ok) continue;
            const data = await res.json();
            if (data.auth && data.auth.user === user && data.auth.pass === pass) {
                accessibleLeagues.push(lid);
            }
        } catch { /* skip */ }
    }

    if (accessibleLeagues.length > 0) {
        isMaster = false;
        showAdmin();
    } else {
        show("loginError");
    }
}

function showAdmin() {
    hide("login-gate");
    show("admin-panel");

    // Populate league selector with accessible leagues only
    const sel = document.getElementById("leagueSelect");
    sel.innerHTML = '<option value="">-- Select --</option>';
    for (const lid of accessibleLeagues) {
        const opt = document.createElement("option");
        opt.value = lid;
        opt.textContent = lid.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        sel.appendChild(opt);
    }

    // Show create + edit buttons for master only
    if (isMaster) {
        document.getElementById("createLeagueBtn").classList.remove("hidden");
    }
}

// ── Player lookup ──

function teamToResidence(name) { const m = name.match(/^(.+?)\s*\d*$/); return m ? m[1].trim() : name; }

function getPlayersForTeam(teamName) {
    if (!resPlayers) return [];
    const data = resPlayers[teamToResidence(teamName)];
    if (!data) return [];
    return currentDivision?.id?.startsWith("womens") ? (data.female || []) : (data.male || []);
}

// ── League loading ──

async function loadLeague(id) {
    if (!id) { leagueData = null; leagueId = null; return; }
    try {
        const res = await fetch(`/src/data/league/${id}.json`);
        leagueData = await res.json();
        leagueId = id;
        isTeamLeague = leagueData.type !== "individual";
        if (isTeamLeague) {
            try { const r = await fetch("/src/data/league/res_league_players.json"); if (r.ok) resPlayers = await r.json(); } catch { resPlayers = null; }
        }
    } catch { leagueData = null; leagueId = null; }
}

function populateDivisions() {
    const sel = document.getElementById("divisionSelect");
    sel.innerHTML = '<option value="">-- Select --</option>';
    if (!leagueData) { sel.disabled = true; return; }
    for (const d of leagueData.divisions) {
        const o = document.createElement("option"); o.value = d.id; o.textContent = d.name; sel.appendChild(o);
    }
    sel.disabled = false;
}

function getNames(div) { return (leagueData.type === "individual" && div.players) ? div.players : div.teams.map(t => t.name); }

function buildSchedule(div) {
    const names = getNames(div);
    const sched = leagueData.double_round_robin ? generateDoubleRoundRobin(names) : generateRoundRobin(names);
    mergeResults(sched, div.results); return sched;
}

function populateRounds() {
    const sel = document.getElementById("roundSelect");
    sel.innerHTML = '<option value="">-- Select --</option>';
    const divId = document.getElementById("divisionSelect").value;
    if (!divId || !leagueData) { sel.disabled = true; return; }
    currentDivision = leagueData.divisions.find(d => d.id === divId);
    if (!currentDivision) { sel.disabled = true; return; }
    currentSchedule = buildSchedule(currentDivision);
    const dates = currentDivision.round_dates || leagueData.round_dates || [];
    currentSchedule.forEach((rd, i) => {
        const done = rd.every(m => m.completed); const partial = rd.some(m => m.completed);
        const dt = dates[i] ? ` (${formatDate(dates[i])})` : "";
        const o = document.createElement("option"); o.value = i;
        o.textContent = `Round ${i + 1}${dt}${done ? " - Complete" : partial ? " - Partial" : ""}`;
        sel.appendChild(o);
    });
    sel.disabled = false;
}

// ── Match input ──

function showMatchInputs() {
    const ri = parseInt(document.getElementById("roundSelect").value);
    if (isNaN(ri) || !currentSchedule) { hide("fixtures-form"); return; }
    const round = currentSchedule[ri];
    const dates = currentDivision.round_dates || leagueData.round_dates || [];
    const dt = dates[ri] ? formatDate(dates[ri]) : "";
    document.getElementById("fixtures-form-title").textContent = `Round ${ri + 1} Results${dt ? " — " + dt : ""}`;

    let html = "";
    if (isTeamLeague) {
        round.forEach((m, fi) => {
            const em = m.matches || [];
            html += `<div class="admin-fixture-block" data-fixture="${fi}">
                <div class="admin-fixture-header">
                    <span class="admin-match-home"><strong>${m.home}</strong></span>
                    <span class="admin-fixture-auto-score" id="auto-score-${fi}">${m.completed ? m.home_score : "?"} - ${m.completed ? m.away_score : "?"}</span>
                    <span class="admin-match-away"><strong>${m.away}</strong></span>
                </div>`;
            for (let mi = 0; mi < NUM_MATCHES; mi++) {
                const e = em[mi] || {};
                html += `<div class="admin-individual-match">
                    <div class="admin-player-input-wrap">
                        <input type="text" class="admin-player-input" id="hp-${fi}-${mi}" value="${e.home_player || ""}" placeholder="${m.home} player" autocomplete="off"
                            onfocus="showPlayerPopup(this,'${m.home}','home')" onblur="hidePlayerPopupDelay(this)">
                        <div class="admin-player-popup hidden" id="popup-hp-${fi}-${mi}"></div>
                    </div>
                    <input type="number" class="admin-score" id="hg-${fi}-${mi}" min="0" max="3" value="${e.home_games != null ? e.home_games : ""}" placeholder="-" onchange="recalcFixtureScore(${fi})">
                    <span class="admin-match-vs">-</span>
                    <input type="number" class="admin-score" id="ag-${fi}-${mi}" min="0" max="3" value="${e.away_games != null ? e.away_games : ""}" placeholder="-" onchange="recalcFixtureScore(${fi})">
                    <div class="admin-player-input-wrap">
                        <input type="text" class="admin-player-input" id="ap-${fi}-${mi}" value="${e.away_player || ""}" placeholder="${m.away} player" autocomplete="off"
                            onfocus="showPlayerPopup(this,'${m.away}','away')" onblur="hidePlayerPopupDelay(this)">
                        <div class="admin-player-popup hidden" id="popup-ap-${fi}-${mi}"></div>
                    </div>
                </div>`;
            }
            html += `</div>`;
        });
    } else {
        round.forEach((m, i) => {
            html += `<div class="admin-match"><span class="admin-match-home">${m.home}</span>
                <input type="number" class="admin-score" id="home-score-${i}" min="0" max="7" value="${m.completed ? m.home_score : ""}" placeholder="-">
                <span class="admin-match-vs">-</span>
                <input type="number" class="admin-score" id="away-score-${i}" min="0" max="7" value="${m.completed ? m.away_score : ""}" placeholder="-">
                <span class="admin-match-away">${m.away}</span></div>`;
        });
    }
    document.getElementById("match-inputs").innerHTML = html;
    show("fixtures-form"); showExistingResults();
}

// ── Player popup ──

function showPlayerPopup(input, teamName) {
    const players = getPlayersForTeam(teamName);
    if (!players.length) return;
    const popup = document.getElementById("popup-" + input.id);
    if (!popup) return;
    const render = (f) => {
        const list = f ? players.filter(p => p.toLowerCase().includes(f.toLowerCase())) : players;
        popup.innerHTML = list.slice(0, 30).map(p =>
            `<div class="admin-player-option" onmousedown="selectPlayer('${input.id}','${p.replace(/'/g, "\\'")}')">${p}</div>`
        ).join("");
    };
    render(input.value); popup.classList.remove("hidden");
    input.oninput = () => render(input.value);
}

function hidePlayerPopupDelay(input) { setTimeout(() => { const p = document.getElementById("popup-" + input.id); if (p) p.classList.add("hidden"); }, 200); }
function selectPlayer(id, name) { const i = document.getElementById(id); if (i) i.value = name; const p = document.getElementById("popup-" + id); if (p) p.classList.add("hidden"); }

function recalcFixtureScore(fi) {
    let hw = 0, aw = 0;
    for (let mi = 0; mi < NUM_MATCHES; mi++) {
        const hg = parseInt(document.getElementById(`hg-${fi}-${mi}`)?.value);
        const ag = parseInt(document.getElementById(`ag-${fi}-${mi}`)?.value);
        if (!isNaN(hg) && !isNaN(ag)) { if (hg > ag) hw++; else if (ag > hg) aw++; }
    }
    const el = document.getElementById(`auto-score-${fi}`);
    if (el) el.textContent = `${hw} - ${aw}`;
}

// ── Save results ──

function saveResults() {
    const ri = parseInt(document.getElementById("roundSelect").value);
    if (isNaN(ri) || !currentSchedule || !currentDivision) return;
    const round = currentSchedule[ri];
    let added = 0;

    if (isTeamLeague) {
        round.forEach((m, fi) => {
            const matches = []; let hw = 0, aw = 0, hasData = false;
            for (let mi = 0; mi < NUM_MATCHES; mi++) {
                const hp = document.getElementById(`hp-${fi}-${mi}`)?.value.trim() || "";
                const ap = document.getElementById(`ap-${fi}-${mi}`)?.value.trim() || "";
                const hg = parseInt(document.getElementById(`hg-${fi}-${mi}`)?.value);
                const ag = parseInt(document.getElementById(`ag-${fi}-${mi}`)?.value);
                if (isNaN(hg) || isNaN(ag)) continue;
                hasData = true;
                if (hg > ag) hw++; else if (ag > hg) aw++;
                matches.push({ home_player: hp, away_player: ap, home_games: hg, away_games: ag });
            }
            if (!hasData) return;
            const result = { round: ri + 1, home: m.home, away: m.away, home_score: hw, away_score: aw, matches };
            const ex = currentDivision.results.find(r => r.round === ri + 1 && r.home === m.home && r.away === m.away);
            if (ex) Object.assign(ex, result); else currentDivision.results.push(result);
            m.home_score = hw; m.away_score = aw; m.completed = true; m.matches = matches; added++;
        });
    } else {
        round.forEach((m, i) => {
            const hs = parseInt(document.getElementById(`home-score-${i}`)?.value);
            const as = parseInt(document.getElementById(`away-score-${i}`)?.value);
            if (isNaN(hs) || isNaN(as)) return;
            const ex = currentDivision.results.find(r => r.round === ri + 1 && r.home === m.home && r.away === m.away);
            if (ex) { ex.home_score = hs; ex.away_score = as; } else currentDivision.results.push({ round: ri + 1, home: m.home, away: m.away, home_score: hs, away_score: as });
            m.home_score = hs; m.away_score = as; m.completed = true; added++;
        });
    }
    if (!added) return;
    currentSchedule = buildSchedule(currentDivision);
    renderAdminStandings(computeStandings(currentSchedule, getNames(currentDivision)));
    show("standings-preview"); markDirty();
    populateRounds(); document.getElementById("roundSelect").value = ri; showMatchInputs();
}

// ── Roster management ──

function showRosterEditor() {
    if (!currentDivision) { hide("roster-section"); return; }

    const isIndiv = leagueData.type === "individual";
    const editor = document.getElementById("roster-editor");
    let html = "";

    if (isIndiv) {
        // Individual league: manage the players array directly
        const players = currentDivision.players || [];
        const divId = currentDivision.id;
        html += `<div class="admin-fixture-block">
            <div class="admin-fixture-header"><strong>${currentDivision.name}</strong>
                <span style="opacity:0.6; font-size:0.85em;">${players.length} players</span></div>
            <div style="padding:var(--spacing-sm);">
                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">`;
        players.forEach((p, pi) => {
            html += `<span class="admin-roster-tag">${p}<span class="admin-roster-remove" onclick="removeIndivPlayer(${pi})">&times;</span></span>`;
        });
        html += `</div>
                <div class="admin-player-input-wrap">
                    <input type="text" class="admin-player-input" id="roster-add-indiv" placeholder="Add player..." autocomplete="off"
                        onkeydown="if(event.key==='Enter'){addIndivPlayer();event.preventDefault();}">
                </div>
            </div></div>`;
    } else {
        // Team league: manage per-team rosters
        for (const team of currentDivision.teams) {
            const players = team.players || [];
            const tid = team.name.replace(/[^a-zA-Z0-9]/g, "_");
            html += `<div class="admin-fixture-block">
                <div class="admin-fixture-header"><strong>${team.name}</strong>
                    <span style="opacity:0.6; font-size:0.85em;">${players.length} players</span></div>
                <div style="padding:var(--spacing-sm);">
                    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">`;
            players.forEach((p, pi) => {
                html += `<span class="admin-roster-tag">${p}<span class="admin-roster-remove" onclick="removeFromRoster('${tid}',${pi})">&times;</span></span>`;
            });
            html += `</div>
                    <div class="admin-player-input-wrap">
                        <input type="text" class="admin-player-input" id="roster-add-${tid}" placeholder="Add player..." autocomplete="off"
                            onfocus="showRosterPopup('${tid}','${team.name}')" onblur="hidePlayerPopupDelay(document.getElementById('roster-add-${tid}'))"
                            onkeydown="if(event.key==='Enter'){addToRosterFromInput('${tid}');event.preventDefault();}">
                        <div class="admin-player-popup hidden" id="popup-roster-add-${tid}"></div>
                    </div>
                </div></div>`;
        }
    }
    editor.innerHTML = html;
    show("roster-section");
}

function showRosterPopup(tid, teamName) {
    const input = document.getElementById(`roster-add-${tid}`);
    const popup = document.getElementById(`popup-roster-add-${tid}`);
    if (!input || !popup) return;
    const pool = getPlayersForTeam(teamName);
    const team = currentDivision.teams.find(t => t.name.replace(/[^a-zA-Z0-9]/g, "_") === tid);
    const existing = new Set(team ? team.players : []);
    const render = (f) => {
        const avail = pool.filter(p => !existing.has(p) && (!f || p.toLowerCase().includes(f.toLowerCase())));
        popup.innerHTML = avail.slice(0, 30).map(p =>
            `<div class="admin-player-option" onmousedown="addToRoster('${tid}','${p.replace(/'/g, "\\'")}')">${p}</div>`
        ).join("") + (avail.length > 30 ? `<div class="admin-player-option" style="opacity:0.4;cursor:default;">... type to filter</div>` : "");
    };
    render(input.value); popup.classList.remove("hidden"); input.oninput = () => render(input.value);
}

function addToRoster(tid, name) {
    const team = currentDivision.teams.find(t => t.name.replace(/[^a-zA-Z0-9]/g, "_") === tid);
    if (!team || team.players.includes(name)) return;
    team.players.push(name); team.players.sort();
    showRosterEditor(); markDirty();
}

function addToRosterFromInput(tid) {
    const input = document.getElementById(`roster-add-${tid}`);
    if (input?.value.trim()) addToRoster(tid, input.value.trim());
}

function removeFromRoster(tid, idx) {
    const team = currentDivision.teams.find(t => t.name.replace(/[^a-zA-Z0-9]/g, "_") === tid);
    if (team) { team.players.splice(idx, 1); showRosterEditor(); markDirty(); }
}

function addIndivPlayer() {
    const input = document.getElementById("roster-add-indiv");
    if (!input?.value.trim() || !currentDivision.players) return;
    const name = input.value.trim();
    if (!currentDivision.players.includes(name)) {
        currentDivision.players.push(name); currentDivision.players.sort();
    }
    showRosterEditor(); markDirty();
}

function removeIndivPlayer(idx) {
    if (currentDivision.players) { currentDivision.players.splice(idx, 1); showRosterEditor(); markDirty(); }
}

// ── Info editor ──

function showInfoEditor() {
    if (!leagueData) { hide("info-editor-section"); return; }
    const info = leagueData.info || [];
    let html = "";
    info.forEach((line, i) => {
        html += `<div style="display:flex; gap:8px; margin-bottom:8px; align-items:start;">
            <textarea class="admin-info-textarea" id="info-line-${i}" rows="2">${line}</textarea>
            <button onclick="removeInfoLine(${i})" style="padding:4px 8px; font-size:18px; min-width:32px;">&times;</button>
        </div>`;
    });
    document.getElementById("info-editor").innerHTML = html;
    show("info-editor-section");
}

function saveInfoFromEditor() {
    if (!leagueData) return;
    const lines = [];
    let i = 0;
    while (true) {
        const el = document.getElementById(`info-line-${i}`);
        if (!el) break;
        const v = el.value.trim();
        if (v) lines.push(v);
        i++;
    }
    leagueData.info = lines;
    showInfoEditor(); markDirty();
}

function addInfoLine() {
    if (!leagueData.info) leagueData.info = [];
    leagueData.info.push("");
    showInfoEditor();
}

function removeInfoLine(idx) {
    if (leagueData.info) { leagueData.info.splice(idx, 1); showInfoEditor(); markDirty(); }
}

// ── Create new league ──

function showCreateModal() {
    document.getElementById("create-league-modal").classList.add("active");
}

function hideCreateModal() {
    document.getElementById("create-league-modal").classList.remove("active");
}

async function createNewLeague() {
    const name = document.getElementById("newLeagueName").value.trim();
    const season = document.getElementById("newLeagueSeason").value.trim();
    const type = document.getElementById("newLeagueType").value;
    const doubleRR = document.getElementById("newLeagueDoubleRR").checked;
    const user = document.getElementById("newLeagueUser").value.trim();
    const pass = document.getElementById("newLeaguePass").value.trim();

    if (!name || !season) { alert("Name and season required"); return; }

    const leagueId = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const newLeague = {
        league_name: name,
        season: season,
        auth: { user: user || leagueId, pass: pass || season },
        info: [],
        divisions: []
    };
    if (type === "individual") { newLeague.type = "individual"; }
    if (doubleRR) { newLeague.double_round_robin = true; }

    // Publish via GitHub API
    const token = getToken();
    if (!token) { show("token-setup"); hideCreateModal(); return; }

    const filePath = `src/data/league/${leagueId}.json`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(newLeague, null, 2))));

    try {
        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Create ${name} league`, content })
        });
        if (!putRes.ok) throw new Error(`Failed: ${putRes.status}`);

        KNOWN_LEAGUES.push(leagueId);
        accessibleLeagues.push(leagueId);

        // Add to league selector
        const sel = document.getElementById("leagueSelect");
        const opt = document.createElement("option"); opt.value = leagueId; opt.textContent = name; sel.appendChild(opt);

        hideCreateModal();
        alert(`League "${name}" created! Select it from the dropdown.`);
    } catch (err) {
        alert("Error creating league: " + err.message);
    }
}

// ── Standings preview ──

function renderAdminStandings(standings) {
    const isIndiv = leagueData.type === "individual";
    let html = `<table class="league-table"><thead><tr>
        <th>#</th><th class="text-left">${isIndiv ? "Player" : "Team"}</th>
        <th>P</th><th>W</th><th>L</th><th>${isIndiv ? "GF" : "MF"}</th><th>${isIndiv ? "GA" : "MA"}</th><th>Pts</th>
    </tr></thead><tbody>`;
    standings.forEach((t, i) => {
        html += `<tr><td>${i + 1}</td><td class="text-left league-team-name">${t.name}</td>
            <td>${t.played}</td><td>${t.won}</td><td>${t.lost}</td><td>${t.mf}</td><td>${t.ma}</td><td><strong>${t.points}</strong></td></tr>`;
    });
    document.getElementById("admin-standings").innerHTML = html + `</tbody></table>`;
}

function showExistingResults() {
    if (!currentDivision?.results?.length) { hide("existing-results"); return; }
    const sorted = [...currentDivision.results].sort((a, b) => a.round - b.round);
    let html = `<table class="league-table"><thead><tr><th>R</th><th class="text-left">Home</th><th>Score</th><th class="text-left">Away</th></tr></thead><tbody>`;
    for (const r of sorted) {
        html += `<tr><td>${r.round}</td><td class="text-left league-team-name${r.home_score > r.away_score ? " winner" : ""}">${r.home}</td>
            <td>${r.home_score} - ${r.away_score}</td>
            <td class="text-left league-team-name${r.away_score > r.home_score ? " winner" : ""}">${r.away}</td></tr>`;
    }
    document.getElementById("results-list").innerHTML = html + `</tbody></table>`;
    show("existing-results");
}

// ── Publish ──

function markDirty() {
    show("publish-section");
    document.getElementById("json-path").textContent = `src/data/league/${leagueId}.json`;
}

function getToken() { return localStorage.getItem("github_pat") || ""; }
function saveToken() { const t = document.getElementById("githubToken").value.trim(); if (t) { localStorage.setItem("github_pat", t); hide("token-setup"); showPublishStatus("Token saved.", "success"); } }
function showPublishStatus(msg, type) { const el = document.getElementById("publish-status"); el.textContent = msg; el.style.color = type === "success" ? "#4caf50" : type === "error" ? "#ff6b6b" : "#ffb74d"; el.classList.remove("hidden"); }

async function publishToGitHub() {
    const token = getToken();
    if (!token) { show("token-setup"); showPublishStatus("Enter a GitHub token first.", "warn"); return; }
    const filePath = `src/data/league/${leagueId}.json`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(leagueData, null, 2))));
    const btn = document.getElementById("publishBtn"); btn.disabled = true; btn.textContent = "Publishing...";
    try {
        const getRes = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } });
        if (!getRes.ok) { if (getRes.status === 401 || getRes.status === 403) { localStorage.removeItem("github_pat"); show("token-setup"); } throw new Error(`GitHub API error: ${getRes.status}`); }
        const fileData = await getRes.json();
        const putRes = await fetch(apiUrl, { method: "PUT", headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Update ${leagueData.league_name} results`, content, sha: fileData.sha }) });
        if (!putRes.ok) { const err = await putRes.json(); throw new Error(err.message || `Commit failed: ${putRes.status}`); }
        showPublishStatus("Published! Site will update in ~1 minute.", "success");
    } catch (err) { showPublishStatus(err.message, "error"); }
    finally { btn.disabled = false; btn.textContent = "Publish to Site"; }
}

function downloadJSON() { const b = new Blob([JSON.stringify(leagueData, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${leagueId}.json`; a.click(); URL.revokeObjectURL(u); }
function copyJSON() { navigator.clipboard.writeText(JSON.stringify(leagueData, null, 2)).then(() => { const b = document.getElementById("copyBtn"); const o = b.textContent; b.textContent = "Copied!"; setTimeout(() => b.textContent = o, 2000); }); }

// ── CSS for info textarea ──
const style = document.createElement("style");
style.textContent = `.admin-info-textarea { width:100%; padding:8px; background:var(--color-background); color:var(--color-text); border:1px solid var(--color-border); border-radius:var(--radius-sm); font-size:13px; font-family:inherit; resize:vertical; }`;
document.head.appendChild(style);

// ── Events ──

function setupEvents() {
    document.getElementById("loginBtn").addEventListener("click", tryLogin);
    document.getElementById("loginPass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });

    document.getElementById("leagueSelect").addEventListener("change", async (e) => {
        await loadLeague(e.target.value);
        populateDivisions();
        document.getElementById("roundSelect").innerHTML = '<option value="">-- Select division first --</option>';
        document.getElementById("roundSelect").disabled = true;
        hide("fixtures-form"); hide("standings-preview"); hide("publish-section"); hide("existing-results"); hide("roster-section"); hide("info-editor-section");
        if (leagueData) document.getElementById("editInfoBtn").classList.remove("hidden");
        else document.getElementById("editInfoBtn").classList.add("hidden");
    });

    document.getElementById("divisionSelect").addEventListener("change", () => {
        populateRounds();
        hide("fixtures-form"); hide("standings-preview"); hide("publish-section");
        const divId = document.getElementById("divisionSelect").value;
        if (divId && leagueData) {
            currentDivision = leagueData.divisions.find(d => d.id === divId);
            currentSchedule = buildSchedule(currentDivision);
            showExistingResults(); showRosterEditor();
        } else { hide("roster-section"); }
    });

    document.getElementById("roundSelect").addEventListener("change", showMatchInputs);
    document.getElementById("saveResultsBtn").addEventListener("click", saveResults);
    document.getElementById("publishBtn").addEventListener("click", publishToGitHub);
    document.getElementById("saveTokenBtn").addEventListener("click", saveToken);
    document.getElementById("downloadBtn").addEventListener("click", downloadJSON);
    document.getElementById("copyBtn").addEventListener("click", copyJSON);
    document.getElementById("createLeagueBtn").addEventListener("click", showCreateModal);
    document.getElementById("closeCreateModal").addEventListener("click", hideCreateModal);
    document.getElementById("confirmCreateLeague").addEventListener("click", createNewLeague);
    document.getElementById("editInfoBtn").addEventListener("click", showInfoEditor);
    document.getElementById("saveInfoBtn").addEventListener("click", saveInfoFromEditor);
    document.getElementById("addInfoLineBtn").addEventListener("click", addInfoLine);
}

// ── Init ──
document.addEventListener("DOMContentLoaded", function () {
    loadInclude("header-placeholder", "/components/header.html");
    setupNavCloseOnOutsideClick();
    setHeaderTitle("League Admin");
    setupEvents();
});
