import ds from 'downstream';

const MIN_NUMBER_PLAYERS = 2;
let game, players, tonkPlayer;

let wants_to_join = false;
let wants_to_start = false;
let cast_vote = false;
let saved_vote_id = null;

let ENDPOINT = "http://localhost:8082"
// let ENDPOINT = "https://ds-api.tonk.gg"

async function getGame() {
    try {
        let response = await fetch(`${ENDPOINT}/game`);
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
        return ({
            status: "GameServerDown"
        })
    }
}

async function getPlayers(gameId, playerId) {
    // fetch("localhost:8082/game/9d19e34892d546bea2fbeba08be9e573/player", requestOptions)
    // .then(response => response.text())
    // .then(result => console.log(result))
    // .catch(error => console.log('error', error));

    try {
        let response = await fetch(`${ENDPOINT}/game/${gameId}/player?player_id=${playerId}`);
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
        return (`[]`)
    }
}

async function requestStart() {
    // var myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
        method: 'POST',
    };

    try {
        let response = await fetch(`${ENDPOINT}/game`, requestOptions)
        let text = await response.text();
        console.log(text);
    } catch (e) {
        console.log(e);
    }
}

async function requestJoin(gameId, playerId, secretKey) {
    // var myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "id": playerId,
    });

    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Sec-Fetch-Mode": "cors"
        },
        mode: "cors",
        body: raw,
    };

    try {
        let response = await fetch(`${ENDPOINT}/game/${gameId}/player`, requestOptions)
        let text = await response.text();
        console.log(text);
    } catch (e) {
        console.log(e);
    }
}

async function getRoundResult() {
    //TODO implement 
    try {
        let response = await fetch(`${ENDPOINT}/game/result`)
        let text = await response.text();
        return JSON.parse(text);
    } catch (e) {
        console.log(e);
    }
}

async function sendVote(candidateId, player) {
    var raw = JSON.stringify({
        candidate: {
            id: candidateId
        }
    });

    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Sec-Fetch-Mode": "cors"
        },
        mode: "cors",
        body: raw,
    };

    try {
        let response = await fetch(`${ENDPOINT}/vote?player_id=${player.id}&secret_key=fff`, requestOptions)
        let text = await response.text();
        console.log(text);
    } catch (e) {
        console.log(e);
    }
}

async function getPlayer(id) {
    try {
        let response = await fetch(`${ENDPOINT}/player/${id}`)
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.error(e);
    }
}

export default async function update(params) {
    const { selected, player } = params; 
    // console.log(params);
    const { tiles, mobileUnit } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedEngineer = mobileUnit;
    const inputBag = selectedBuilding && selectedBuilding.bags.find(b => b.key == 0).bag;
    const canCraftTonk = inputBag && inputBag.slots.length == 2 && inputBag.slots.every(slot => slot.balance > 0) && selectedEngineer;
    if (!!selectedBuilding) {
        console.log("building id: ", selectedBuilding.id);
        console.log("selected coords: ", selectedTile.coords);
    }
    // console.log(player);

    game = await getGame();
    players = await getPlayers(game.id, player.id);


    if (wants_to_join) {
        try {
            await requestJoin(game.id, player.id)
            wants_to_join = false;
        } catch (e) {
            console.log(e)
        }
    }

    if (wants_to_start) {
        try {
            await requestStart()
            wants_to_start = false;
        } catch (e) {
            console.log(e)
        }
    }
    const joinGame = () => {
        wants_to_join = true;
    }

    const startGame = () => {
        wants_to_start = true;
    }

    const craft = () => {
        if (!selectedEngineer) {
            ds.log('no selected engineer');
            return;
        }
        if (!selectedBuilding) {
            ds.log('no selected building');
            return;
        }

        ds.dispatch(
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedEngineer.id, []]
            },
        );

        ds.log('Tonk!');
    };

    if (cast_vote) {
        await sendVote(saved_vote_id, player);
        cast_vote = false;
        saved_vote_id = null;
    }


    const onCastVote = (values) => {
        cast_vote = true;
        saved_vote_id = values.vote;
    };

    const has_tonk = player.mobileUnits[0].bags[0].bag.slots.findIndex(b => b.item && b.item.name.value == 'Tonk') >= 0 || player.mobileUnits[0].bags[1].bag.slots.findIndex(b => b.item && b.item.name.value == 'Tonk') >= 0
    const player_is_in_game = players ? players.findIndex(p => p.id == player.id) >= 0 : [];

    let html = ``;
    let buttons = [];
    let submit;
    if (game.status == "Lobby") {
        html =` 
            <p> Number of players waiting in the lobby: ${players.length} </p>
            <br/>
            ${players.length < MIN_NUMBER_PLAYERS ? `<p>Game can start when ${MIN_NUMBER_PLAYERS - players.length} more players join the lobby</p>`: "Game is ready to start"}
            <hr />
        `
            if (!player_is_in_game && !!has_tonk && game.status == "Lobby") {
            buttons.push({ text: 'Join Game', type: 'action', action: joinGame, disabled: !has_tonk });
        }
        if (players.length >= MIN_NUMBER_PLAYERS && player_is_in_game) {
            buttons.push({ text: 'Start Game', type: 'action', action: startGame, disabled: !has_tonk || !player_is_in_game });
        }
    } else if (game.status == "Tasks") {
        html = `
            <h3> Complete the tasks </h3>
            <br/>
            <h3> Time remaining: ${game.time.timer} </h3>
            <br/>
            <p> Players have been assigned their tasks </p>
            `;

    } else if (game.status == "TaskResult") {
        let roundResult = await getRoundResult(game);
        html = `
            <h3> Tasks round complete </h3>
            <br/>
            <p> These players have been bugged out of the game </p>
            ${roundResult.eliminated && roundResult.eliminated.map((p) => `<p>${p.display_name}</p></br>`)}
            <p> Number of tasks completed: ${roundResult.tasks_completed ? roundResult.tasks_completed.length : 0}</p>
            <br/>
        `;

    } else if (game.status == "Vote") {
        tonkPlayer = await getPlayer(player.id);
        html = `
            <h3> Voting in session </h3>
            <br/>
            <p> Cast your vote to identify and eliminate the bugs </p>
            <br />
            <label>VOTE</label>
            `;
        
        if (player_is_in_game) {
            if (tonkPlayer.used_action) {
                html += `
                    <p> You have cast your vote </p>
                `
            } else {
                // values will be returned as {vote: id}
                html += `
                <div>
                <select name="vote" style="width: 100%">
                    `
                html += players.map((p) => {
                    if (p.id == tonkPlayer.id) {
                        return ""
                    } else {
                        return `<option value=${p.id}>${p.display_name}</option>`;
                    }
                });
                html += "</select>"
                html += `
                    </div>
                    <br/>
                    <div>
                        <button type="submit" style="width:100%; padding:5px; border-radius: 10px;">Cast Vote</button>
                    </div>
                `
                submit = onCastVote;
            }
        }
    } else if (game.status == "VoteResult") {
        // fetch round result
        let roundResult = await getRoundResult(game);
        html = `
            <h3> Voting Results </h3>
            <br/>
            <p> This player has been eliminated: ${roundResult.eliminated ? roundResult.eliminated[0].display_name : "No one!"} </p>
        `;

    } else if (game.status == "End") {
        // display the names of the winners
        html = `
            <h3> Game Over! </h3>
            <br/>
            <p> Winning players are: </p> <br/>
            ${players.map(p => `<p>${p.display_name}</p><br/>`)}
        `;
    }

    if (game.status == "GameServerDown") {
        // Display error about game server
        html = `
            <p>The gods of debug us require a sacrifice to continue playing this game<p>
        `;
    }

    if (!has_tonk) {
        buttons.push({ text: 'Craft Tonk', type: 'action', action: craft, disabled: !canCraftTonk })
        html+=`
            <p> You need a Tonk to play the game </p>
            <br />
        `;
    }


    return {
        version: 1,
        components: [
            {
                id: 'debugus-tower',
                type: 'building',
                content: [{
                    id: 'default',
                    type: 'inline',
                    html: html,
                    buttons: buttons,
                    submit: submit
                }],
            },
        ],
    };
}