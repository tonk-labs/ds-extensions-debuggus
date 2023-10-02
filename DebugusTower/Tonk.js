import ds from 'downstream';

var game, tonkPlayer;
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

function formatHtml(status, game) {
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
        return `
            <h3> Complete the Task </h3>
            <h3>Time remaining: ${game.time.timer}</h3>
            <br/>
            <p> Objective: Perform slam poetry at the hex dump </p>
        `
    } else {
        return "";
    } 
}

export default async function update(params) {
    console.log(params);
    const { selected, player } = params;
    const { mobileUnit } = selected || {};

    game = await getGame();
    tonkPlayer = await getPlayer(player.id);

    if (tonkPlayer.id == "") {
        let nameField = player.mobileUnits[0].name || { value: `UNIT ${player.mobileUnits[0].key.replace("0x", "")}`}
        await registerPlayer(player.id, player.mobileUnits[0].id, nameField.value.toUpperCase());
    }

    let has_joined = await isInGame(game.id, player.id);
    let status = has_joined ? game.status : "SPECTATOR"

    const action = () => {
        // ds.dispatch(
        //     {
        //         name: 'BUILDING_USE',
        //         args: [selectedBuilding.id, selectedEngineer.id, []]
        //     },
        // );
        numSips++;
        ds.log('Sipped!');
    };

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
                            ${formatHtml(status, game)}
                        `,
                        // buttons: [
                        //     {
                        //         text: 'Sip',
                        //         type: 'action',
                        //         action,
                        //     },
                        // ],
                    },
                ],
            },
        ],
    };
}