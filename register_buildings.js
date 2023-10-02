async function register_building(id, is_tower) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "id": id,
        "is_tower": is_tower
    });

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    return fetch("http://localhost:8082/building", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error))

}

async function register_all() {
    await register_building("0x34cf8a7e000000000000000000000000000000010000ffff",true)
    await register_building("0x34cf8a7e000000000000000000000000000000050002fff9",false)
    await register_building("0x34cf8a7e0000000000000000000000000000fffbfffe0007",false)
    await register_building("0x34cf8a7e0000000000000000000000000000fff8000afffe",false)
}

register_all()

