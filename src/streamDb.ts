import { randomUUID } from "crypto"

let streams: { [key: string]: StreamDBValue | null } = {}

interface StreamDBValue {
  path: string
  baseUrl: string
}

export function addNewStreamHash(value: StreamDBValue) {
  // for testing purposes...
  // const uuid = `test`
  const uuid = randomUUID()
  streams[uuid] = value
  return uuid
}

export function getStreamHash(uuid: string) {
  return streams[uuid] ?? null
}
