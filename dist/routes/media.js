import { app } from "../index.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import { getStreamHash } from "../streamDb.js";
// you have multiple pstream subdomains (7, 8, 9), probably has a better solution. (couldn't find a way to make a dynamic target on the proxy middleware.)
export function createMediaHandler() {
    ;
    [7, 8, 9].forEach((version) => {
        app.get(`/media/${version}/:streamHash/:media`, (req, res, next) => {
            const streamHash = getStreamHash(req?.params?.streamHash);
            if (streamHash === null)
                return res.json({
                    message: `nincs ilyen media fájl...`,
                });
            req["newPath"] = streamHash.baseUrl + req?.params?.media;
            next();
        }, createProxyMiddleware({
            target: `https://pstream${version}.tv2.hu/`,
            changeOrigin: true,
            logLevel: "silent",
            pathRewrite: (path, req) => {
                return req["newPath"];
            },
        }));
    });
}
