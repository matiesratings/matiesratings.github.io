const wrapper = document.getElementById("bracket-wrapper");
const bracket = document.getElementById("bracket");
const svg = document.getElementById("lines");

const leftGaps = [10, 80, 220, 10]; 
const rightGaps = [10, 220, 80, 10]; 

// Scroll the viewport horizontally to center
wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;

// Load JSON data
fetch("scr/data/tournament/maties_open_25/mens.json")
  .then(res => res.json())
  .then(knockout => {
    // Create rounds for left side
    knockout.left.forEach((round, r) => {
      const col = document.createElement("div");
      col.className = "round";
      col.style.setProperty("--match-gap", `${leftGaps[r]}px`);
      round.forEach(match => {
        col.appendChild(makeMatch(match));
      });
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
      round.forEach(match => {
        col.appendChild(makeMatch(match));
      });
      bracket.appendChild(col);
    });

    // Draw lines once matches are placed
    drawLines();
  });

// --- Helpers ---

function makeMatch(players) {
  const div = document.createElement("div");
  div.className = "match";
  players.forEach(p => {
    const row = document.createElement("div");
    row.className = "player";
    const name = document.createElement("span");
    name.textContent = p;
    const score = document.createElement("span");
    score.className = "score";
    score.textContent = "";
    row.appendChild(name);
    row.appendChild(score);
    div.appendChild(row);
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

window.addEventListener("resize", drawLines);
