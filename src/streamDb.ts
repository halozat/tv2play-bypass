import { randomUUID } from "crypto"

let streams: { [key: string]: StreamDBValue | null } = {}

interface StreamDBValue {
  path: string
  baseUrl: string
}

export function addNewStreamHash(uuid: string, value: StreamDBValue) {
  // for testing purposes...
  // const uuid = `test`
  streams[uuid] = value
  return uuid
}

export function getStreamHash(uuid: string) {
  // remove .m3u8 from the uuid incase it has it.
  return streams[uuid.replace(".m3u8", "")] ?? null
}
