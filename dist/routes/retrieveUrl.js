import { verifyCaptcha } from "../captcha.js";
import { app, tv2play } from "../index.js";
import express from "express";
import logger from "../logger.js";
export function createRetrieveHandler() {
    app.post("/api/retrieve/", express.json({ strict: true }), async (req, res) => {
        let link = req.body?.link;
        let token = req.body?.token;
        let ip = req?.headers["x-forwarded-for"]?.toString();
        logger.request(`retrieve: ${link}`);
        // captcha is only validated if an ip is sent from the cloudflare proxy
        if (ip) {
            if (!token)
                return res.status(400).json({
                    message: `nem csináltad meg a captcha-t!`,
                });
            let captchaResult = await verifyCaptcha(ip, token);
            if (!captchaResult.success) {
                return res.status(400).json(captchaResult.message);
            }
        }
        if (!link)
            return res.status(400).json({
                message: `nem megfelelő linket adtál meg!`,
            });
        tv2play
            .searchByUrl(link?.toString().trim())
            .then((data) => {
            res.json(data);
        })
            .catch((err) => {
            res.status(404).json(err);
        });
    });
}
