document.addEventListener("DOMContentLoaded", function () {
    fetch("players.json") // Assuming your data is in `players.json`
        .then(response => response.json())
        .then(data => {
            let top10Players = data.sort((a, b) => b.rating - a.rating).slice(0, 10);

            let tbody = document.querySelector("#top10Table tbody");
            tbody.innerHTML = "";

            top10Players.forEach((player, index) => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${player.name}</td>
                    <td>${player.rating}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error("Error loading player data:", error));
});
