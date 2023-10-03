async function register_building(id, is_tower, message, location) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "id": id,
        "is_tower": is_tower,
        "task_message": message,
        location,
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

const HEX_DUMP_MESSAGE = "Perform slam poetry at the Hex Dump"
const LOGGERS_MESSAGE = "Collage your pencil shavings at Loggers Retreat"
const BREAKPOINT_MESSAGE = "Experience ego death as you stare into the big red dot at Breakpoint Vista"

async function register_all() {
    await register_building("0x34cf8a7e000000000000000000000000000000010000ffff",true, "", [
        '0x0', '0x01', '0x0', '0xffff'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fff8000afffe",false, HEX_DUMP_MESSAGE, [
        '0x0', '0xfff8', '0x0a', '0xfffe'
    ])
    await register_building("0x34cf8a7e000000000000000000000000000000050002fff9",false, LOGGERS_MESSAGE, [
        '0x0', '0x05', '0x02', '0xfff9'
    ])
    await register_building("0x34cf8a7e0000000000000000000000000000fffcfffd0007",false, BREAKPOINT_MESSAGE, [
        '0x0', '0xfffc', '0xfffd', '0x07'
    ])
}

register_all()

