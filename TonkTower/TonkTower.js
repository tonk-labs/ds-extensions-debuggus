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

async function getRoundResult(game, round) {
    //TODO implement 
    try {
        let response = await fetch(`${ENDPOINT}/game/result/${round}`)
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

function gameResultToText(game) {
    const { win_result, corrupted_players } = game;
    if (win_result == "Thuggery") {
        return "The corrupted won by being the majority!"
    } else if (win_result == "Democracy") {
        //fail gracefully
        return `The taskers have won because they voted out ${corrupted_players ? (
            corrupted_players.map((p, i) => `${i == 0 ? "" : ", "}${p.display_name}`).join("") + corrupted_players.length > 1 ? (
                " who were the corrupted beavers") : " who was the corrupted beaver") : "the corrupted beavers"}!`
    } else if (win_result == "Perfection") {
        return "The taskers have won because they performed all their tasks!"
    } else if (win_result == "Armageddon") {
        return "Beavergeddon has descended upon your kind. There is no one left."
    } else {
        return "The game is over, but I don't know why!"
    }
}
function reasonToPlaintext(p) {
    console.log(p);
    const { reason, player } = p; 
    if (reason == "BuggedOut") {
        return `has been eliminated and ${player.role == "Bugged" ? 'was corrupted' : 'was an innocent beaver'}`;
    } else if (reason == "VotedOut") {
        return `has been voted out and ${player.role == "Bugged" ? 'was corrupted' : 'was an innocent beaver'}`;
    } else if (reason == "Inaction") {
        return `was ${player.role == "Bugged" ? 'corrupted' : 'an innocent beaver'} and has been eliminated due to inaction`
    } else {
        return "has been swallowed by an error!"
    }
}

function findBags(world, mobileUnit) {
    return world.bags.filter((b) => b.equipee && b.equipee.node.id == mobileUnit.id);
}

export default async function update(params) {
    const { selected, player, world } = params; 

    // console.log(params);
    const { mobileUnit } = selected || {};
    // const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    // const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    // const selectedEngineer = mobileUnit;
    // const inputBag = selectedBuilding && selectedBuilding.bags.find(b => b.key == 0).bag;
    // const canCraftTonk = inputBag && inputBag.slots.length == 2 && inputBag.slots.every(slot => slot.balance > 0) && selectedEngineer;
    console.log("building id: ", selected.mapElement.id);
    console.log("selected coords: ", selected.tiles[0].coords);
    // console.log(player);
    const buildingId = selected.mapElement.id;

    if (!mobileUnit || (mobileUnit && mobileUnit.owner.id !== player.id)) {
        return {
            version: 1,
            components: [
                {
                    id: 'tonk-tower',
                    type: 'building',
                    content: [{
                        id: 'default',
                        type: 'inline',
                        html: "",
                        buttons: [],
                    }],
                },
            ],
        }
    }

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
        if (!mobileUnit) {
            ds.log('no selected engineer');
            return;
        }
        if (!buildingId) {
            ds.log('no selected building');
            return;
        }

        ds.dispatch(
            {
                name: 'BUILDING_USE',
                args: [buildingId, mobileUnit.id, []]
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

    // console.log(world, mobileUnit);
    let bags = findBags(world, mobileUnit);

    const has_tonk = bags[0].slots.findIndex(b => b.item && b.item.name.value == 'Tonk') >= 0 || bags[1].slots.findIndex(b => b.item && b.item.name.value == 'Tonk') >= 0
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
    } else if (game.status == "Vote") {
        // fetch round result for task round
        let roundResult = await getRoundResult(game, game.time.round - 1);
        tonkPlayer = await getPlayer(player.id);
        html = `
            <h3> Voting in session </h3>
            <br/>
            ${roundResult.eliminated && roundResult.eliminated.length > 0 ? "<p> Player deletion report: </p><br/>" : "<p>Somehow, you all have avoided deletion.</p>"}
            ${roundResult.eliminated && roundResult.eliminated.map((p) => `<p>${p.player.display_name} ${reasonToPlaintext(p.player)}</p>`)}
            <br/>
            <p> Number of tasks completed: ${roundResult.tasks_completed ? roundResult.tasks_completed.length : 0}</p>
            <br/>
            <br/>
            <p> Cast your vote to identify and eliminate the corrupted </p>
            <br />
            <label>VOTE</label>
            `;
        
        if (player_is_in_game) {
            if (tonkPlayer.used_action == "Voted") {
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
        // fetch round result for  round
        let roundResult = await getRoundResult(game, game.time.round);
        html = `
            <h3> Voting is over! </h3>
            <br/>
            ${roundResult.eliminated && roundResult.eliminated.length > 0 ? "<p> Player deletion report: </p><br/>" : "<p>Somehow, you all have avoided deletion.</p><br/>"}
            ${roundResult.eliminated && roundResult.eliminated.map((p) => `<p>${p.player.display_name} ${reasonToPlaintext(p)}</p>`)}
        `;

    } else if (game.status == "End") {
        // display the names of the winners
        html = `
            <h3> Game Over! </h3>
            <p> ${gameResultToText(game)} </p>
            <br/>
            ${players.length == 0 ? (
                ""
            ) : (
                "<p> I'm happy to report the following beavers have avoided deletion: "
            )}
            ${players.map((p, i) => (i == 0 ? "" : ", ") + `${p.display_name}`)}.
        `;
    }

    if (game.status == "GameServerDown") {
        // Display error about game server
        html = `
            <p>The game server is down and thus the gods of Tonk Attack require a sacrifice to continue playing this game<p>
        `;
    }

    if (!has_tonk) {
        buttons.push({ text: 'Craft Tonk', type: 'action', action: craft, disabled: false })
        html+=`
            <p> You need a Tonk to play the game </p>
            <br />
        `;
    }


    return {
        version: 1,
        components: [
            {
                id: 'tonk-tower',
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