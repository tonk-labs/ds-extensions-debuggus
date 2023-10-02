import ds from 'downstream';

const MIN_NUMBER_PLAYERS = 2;
let game, players;

let wants_to_join = false;
let wants_to_start = false;

async function getGame() {
    try {
        let response = await fetch("http://localhost:8082/game");
        let raw = await response.text();
        return JSON.parse(raw);
    } catch (e) {
        console.log(e);
        return ({
            status: "GameServerDown"
        })
    }
}

async function getPlayers(gameId) {
    // fetch("localhost:8082/game/9d19e34892d546bea2fbeba08be9e573/player", requestOptions)
    // .then(response => response.text())
    // .then(result => console.log(result))
    // .catch(error => console.log('error', error));

    try {
        let response = await fetch(`http://localhost:8082/game/${gameId}/player`);
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
        let response = await fetch(`http://localhost:8082/game`, requestOptions)
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
        let response = await fetch(`http://localhost:8082/game/${gameId}/player`, requestOptions)
        let text = await response.text();
        console.log(text);
    } catch (e) {
        console.log(e);
    }
}

export default async function update(params) {
    const { selected, player } = params; 
    console.log(params);
    const { tiles, mobileUnit } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedEngineer = mobileUnit;
    const inputBag = selectedBuilding && selectedBuilding.bags.find(b => b.key == 0).bag;
    const canCraftTonk = inputBag && inputBag.slots.length == 2 && inputBag.slots.every(slot => slot.balance > 0) && selectedEngineer;
    console.log("building id: ", selectedBuilding.id);
    // console.log(player);

    game = await getGame();
    players = await getPlayers(game.id);


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
            wants_to_join = false;
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

        ds.log('Enjoy your drink!');
    };

    const has_tonk = player.mobileUnits[0].bags[0].bag.slots.findIndex(b => b.item && b.item.name.value == 'Tonk') >= 0 || player.mobileUnits[0].bags[1].bag.slots.findIndex(b => b.item && b.item.name.value == 'Tonk') >= 0
    const player_is_in_game = players.findIndex(p => p.id == player.id) >= 0;

    let html = ``;
    let buttons = [];
    if (game.status == "Lobby") {
        html =` 
            <p> Number of players waiting in the lobby: ${players.length} </p>
            <br/>
            ${players.length < MIN_NUMBER_PLAYERS ? `<p>Game can start when ${MIN_NUMBER_PLAYERS - players.length} more players join the lobby</p>`: "Game is ready to start"}
            <hr />
        `
        if (!player_is_in_game && !!has_tonk) {
            buttons.push({ text: 'Join Game', type: 'action', action: joinGame, disabled: !has_tonk });
        }
        if (players.length >= MIN_NUMBER_PLAYERS) {
            buttons.push({ text: 'Start Game', type: 'action', action: startGame, disabled: !has_tonk || !player_is_in_game });
        }
    } else if (game.status == "Tasks") {
        html = `
            <h3> Complete Tasks </h3>
            <br/>
            <h3> Time remaining: ${game.time.timer} </h3>
            <br/>
            <p> Players have been assigned their tasks </p>
            `;

    } else if (game.status == "TaskResult") {
        // fetch round result
        html = `
            <h3> Complete Tasks </h3>
            <br/>
            <p> Players have been assigned their tasks </p>
            <br/>
            `;

    } else if (game.status == "Vote") {
        html = `
            <h3> Complete Tasks </h3>
            <br/>
            <p> Players have been assigned their tasks </p>
            `;
        //add dropdown with player names
        //then a vote button

    } else if (game.status == "VoteResult") {
        // fetch round result
        html = `
            <h3> Complete Tasks </h3>
            <br/>
            <p> Players have been assigned their tasks </p>
            `;

    } else if (game.status == "End") {
        // display the names of the winners
    }

    if (game.status == "GameServerDown") {
        // Display error about game server
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
                    buttons: buttons
                }],
            },
        ],
    };
}