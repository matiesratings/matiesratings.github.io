function renderKnockouts() {
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

  const leftGaps = [10, 80, 220, 10, 20]; 
  const rightGaps = [10, 220, 80, 10, 20]; 

  // Scroll the viewport horizontally to center
  wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;

  fetch("/scr/data/tournament/maties_open_25/R32.json")
    .then(res => res.json())
    .then(data => {
      const knockouts = data.knockouts;

      const leftRounds = [];
      const rightRounds = [];
      const numRounds = knockouts.length;

      knockouts.slice(0, numRounds - 1).forEach(round => {
        const mid = Math.ceil(round.matches.length / 2);
        leftRounds.push(round.matches.slice(0, mid));
        rightRounds.push(round.matches.slice(mid)); // don't reverse matches here
      });

      const final = knockouts[numRounds - 1].matches; // last round




      // Render left side
      leftRounds.forEach((round, r) => {
        const col = document.createElement("div");
        col.className = "round";
        col.style.setProperty("--match-gap", `${leftGaps[r] || 20}px`);

        const header = document.createElement("div");
        header.className = "stage-box";
        header.textContent = knockouts[r].stage;

        const stageHeaderDiv = document.getElementById("stage-header");
        stageHeaderDiv.appendChild(header);


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

        const stageHeaderDiv = document.getElementById("stage-header");
        stageHeaderDiv.appendChild(header);

        finalCol.appendChild(fm);
      });
      bracket.appendChild(finalCol);

      for (let r = rightRounds.length - 1; r >= 0; r--) {
        const gapIndex = rightRounds.length -1 - r; // 0,1,2... from left → right visually
        const col = document.createElement("div");
        col.className = "round";
        col.style.setProperty("--match-gap", `${rightGaps[gapIndex] || 20}px`);
        const header = document.createElement("div");
        header.className = "stage-box";
        header.textContent = knockouts[r].stage;

        const stageHeaderDiv = document.getElementById("stage-header");
        stageHeaderDiv.appendChild(header);
        rightRounds[r].forEach(match => col.appendChild(makeMatch(match)));
        bracket.appendChild(col);
      }
      adjustBracketWidth();
      drawLines();

      // centre scroll
      requestAnimationFrame(() => {
          wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;
          wrapper.scrollTop = (wrapper.scrollHeight - wrapper.clientHeight) / 2;
      });

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
        score.style.color = "white";
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
    const roundWidth = 223; // width in px of a single round (including margin/gap)
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

  window.addEventListener("resize", drawLines);
  window.addEventListener("resize", adjustBracketWidth);
}