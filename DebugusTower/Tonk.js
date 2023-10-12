import ds from 'downstream';

var game, tonkPlayer;
let bugging = false;
let player_to_bug = null;
let complete_task = false;

let ENDPOINT = "http://localhost:8082"
// let ENDPOINT = "https://ds-api.tonk.gg"

async function getGame() {
    try {
        let response = await fetch(`${ENDPOINT}/game`);
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
        return (`{ "status": "GameServerDown" }`)
    }
}

async function getPlayer(id) {
    try {
        let response = await fetch(`${ENDPOINT}/player/${id}`)
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
    }
}

function isInGame(players) {
    return players.findIndex((p) => p.id == playerId) !== -1;
}

async function getPlayers(gameId, playerId) {
    try {
        let response = await fetch(`${ENDPOINT}/game/${gameId}/player?player_id=${playerId}`);
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.error(e);
        return [];
    }
}



async function registerPlayer(id, mobileUnitId, displayName, hash, secret) {
    var raw = JSON.stringify({
        id: id, 
        mobile_unit_id: mobileUnitId,
        display_name: displayName 
    })
    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: raw
      };
      
      try {
        // let response = await fetch(`${ENDPOINT}/player/${id}?secret_key=${secret}&onchain_hash=${hash}`, requestOptions)
        let response = await fetch(`${ENDPOINT}/player/${id}`, requestOptions)
        // let text = await response.text();
      } catch (e) {
        console.log(e);
      }
}

async function getTask(player) {
    try {
        let response = await fetch(`${ENDPOINT}/task?player_id=${player.id}&secret_key=fff`);
        let text = await response.text();
        return JSON.parse(text);
    } catch (e) {
        console.log(e);
    }
}

async function postTask(task, player) {
    var raw = JSON.stringify(task);
    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: raw
      };
      
      try {
        let response = await fetch(`${ENDPOINT}/task?player_id=${player.id}&secret_key=fff`, requestOptions)
      } catch (e) {
        console.log(e);
      }
}

async function postAction(target, game, player) {
    var raw = JSON.stringify({
        poison_target: target,
        round: game.time.round,
        interrupted_task: false 
    })
    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: raw
      };
      
      try {
        let response = await fetch(`${ENDPOINT}/action?player_id=${player.id}&secret_key=fff`, requestOptions)
      } catch (e) {
        console.log(e);
      }
}

function formatHtml(status, game, player, players, task) {
    let the_other_bugs = []; 
    if (players.length > 0 && players[0].role) {
        players.map((p) => {
            if (p.role == "Bugged" && p.id !== player.id) {
                the_other_bugs.push(p);
            }
        })
    }
    let the_other_bugs_html = `<p> Pssst, the other bugs are: 
        ${the_other_bugs.map((bugs,i) => {
            if (i == 0) {
                return bugs.display_name;
            } else {
                return ", " + bugs.display_name;
            }
        })}</p>`;

    if (status == "SPECTATOR") {
        return `
            <p> Please go to the debug us tower to join the game </p>
        `
    } else if (status == "Lobby") {
        return `
            <h3>Lobby</h3>
            <p> Waiting for the game to start... </p>
        `
    } else if (status == "Tasks") {
        if (player.role && player.role == "Bugged") {
            return `
                <h3> Complete the Task </h3>
                <h3>Time remaining: ${game.time.timer}</h3>
                <br/>
                ${the_other_bugs_html}
                </br>
                ${player.used_action ? (
                    `<p> Ok, chill, chill, you just bugged someone. Try to act normal!`
                ) : (
                    `<p> Objective: ${task.destination.task_message} </p></br>${
                        player.immune ? (
                            "<p> Your bugging powers are useless within 3 tiles of the Tower </p> "
                        ) : (
                            player.nearby_players && player.nearby_players.length == 0 ? (
                                `<p> There are no nearby players to bug. You must be within 2 tiles to bug someone. </p>`
                            ) : ""
                        )
                    }`
                )}
            `
        } else {
            return `
                <h3> Complete the Task </h3>
                <h3>Time remaining: ${game.time.timer}</h3>
                <br/>
                ${task.complete ? (
                    `<p> Objective Complete! Return to home base and wait for the results. </p>`
                ) : (
                    `<p> Objective: ${task.destination.task_message} </p>`
                )}
            `
        }
    } else if (status == "TaskResult") {
        return `
            <h3> Tasks complete </h3>
            <h3>Time remaining: ${game.time.timer}</h3>
            ${player.role && player.role == "Bugged" ? `${the_other_bugs_html}</br>` : ""}
            <br/>
            <p> Return back to the tower to see results! </p>
        `;
    } else if (status == "Vote") {
        return `
            <h3> Vote </h3>
            <h3>Time remaining: ${game.time.timer}</h3>
            <br/>
            ${player.role && player.role == "Bugged" ? `${the_other_bugs_html}</br>` : ""}
            <p> Go to the tower and submit your vote! </p>
        `;
    } else if (status == "VoteResult") {
        return `
            <h3> Votes counted </h3>
            <h3>Time remaining: ${game.time.timer}</h3>
            ${player.role && player.role == "Bugged" ? `${the_other_bugs_html}</br>` : ""}
            <br/>
            <p> The tower is announcing the result </p>
        `;
    } else if (status == "End") {
        return `
            <h3> Game Over </h3>
            <h3>Time until next game lobby: ${game.time.timer}</h3>
            <br/>
            <p> Victory! Return to the tower to play again </p>
        `;
    }
}

export default async function update(params) {
    const { selected, player } = params;
    const { mobileUnit } = selected || {};

    game = await getGame();
    tonkPlayer = await getPlayer(player.id);
    let task = "";
    let buttons;

    const bugOut = (id, displayName) => {
        bugging = true;
        player_to_bug = {
            id,
            display_name: displayName
        }
    }

    const completeTask = () => {
        complete_task = true;
    }

    if (bugging) {
        await postAction(player_to_bug, game, tonkPlayer);
        bugging = false;
        player_to_bug = null;
    }

    let players = await getPlayers(game.id, player.id);
    let has_joined = isInGame(players);
    let status = has_joined ? game.status : "SPECTATOR"

    let nameField = player.mobileUnits[0].name || { value: `UNIT ${player.mobileUnits[0].key.replace("0x", "").toUpperCase()}`}
    if (tonkPlayer.id == "") {
        await registerPlayer(player.id, player.mobileUnits[0].id, nameField.value.toUpperCase());
    } else if (tonkPlayer.display_name != nameField.value) {
        await registerPlayer(player.id, player.mobileUnits[0].id, nameField.value.toUpperCase());
    }

    if (status == "Tasks") {
        task = await getTask(tonkPlayer);
        if (tonkPlayer.role == "Bugged" && tonkPlayer.nearby_players && tonkPlayer.nearby_players.length != 0 && !tonkPlayer.used_action) {
            buttons = [];
            tonkPlayer.nearby_players.forEach((p) => {
                buttons.push(
                    { text: `Bug ${p.display_name}`, type: 'action', action: bugOut.bind(this, p.id, p.display_name), disabled: bugging }
                )

            });
        } else {
            if (complete_task) {
                await postTask(task, tonkPlayer);
                complete_task = false;
            }
            if (tonkPlayer.nearby_buildings && tonkPlayer.nearby_buildings.findIndex((b) => b.id == task.destination.id) >= 0 && !task.complete) {
                buttons = [
                    { text: 'Complete task', type: 'action', action: completeTask, disabled: complete_task }
                ];
            }
        }
    }

    return {
        version: 1,
        components: [
            {
                id: 'tonk',
                type: 'item',
                content: [
                    {
                        id: 'default',
                        type: 'inline',
                        html: `
                            <h1> Debug Us </h1>
                            <br/>
                            ${formatHtml(status, game, tonkPlayer, players, task)}
                        `,
                        buttons
                    },
                ],
            },
        ],
    };
}