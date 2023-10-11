import ds from 'downstream';

export default async function update({ selected }) {
    const { tiles, mobileUnit } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedEngineer = mobileUnit;
    if (!!selectedBuilding) {
        console.log("building id", selectedBuilding.id);
        console.log("selected coords: ", selectedTile.coords);
    }
    // const inputBag = selectedBuilding && selectedBuilding.bags.find(b => b.key == 0).bag;
    // const canPourDrink = inputBag && inputBag.slots.length == 2 && inputBag.slots.every(slot => slot.balance > 0) && selectedEngineer;

    // const craft = () => {
    //     if (!selectedEngineer) {
    //         ds.log('no selected engineer');
    //         return;
    //     }
    //     if (!selectedBuilding) {
    //         ds.log('no selected building');
    //         return;
    //     }

    //     ds.dispatch(
    //         {
    //             name: 'BUILDING_USE',
    //             args: [selectedBuilding.id, selectedEngineer.id, []]
    //         },
    //     );

    //     ds.log('Enjoy your drink!');
    // };

    let buttons = [];
    let html = ``;

    return {
        version: 1,
        components: [
            {
                id: 'loggers-retreat',
                type: 'building',
                content: [
                    {
                        id: 'default',
                        type: 'inline',
                        buttons,
                        html,
                    }
                ],
            },
        ],
    };
}