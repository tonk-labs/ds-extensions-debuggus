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

async function registerPlayer(id, hash, secret) {
    var requestOptions = {
        method: 'POST',
      };
      
      try {
        // let response = await fetch(`http://localhost:8082/player/${id}?secret_key=${secret}&onchain_hash=${hash}`, requestOptions)
        let response = await fetch(`http://localhost:8082/player/${id}`, requestOptions)
        // let text = await response.text();
      } catch (e) {
        console.log(e);
      }
}

function formatHtml(status) {
    if (status == "SPECTATOR") {
        return `
            <p> Please go to the debug us tower to join the game </p>
        `
    } else if (status == "Lobby") {
        return `
            <h3>${status}</h3>
            <p> Waiting for the game to start... </p>
        `
    } else {
        return "";
    } 
}

export default async function update({ selected, player }) {
    const { mobileUnit } = selected || {};

    game = await getGame();
    tonkPlayer = await getPlayer(player.id);

    if (tonkPlayer.id == "") {
        await registerPlayer(player.id);
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
                            ${formatHtml(status)}
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