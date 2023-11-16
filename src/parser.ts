import axios, { Axios } from "axios"
import logger from "./logger.js"
import { wrapper } from "axios-cookiejar-support"
import { CookieJar } from "tough-cookie"
import m3u8Parser from "m3u8-parser"
import TVCache from "./cache.js"
import { addNewStreamHash } from "./streamDb.js"
import { config } from "dotenv"

const searchUrlRegex = /https:\/\/tv2play.hu\/([\w\d_-]+)\/([\w\d_-]+)/
config()

interface SearchByUrlReturn {
  stream: Stream
  title: string
  part: string
  expiry: Date
}

interface Stream {
  baseUrl?: string
  resolution: string
  bandwith: number
  url: string
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .replace(/(?<![^\s\p{Pd}])[^\s\p{Pd}]/gu, (match) => match.toUpperCase())
}

const cache = new TVCache()

export default class TV2PlayParser {
  private client: Axios
  public authenticated: boolean

  private validateURL(url: string): boolean {
    return searchUrlRegex.test(url)
  }

  private generateStreamURL(version: string, uuid: string) {
    return `${process.env.PROXY_MEDIA}/streams/${version}/${uuid}`
  }

  // must have validated the url before calling!
  private getSeriesAndPartFromURL(url: string): {
    series: string
    part: string
  } {
    const matches = url.match(searchUrlRegex)
    const series = matches[1]?.toString()
    const part = matches[2]?.toString()

    return { series, part }
  }

  private formatSeriesPart(series: string, part: string) {
    return `S${series}E${part}`
  }

  private getAndParseManifest(url: string) {
    return new Promise<{ stream: Stream }>((resolve, reject) => {
      this.client
        .get(url)
        .then((e) => {
          // m3u8 parser so i can get the highest res.
          const parser = new m3u8Parser.Parser()
          parser.push(e?.data)
          parser.end()

          // gotta get the base url for the media files.
          const streamBaseUrl = url?.trim()?.slice?.(0, -13)

          const stream: Stream = parser?.manifest?.playlists
            .slice(-1)
            .map(({ attributes, uri }) => {
              const res = attributes?.RESOLUTION
              return {
                resolution: `${res.width}x${res.height}`,
                bandwith: attributes?.BANDWIDTH,
                url: streamBaseUrl + uri,
                baseUrl: streamBaseUrl,
              }
            })[0]

          // the version, probably don't even need it, but
          // idk, might be better if i just leave it.
          const versionRegex = /^pstream(\d)\.tv2\.hu$/
          const parsedUrl = new URL(stream.url)

          const version = parsedUrl.host.match(versionRegex)?.[1]
          if (!version)
            return reject({
              message: `nem sikerült lekérni a stream endpoint verziót...`,
            })

          // creates a database (really just an object) for with a uuid for key.
          const uuid = addNewStreamHash({
            path: parsedUrl.pathname,
            baseUrl: streamBaseUrl,
          })

          return resolve({
            stream: {
              url: this.generateStreamURL(version, uuid).trim(),
              bandwith: stream.bandwith,
              resolution: stream.resolution,
            },
          })
        })
        .catch((err) => {
          return reject({
            message: `nem sikerült lekérni a manifest.m3u8 fájlt...`,
          })
        })
    })
  }

  private getManifestURL(streamingURL: string) {
    return new Promise<string>((resolve, reject) => {
      this.client
        .get(streamingURL)
        .then(async (e) => {
          if (!e?.data?.bitrates)
            return reject({
              message: `nincsenek bitráták???`,
            })

          // starts with a "//" for some reason lmao.
          const manifest = "https:" + e?.data?.bitrates?.hls
          resolve(manifest)
        })
        .catch((err) => {
          return reject({
            message: `nem sikerült megszerezni a manifestet.`,
          })
        })
    })
  }

  private getStreamingURL(playerId: string) {
    return new Promise<{ expiry: Date; streamingURL: string }>(
      (resolve, reject) => {
        this.client
          .get("/streaming-url", {
            params: { playerId },
          })
          .then(async (e) => {
            const streamingURL = e.data?.url
            if (!streamingURL)
              reject({
                message: `nem kaptam vissza streaming-urlt...`,
              })
            // yeah, it expires...
            const expiry = new Date(
              parseInt(new URL(streamingURL)?.searchParams?.get?.("e")) * 1000
            )

            resolve({
              expiry,
              streamingURL,
            })
          })
          .catch((err) => {
            return reject({
              message: `nem sikerült megszerezni a streaming-urlt.`,
            })
          })
      }
    )
  }

  public getSeriesAndPartData(series: string, part: string) {
    return new Promise<{
      title: string
      part: string
      playerId: string
    }>((resolve, reject) => {
      this.client
        .get(`/search/${series}/${part}`)
        .then(async (e) => {
          let data = e?.data

          let title = toTitleCase(data?.seriesTitle)
          let part = this.formatSeriesPart(
            data?.seriesInfo?.seasonNr,
            data?.seriesInfo?.episodeNr
          )

          let playerId = data?.playerId
          if (!playerId)
            return reject({
              message: `nem kaptam playerId-t...`,
            })

          // could include multiple fields, can't be bothered to do so.
          return resolve({
            title,
            part,
            playerId,
          })
        })
        .catch((err) => {
          if (err?.response?.status === 404)
            return reject({
              message: `sorozat/rész: ${series}/${part} nem található!`,
            })
        })
    })
  }

  public searchByUrl(url: string): Promise<SearchByUrlReturn> {
    return new Promise(async (resolve, reject) => {
      if (!this.authenticated)
        reject({
          message: `bannolták/nem lehet bejelentkezni a tv2play accountomat...\nkérlek reportold a hibát @halozat-nak telegrammon.`,
        })
      // just basic caching.
      const cachedValue = cache.get(url)

      if (cachedValue !== null) return resolve(cachedValue)

      // testing if the url matches something like this: https://tv2play.hu/magannyomozok/magannyomozok_ii_evad_9_resz
      if (!this.validateURL(url))
        return reject({
          message: `a megadott url nem volt a megfelelő formátumban...`,
        })

      // get the series/part from: https://tv2play.hu/(magannyomozok)/(magannyomozok_ii_evad_9_resz)
      const { series, part: partRaw } = this.getSeriesAndPartFromURL(url)
      if (!(series && partRaw))
        return reject({
          message: `a megadott url nem volt a megfelelő formátumban...`,
        })

      try {
        // creates a search for the series/part, so you can get the playerId.
        const { playerId, title, part } = await this.getSeriesAndPartData(
          series,
          partRaw
        )

        // getting a streaming-url (ip-locked or some sort of other lock)
        const { expiry, streamingURL } = await this.getStreamingURL(playerId)

        // fetch the streaming-url so we can get the manifest with all the bitrates
        // but we only need the highest lmao
        const manifestUrl = await this.getManifestURL(streamingURL)
        const { stream } = await this.getAndParseManifest(manifestUrl)

        const result = { title, part, expiry, stream }

        resolve({ title, part, expiry, stream })
        cache.set(url, result) /* caceh :3 */
      } catch (e) {
        reject({ message: e?.message } || "ismeretlen hiba...")
      }
    })
  }

  constructor(email: string, password: string) {
    // cookie-jar so i don't have to provide a token everytime.
    const jar = new CookieJar()
    this.client = wrapper(
      axios.create({
        baseURL: "https://tv2play.hu/api/",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        },
        jar,
      })
    )

    // basic login
    this.client
      .post("/authenticate", {
        email: email,
        password: password,
        stayLoggedIn: true,
        deviceToken: { token: null, platform: "web" },
      })
      .then((e) => {
        this.authenticated = true
      })
      .catch((err) => {
        const message = err?.response?.data?.message
        this.authenticated = false
        if (message === "USER_NOT_FOUND") {
          logger.error(`failed login with mail: ${email}`)
        } else {
          logger.error(`failed auth step: ${message}`)
        }
      })
  }
}
