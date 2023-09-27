import ds from 'downstream';

let game, players;

let wants_to_join = false;

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
    // console.log("building id: ", selectedBuilding.id);
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
    const joinGame = () => {
        wants_to_join = true;
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

    let html =` 
            <p> Number of players waiting in the lobby: ${players.length} </p>
            <br/>
            ${players.length < 3 ? `<p>Game can start when ${3 - players.length} more players join the lobby</p>`: ""}
            <hr />
        `
    let buttons = []
    if (!player_is_in_game && !!has_tonk) {
        buttons.push({ text: 'Join Game', type: 'action', action: joinGame, disabled: !!!has_tonk });
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