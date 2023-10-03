import ds from 'downstream';

var game, tonkPlayer;
let bugging = false;
let player_to_bug = null;
let complete_task = false;

async function getGame() {
    try {
        let response = await fetch("http://localhost:8082/game");
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
        return (`{ "status": "GameServerDown" }`)
    }
}

async function getPlayer(id) {
    try {
        let response = await fetch(`http://localhost:8082/player/${id}`)
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
    }
}

async function isInGame(gameId, playerId) {
    try {
        let response = await fetch(`http://localhost:8082/game/${gameId}/player`);
        let raw = await response.text();
        let players = JSON.parse(raw);
        return players.findIndex((p) => p.id == playerId) !== -1;
    } catch (e) {

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
        // let response = await fetch(`http://localhost:8082/player/${id}?secret_key=${secret}&onchain_hash=${hash}`, requestOptions)
        let response = await fetch(`http://localhost:8082/player/${id}`, requestOptions)
        // let text = await response.text();
      } catch (e) {
        console.log(e);
      }
}

async function getTask(player) {
    try {
        let response = await fetch(`http://localhost:8082/task?player_id=${player.id}&secret_key=fff`);
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
        let response = await fetch(`http://localhost:8082/action?player_id=${player.id}&secret_key=fff`, requestOptions)
      } catch (e) {
        console.log(e);
      }
}

async function postAction(target, game, player) {
    var raw = JSON.stringify({
        poison_target: target,
        round: game.time.round
    })
    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: raw
      };
      
      try {
        let response = await fetch(`http://localhost:8082/action?player_id=${player.id}&secret_key=fff`, requestOptions)
      } catch (e) {
        console.log(e);
      }
}

function formatHtml(status, game, player, task) {
    if (status == "SPECTATOR") {
        return `
            <p> Please go to the debug us tower to join the game </p>
        `
    } else if (status == "Lobby") {
        return `
            <h3>${status}</h3>
            <p> Waiting for the game to start... </p>
        `
    } else if (status == "Tasks") {
        if (player.role == "Bugged") {
            return `
                <h3> Complete the Task </h3>
                <h3>Time remaining: ${game.time.timer}</h3>
                <br/>
                ${player.used_action ? (
                    `<p> Ok, chill, chill, you did just bug a player. Act normal!`
                ) : (
                    `<p> Objective: ${task.destination.task_message} </p>`
                )}
            `
        } else {
            return `
                <h3> Complete the Task </h3>
                <h3>Time remaining: ${game.time.timer}</h3>
                <br/>
                <p> Objective: ${task.destination.task_message} </p>
            `
        }
    } else if (status == "TaskResult") {
        return `
            <h3> Tasks complete </h3>
            <br/>
            <p> Return back to the tower to see results! </p>
        `;
    } else if (status == "Vote") {
        return `
            <h3> Vote </h3>
            <br/>
            <p> Go to the tower and submit your vote! </p>
        `;
    } else if (status == "VoteResult") {
        return `
            <h3> Votes counted </h3>
            <br/>
            <p> The tower is announcing the result. </p>
        `;
    } else if (status == "End") {
        return `
            <h3> Game Over </h3>
            <br/>
            <p> Victory! Return to the tower to play again. </p>
        `;
    }
}

export default async function update(params) {
    // console.log(params);
    const { selected, player } = params;
    const { mobileUnit } = selected || {};

    game = await getGame();
    tonkPlayer = await getPlayer(player.id);
    let task = "";
    let buttons;

    const bugOut = (id) => {
        bugging = true;
        player_to_bug = id;
    }

    const completeTask = () => {
        complete_task = true;
    }

    if (bugging) {
        await postAction(player_to_bug, game, tonkPlayer);
        bugging = false;
        player_to_bug = null;
    }

    if (game.status == "Tasks") {
        task = await getTask(tonkPlayer);
        if (tonkPlayer.role == "Bugged" && tonkPlayer.nearby_players.length != 0 && !tonkPlayer.used_action) {
            buttons = [];
            tonkPlayer.nearby_players.forEach((p) => {
                buttons.push(
                    { text: `Bug ${p.display_name}`, type: 'action', action: bugOut.bind(this, p.id), disabled: false }
                )

            });
            buttons = [
            ]
        } else {
            if (complete_task) {
                await postTask(task, tonkPlayer);
            }
            if (tonkPlayer.nearby_buildings.findIndex((b) => b.id == task.destination.id) >= 0 && !task.complete) {
                buttons = [
                    { text: 'Complete task', type: 'action', action: completeTask, disabled: false }
                ];
            }
        }
    }

    let nameField = player.mobileUnits[0].name || { value: `UNIT ${player.mobileUnits[0].key.replace("0x", "").toUpperCase()}`}
    if (tonkPlayer.id == "") {
        await registerPlayer(player.id, player.mobileUnits[0].id, nameField.value.toUpperCase());
    } else if (tonkPlayer.display_name != nameField.value) {
        await registerPlayer(player.id, player.mobileUnits[0].id, nameField.value.toUpperCase());
    }

    let has_joined = await isInGame(game.id, player.id);
    let status = has_joined ? game.status : "SPECTATOR"

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
                            ${formatHtml(status, game, tonkPlayer, task)}
                        `,
                        buttons
                    },
                ],
            },
        ],
    };
}