import { randomUUID } from "crypto";
let streams = {};
export function addNewStreamHash(value) {
    // for testing purposes...
    // const uuid = `test`
    const uuid = randomUUID();
    streams[uuid] = value;
    return uuid;
}
export function getStreamHash(uuid) {
    return streams[uuid] ?? null;
}
