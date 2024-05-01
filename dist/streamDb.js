let streams = {};
export function addNewStreamHash(uuid, value) {
    // for testing purposes...
    // const uuid = `test`
    streams[uuid] = value;
    return uuid;
}
export function getStreamHash(uuid) {
    // remove .m3u8 from the uuid incase it has it.
    return streams[uuid.replace(".m3u8", "")] ?? null;
}
