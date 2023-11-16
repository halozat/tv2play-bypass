import {
  createProxyMiddleware,
  responseInterceptor,
} from "http-proxy-middleware"
import { getStreamHash } from "../streamDb.js"
import { app } from "../index.js"
import { config } from "dotenv"
config()

// you have multiple pstream subdomains (7, 8, 9), probably has a better solution. (couldn't find a way to make a dynamic target on the proxy middleware.)
export function createStreamsHandler() {
  ;[7, 8, 9].forEach((version) => {
    app.get(
      `/streams/${version}/:streamHash`,
      (req, res, next) => {
        // this is the uuid we generate upon parsing the link.
        const streamHash = req?.params?.streamHash
        req["streamHash"] = streamHash

        if (!streamHash || getStreamHash(streamHash) === null)
          return res.json({
            message: `nincs ilyen stream-hash...`,
          })

        next()
      },
      createProxyMiddleware({
        target: `https://pstream${version}.tv2.hu/`,
        changeOrigin: true,
        logLevel: "silent",
        selfHandleResponse: true,
        pathRewrite: (path, req) => {
          return `/${getStreamHash(req?.params?.streamHash).path}`
        },
        onProxyRes: responseInterceptor(
          // @ts-ignore
          (responseBuffer, proxyRes, req, res) => {
            // have to reformat the tv2play media paths.
            const resp = responseBuffer
              .toString("utf-8")
              .trim()
              .split("\n")
              .map((l) => {
                if (/^media_.+.ts$/.test(l))
                  return `/media/${version}/${req["streamHash"]}/${l}`

                return l
              })
              .join("\n")
            return resp
          }
        ),
      })
    )
  })
}
