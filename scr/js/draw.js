// draw.js

async function loadGroups() {
    const response = await fetch("scr/data/json/draw.json");
    const data = await response.json();
    renderGroups(data);
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
function renderKnockouts() {
  const container = document.getElementById("contentContainer");
  container.innerHTML = `
    <div id="bracket-wrapper">
      <div class="bracket" id="bracket">
        <svg id="lines"></svg>
      </div>
    </div>
  `;
const wrapper = document.getElementById("bracket-wrapper");
const bracket = document.getElementById("bracket");
const svg = document.getElementById("lines");
console.log("Rendering Knockouts")
  const leftGaps = [10, 80, 220, 10]; 
  const rightGaps = [10, 220, 80, 10]; 

  // Scroll the viewport horizontally to center
  wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;

  // Load JSON data
  fetch("/scr/data/tournament/maties_open_25/mens.json")
    .then(res => res.json())
    .then(knockout => {
      // Create rounds for left side
      knockout.left.forEach((round, r) => {
        const col = document.createElement("div");
        col.className = "round";
        col.style.setProperty("--match-gap", `${leftGaps[r]}px`);
        round.forEach(match => col.appendChild(makeMatch(match)));
        bracket.insertBefore(col, svg);
      });

      // Final in middle
      const finalCol = document.createElement("div");
      finalCol.className = "round";
      knockout.final.forEach(match => {
        const final = makeMatch(match);
        final.classList.add("final");
        finalCol.appendChild(final);
      });
      bracket.appendChild(finalCol);

      // Create rounds for right side
      knockout.right.slice().reverse().forEach((round, r) => {
        const col = document.createElement("div");
        col.className = "round";
        col.style.setProperty("--match-gap", `${rightGaps[r]}px`);
        round.forEach(match => col.appendChild(makeMatch(match)));
        bracket.appendChild(col);
      });

      // Draw lines once matches are placed
      drawLines();
    });
function makeMatch(players) {
  const div = document.createElement("div");
  div.className = "match";

  players.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "player";

    // Player name as a link
    const link = document.createElement("a");
    link.href = `player.html?name=${encodeURIComponent(p.name)}`;
    link.textContent = p.name;
    link.className = "player-link";
    row.appendChild(link);

    // Score number if it exists
    if (p.score !== undefined && p.score !== null) {
      const score = document.createElement("span");
      score.textContent = ` (${p.score})`;
      score.style.color = "maroon";
      row.appendChild(score);
    }

    div.appendChild(row);

    // Add a line after each player except the last
    if (index < players.length - 1) {
      const line = document.createElement("div");
      line.className = "player-divider";
      div.appendChild(line);
    }
  });

  return div;
}


function drawLines() {
  svg.innerHTML = "";
  const rounds = [...document.querySelectorAll(".round")];
  const finalIndex = Math.floor(rounds.length / 2);

  for (let i = 0; i < rounds.length - 1; i++) {
    const matchesA = rounds[i].querySelectorAll(".match");
    const matchesB = rounds[i + 1].querySelectorAll(".match");

    if (i < finalIndex) {
      matchesA.forEach((m, j) => {
        const target = matchesB[Math.floor(j / 2)];
        if (target) connectLeft(m, target);
      });
    } else if (i >= finalIndex) {
      matchesB.forEach((m, j) => {
        const target = matchesA[Math.floor(j / 2)];
        if (target) connectRight(m, target);
      });
    }
  }
}

function connectLeft(a, b) {
  const bracketRect = bracket.getBoundingClientRect();
  const aRect = a.getBoundingClientRect();
  const bRect = b.getBoundingClientRect();

  const x1 = aRect.right - bracketRect.left;
  const y1 = aRect.top - bracketRect.top + aRect.height / 2;
  const x2 = bRect.left - bracketRect.left;
  const y2 = bRect.top - bracketRect.top + bRect.height / 2;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`);
  path.setAttribute("stroke", "white");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", "2");
  svg.appendChild(path);
}

function connectRight(a, b) {
  const bracketRect = bracket.getBoundingClientRect();
  const aRect = a.getBoundingClientRect();
  const bRect = b.getBoundingClientRect();

  const x1 = aRect.left - bracketRect.left;
  const y1 = aRect.top - bracketRect.top + aRect.height / 2;
  const x2 = bRect.right - bracketRect.left;
  const y2 = bRect.top - bracketRect.top + bRect.height / 2;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`);
  path.setAttribute("stroke", "white");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", "2");
  svg.appendChild(path);
}
function adjustBracketWidth() {
  const bracket = document.getElementById("bracket");
  if (!bracket) return;

  const rounds = bracket.querySelectorAll(".round").length;
  const roundWidth = 223; // width in px of a single round (including margin/gap)
  const gap = 15;          // extra space between rounds

  // Total width = rounds * (round width + gap)
  const totalWidth = 2000;
  console.log(rounds)

  bracket.style.minWidth = `${totalWidth}px`;
}

// Call after rendering the bracket
adjustBracketWidth();


window.addEventListener("resize", drawLines);
window.addEventListener("resize", adjustBracketWidth);

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

