// draw.js

// Helper function to create player name links
// If event is doubles, splits names by " / " and creates separate links for each player
function createPlayerNameLinks(playerName, eventName, stopPropagation = false) {
    const isDoubles = eventName && eventName.toLowerCase().includes('doubles');
    
    if (isDoubles && playerName.includes(' / ')) {
        // Split the name and create separate links for each player
        const players = playerName.split(' / ').map(p => p.trim());
        const wrapper = document.createElement("span");
        wrapper.className = "doubles-player-names";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        
        players.forEach((player) => {
            const link = document.createElement("a");
            link.href = `/pages/player.html?name=${encodeURIComponent(player)}`;
            link.textContent = player;
            link.className = "player-link";
            if (stopPropagation) {
                link.addEventListener("click", (e) => {
                    e.stopPropagation();
                });
            }
            wrapper.appendChild(link);
        });
        
        return wrapper;
    } else {
        // Single link for the full name
        const link = document.createElement("a");
        link.href = `/pages/player.html?name=${encodeURIComponent(playerName)}`;
        link.textContent = playerName;
        link.className = "player-link";
        if (stopPropagation) {
            link.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }
        return link;
    }
}

function renderGroups(data, eventName = '') {
    const container = document.getElementById("contentContainer");
    container.innerHTML = ""; // clear old content

    const groupsWrapper = document.createElement("div");
    groupsWrapper.id = "groups";
    groupsWrapper.className = "groups-container";

    data.groups.forEach(group => {
        const card = document.createElement("div");
        card.className = "group-card";
        card.style.cursor = "pointer"; // Make it clear it's clickable

        const title = document.createElement("h2");
        title.textContent = group.name;
        card.appendChild(title);

        const ul = document.createElement("ul");
        ul.className = "player-list";
        group.players.forEach(player => {
          const li = document.createElement("li");

          // Use helper function to create player name links
          const nameLinks = createPlayerNameLinks(player.name, eventName, true);
          li.appendChild(nameLinks);

          // Add club next to player name
          const spanClub = document.createElement("span");
          spanClub.textContent = ` (${player.club})`;
          spanClub.className = "player-club-groups"; // for styling if needed
          li.appendChild(spanClub);

          ul.appendChild(li);
      });
        card.appendChild(ul);
        
        // Add click handler to show group details modal
        card.addEventListener("click", () => {
            showGroupDetailsModal(group, eventName);
        });
        
        groupsWrapper.appendChild(card);
    });
    container.appendChild(groupsWrapper);
}

function showGroupDetailsModal(group, eventName = '') {
    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "group-modal-overlay";
    overlay.id = "group-modal-overlay";
    
    // Create modal content
    const modal = document.createElement("div");
    modal.className = "group-modal";
    
    // Modal header with close button
    const header = document.createElement("div");
    header.className = "group-modal-header";
    
    const title = document.createElement("h2");
    title.textContent = group.name;
    header.appendChild(title);
    
    const closeBtn = document.createElement("button");
    closeBtn.className = "group-modal-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", () => closeGroupModal());
    header.appendChild(closeBtn);
    
    modal.appendChild(header);
    
    // Player standings section
    const standingsSection = document.createElement("div");
    standingsSection.className = "group-modal-section";
    
    const standingsTitle = document.createElement("h3");
    standingsTitle.textContent = "Standings";
    standingsSection.appendChild(standingsTitle);
    
    const standingsTable = document.createElement("table");
    standingsTable.className = "group-standings-table";
    
    // Table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // Rank header
    const rankTh = document.createElement("th");
    rankTh.textContent = "Rank";
    headerRow.appendChild(rankTh);
    
    // Player header (centered)
    const playerTh = document.createElement("th");
    playerTh.textContent = "Player";
    playerTh.className = "centered-header";
    headerRow.appendChild(playerTh);
    
    // Association header (centered)
    const associationTh = document.createElement("th");
    associationTh.textContent = "Association";
    associationTh.className = "centered-header";
    headerRow.appendChild(associationTh);
    
    thead.appendChild(headerRow);
    standingsTable.appendChild(thead);
    
    // Table body - sort players by rank
    const tbody = document.createElement("tbody");
    const sortedPlayers = [...group.players].sort((a, b) => a.rank - b.rank);
    sortedPlayers.forEach(player => {
        const row = document.createElement("tr");
        
        const rankCell = document.createElement("td");
        rankCell.textContent = player.rank;
        rankCell.className = "rank-cell";
        row.appendChild(rankCell);
        
        const nameCell = document.createElement("td");
        const nameLinks = createPlayerNameLinks(player.name, eventName);
        nameCell.appendChild(nameLinks);
        row.appendChild(nameCell);
        
        const clubCell = document.createElement("td");
        clubCell.textContent = player.club;
        row.appendChild(clubCell);
        
        tbody.appendChild(row);
    });
    standingsTable.appendChild(tbody);
    standingsSection.appendChild(standingsTable);
    modal.appendChild(standingsSection);
    
    // Matches section
    if (group.matches && group.matches.length > 0) {
        const matchesSection = document.createElement("div");
        matchesSection.className = "group-modal-section";
        
        const matchesTitle = document.createElement("h3");
        matchesTitle.textContent = "Matches";
        matchesSection.appendChild(matchesTitle);
        
        const matchesList = document.createElement("div");
        matchesList.className = "group-matches-list";
        
        group.matches.forEach(match => {
            const matchItem = document.createElement("div");
            matchItem.className = "group-match-item";
            
            const player1Div = document.createElement("div");
            player1Div.className = "group-match-player";
            const player1Links = createPlayerNameLinks(match.player1, eventName);
            player1Div.appendChild(player1Links);
            const score1 = document.createElement("span");
            score1.className = "group-match-score";
            score1.textContent = match.score1;
            player1Div.appendChild(score1);
            
            const vsDiv = document.createElement("div");
            vsDiv.className = "group-match-vs";
            vsDiv.textContent = "vs";
            
            const player2Div = document.createElement("div");
            player2Div.className = "group-match-player";
            const player2Links = createPlayerNameLinks(match.player2, eventName);
            player2Div.appendChild(player2Links);
            const score2 = document.createElement("span");
            score2.className = "group-match-score";
            score2.textContent = match.score2;
            player2Div.appendChild(score2);
            
            matchItem.appendChild(player1Div);
            matchItem.appendChild(vsDiv);
            matchItem.appendChild(player2Div);
            matchesList.appendChild(matchItem);
        });
        
        matchesSection.appendChild(matchesList);
        modal.appendChild(matchesSection);
    }
    
    overlay.appendChild(modal);
    
    // Close modal when clicking overlay
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeGroupModal();
        }
    });
    
    // Close modal on Escape key
    const escapeHandler = (e) => {
        if (e.key === "Escape") {
            closeGroupModal();
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);
    
    document.body.appendChild(overlay);
    
    // Animate modal appearance
    setTimeout(() => {
        overlay.classList.add("active");
    }, 10);
}

function closeGroupModal() {
    const overlay = document.getElementById("group-modal-overlay");
    if (overlay) {
        overlay.classList.remove("active");
        setTimeout(() => {
            overlay.remove();
        }, 300); // Match transition duration
    }
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

function renderKnockouts(data, eventName = '') {
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

  const finalRoundMatches = knockouts[numRounds - 1].matches;
  
  // Helper function to check if a match is valid (has non-empty names and scores)
  function isValidMatch(match) {
    if (!match || !Array.isArray(match) || match.length < 2) return false;
    return match.every(player => 
      player && 
      player.name && 
      player.name.trim() !== "" && 
      player.score !== undefined && 
      player.score !== null
    );
  }
  
  // Separate final match from other matches (like 3rd/4th place)
  // The first valid match is the final, subsequent valid matches are playoff matches
  let finalMatch = null;
  const otherMatches = [];
  let foundFinal = false;
  
  finalRoundMatches.forEach(match => {
    if (isValidMatch(match)) {
      if (!foundFinal) {
        finalMatch = match;
        foundFinal = true;
      } else {
        otherMatches.push(match);
      }
    }
  });

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
  finalCol.id = "final-round"; // Add ID for scrolling

  // Render the final match (bright/prominent)
  if (finalMatch) {
    const fm = makeMatch(finalMatch);
    fm.classList.add("final");

    const header = document.createElement("div");
    header.className = "stage-box";
    header.textContent = "Final";
    document.getElementById("stage-header").appendChild(header);

    finalCol.appendChild(fm);
  }

  // Render other matches (like 3rd/4th place) below the final (less prominent)
  otherMatches.forEach(match => {
    const pm = makeMatch(match);
    pm.classList.add("playoff-match");

    finalCol.appendChild(pm);
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

  // Scroll to center (final) after rendering
  setTimeout(() => {
    const finalRound = document.getElementById("final-round");
    const wrapper = document.getElementById("bracket-wrapper");
    if (finalRound && wrapper) {
      // Calculate the center position relative to the wrapper
      const finalRect = finalRound.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperWidth = wrapper.clientWidth || wrapperRect.width;
      
      // Position of final relative to wrapper's left edge
      const finalLeftRelative = finalRect.left - wrapperRect.left + wrapper.scrollLeft;
      
      // Center the final in the viewport
      const scrollLeft = finalLeftRelative - (wrapperWidth / 2) + (finalRect.width / 2);
      
      // Smooth scroll to center
      wrapper.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  }, 150); // Small delay to ensure rendering and layout calculations are complete

  window.addEventListener("resize", drawLines);
  window.addEventListener("resize", adjustBracketWidth);
      function makeMatch(players) {
      const div = document.createElement("div");
      div.className = "match";

      players.forEach((p, index) => {
        const row = document.createElement("div");
        row.className = "player";

        // Use helper function to create player name links
        const nameLinks = createPlayerNameLinks(p.name, eventName);
        row.appendChild(nameLinks);

        if (p.score !== undefined && p.score !== null) {
          const score = document.createElement("span");
          score.textContent = ` ${p.score}`;
          score.style.color = "white";
          score.style.fontSize = "15px"; // Adjust the pixel value as needed

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
  const updateStageHeaderWidth = () => {
  const stageHeader = document.querySelector('#stage-header');
  const bracket = document.querySelector('.bracket');
  if (stageHeader && bracket) {
    stageHeader.style.minWidth = `${bracket.offsetWidth}px`;
  }
  };
  // Initial call on DOM load
  updateStageHeaderWidth();

  // Update on window resize
  window.addEventListener('resize', updateStageHeaderWidth);
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



document.addEventListener('DOMContentLoaded', () => {

});