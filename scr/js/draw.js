// draw.js

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

          const a = document.createElement("a");
          a.href = `/player.html?name=${encodeURIComponent(player.name)}`;
          a.textContent = player.name;
          a.className = "player-link";
          li.appendChild(a);

          // Add club next to player name
          const spanClub = document.createElement("span");
          spanClub.textContent = ` (${player.club})`;
          spanClub.className = "player-club-groups"; // for styling if needed
          li.appendChild(spanClub);

          ul.appendChild(li);
      });
        card.appendChild(ul);
        groupsWrapper.appendChild(card);
    });
    container.appendChild(groupsWrapper);
}


// Header functionality
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

function renderKnockouts(data) {
  const container = document.getElementById("contentContainer");
  container.innerHTML = `
    <div id="bracket-wrapper">
      <div class="stage-header" id="stage-header"></div>
      <div class="bracket" id="bracket">
        <svg id="lines"></svg>
      </div>
    </div>
  `;
  const wrapper = document.getElementById("bracket-wrapper");
  const bracket = document.getElementById("bracket");
  const svg = document.getElementById("lines");

  if (!data.knockouts) {
    bracket.textContent = "No knockout data available";
    return;
  }

  const knockouts = Object.values(data.knockouts); // array of rounds
  const numRounds = knockouts.length;
  const gaps = generateGaps(numRounds); // Dynamically generate gaps

  const leftRounds = [];
  const rightRounds = [];

  knockouts.slice(0, numRounds - 1).forEach(round => {
    const mid = Math.ceil(round.matches.length / 2);
    leftRounds.push(round.matches.slice(0, mid));
    rightRounds.push(round.matches.slice(mid));
  });

  const final = knockouts[numRounds - 1].matches;

  // Render left side
  leftRounds.forEach((round, r) => {
    const col = document.createElement("div");
    col.className = "round";
    col.style.setProperty("--match-gap", `${gaps[r] || 20}px`);

    const header = document.createElement("div");
    header.className = "stage-box";
    header.textContent = knockouts[r].stage;

    document.getElementById("stage-header").appendChild(header);

    round.forEach(match => col.appendChild(makeMatch(match)));
    bracket.appendChild(col);
  });

  // Render final in middle
  const finalCol = document.createElement("div");
  finalCol.className = "round";

  final.forEach(match => {
    const fm = makeMatch(match);
    fm.classList.add("final");

    const header = document.createElement("div");
    header.className = "stage-box";
    header.textContent = "Final";
    document.getElementById("stage-header").appendChild(header);

    finalCol.appendChild(fm);
  });
  bracket.appendChild(finalCol);

  // Render right side
  for (let r = rightRounds.length - 1; r >= 0; r--) {
    
    const gapIndex = rightRounds.length - 1 - r;
    console.log(gapIndex)
    console.log(gaps[r])
    const col = document.createElement("div");
    col.className = "round";
    col.style.setProperty("--match-gap", `${gaps[r] || 20}px`);

    const header = document.createElement("div");
    header.className = "stage-box";
    header.textContent = knockouts[r].stage;
    document.getElementById("stage-header").appendChild(header);

    rightRounds[r].forEach(match => col.appendChild(makeMatch(match)));
    bracket.appendChild(col);
  }

  adjustBracketWidth();
  drawLines();

  window.addEventListener("resize", drawLines);
  window.addEventListener("resize", adjustBracketWidth);
      function makeMatch(players) {
      const div = document.createElement("div");
      div.className = "match";

      players.forEach((p, index) => {
        const row = document.createElement("div");
        row.className = "player";

        const link = document.createElement("a");
        link.href = `/player.html?name=${encodeURIComponent(p.name)}`;
        link.textContent = p.name;
        link.className = "player-link";
        row.appendChild(link);

        if (p.score !== undefined && p.score !== null) {
          const score = document.createElement("span");
          score.textContent = ` (${p.score})`;
          score.style.color = "white";
          row.appendChild(score);
        }

        div.appendChild(row);

        // Add a line after each player except the last
        if (index < players.length - 1) {
          const line = document.createElement("div");
          line.className = "player-divider";

          // If more than 2 players (doubles), lighten/smaller the divider between teammates
          if (players.length > 2 && index % 2 === 0) {
            line.style.height = "0px";           // smaller height
            line.style.backgroundColor = "#555"; // lighter color
          }

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
    const y1 = aRect.top - bracketRect.top + aRect.height / 2 ;
    const x2 = bRect.left- bracketRect.left;
    const y2 = bRect.top - bracketRect.top + bRect.height / 2 ;

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

    // const offset = 223+25*2+5;

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
    const roundWidth = 183; // width in px of a single round (including margin/gap)
    const gap = 25;          // extra space between rounds

    const totalWidth = rounds * (roundWidth + gap)

    bracket.style.minWidth = `${totalWidth}px`;
  }
  function makeStageHeader(stageName) {
    const div = document.createElement("div");
    div.className = "stage-header"; // new class for styling
    div.textContent = stageName;
    return div;
  }
    function generateGaps(numRounds) {
    let gaps = [];
    let baseGap = 20; // You can adjust this for visual preference

    // Start from the final round and work backwards to the first
    // The last round has the smallest gap, and it grows for earlier rounds
    for (let i = 0; i < numRounds - 1; i++) {
        let currentGap = baseGap * Math.pow(2, i);
        gaps.unshift(currentGap);
    }
    gaps = [10, 75, 200,400]
    return gaps;
  }

  window.addEventListener("resize", drawLines);
  window.addEventListener("resize", adjustBracketWidth);
}

const updateStageHeaderWidth = () => {
  const stageHeader = document.querySelector('#stage-header');
  const bracket = document.querySelector('.bracket');
  if (stageHeader && bracket) {
    stageHeader.style.minWidth = `${bracket.offsetWidth}px`;
  }
};

// Initial call
updateStageHeaderWidth();

// Update on window resize
window.addEventListener('resize', updateStageHeaderWidth);
