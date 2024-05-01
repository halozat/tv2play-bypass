import cors from "cors";
import { resolve } from "path";
import express from "express";
import { config } from "dotenv";
import logger from "./logger.js";
import TV2PlayParser from "./parser.js";
import { createMediaHandler } from "./routes/media.js";
import { createStreamsHandler } from "./routes/streams.js";
import { createRetrieveHandler } from "./routes/retrieveUrl.js";
import rateLimit from "express-rate-limit";
import { readFile } from "fs/promises";
// .env file.
config();
export const app = express();
const port = process?.env?.PORT || 80;
app.listen(port);
logger.info(`listening on port: ${port}.`);
// creating the parser.
export const tv2play = new TV2PlayParser(process?.env?.T2P_MAIL, process?.env?.T2P_PASS);
app.use(cors({
    origin: [
        // enabled during development, not really needed for live deplyoment...
        "http://localhost:5173",
        process.env.URL,
    ],
}));
// idk
app.disable("x-powered-by");
app.use("/api/", rateLimit({
    // 1 request / 5 seconds
    windowMs: 5 * 1000,
    limit: 1,
    legacyHeaders: false,
    message: { message: `hé, 1-et kérhetsz 5 másodpercen belül!` },
}));
createRetrieveHandler();
// these are very important, for reverse proxying the media servers of tv2play (ip-lock)
createStreamsHandler();
createMediaHandler();
// create a basic error handler.
app.use((err, req, res, next) => {
    logger.error(`${req.path}\t${err}`);
    return res.json({
        message: "hiba történt a szervernél...",
    });
});
// basic version getting.
app.get("/build", (req, res) => {
    readFile("./package.json", { encoding: "utf-8" })
        .then((e) => {
        return res.json({
            version: JSON.parse(e)?.version,
            cf_sitekey: process.env.CF_SITEKEY,
        });
    })
        .catch(() => {
        res.status(500).json({
            message: `nem sikerült lekérni a buildet...`,
        });
    });
});
// added for uptime measuring.
app.get("/status", (req, res) => {
    let statusCode = 200;
    if (tv2play.authenticated)
        statusCode = 500;
    res.status(statusCode).json({
        authenticated: tv2play.authenticated,
    });
});
// create endpoints for frontend.
app.use("/assets", express.static("./public/assets"));
app.get("*", (req, res) => {
    res.sendFile(resolve("./public/index.html"));
});
