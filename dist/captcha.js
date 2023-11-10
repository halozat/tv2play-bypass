import axios from "axios";
import { config } from "dotenv";
import logger from "./logger.js";
config();
export function verifyCaptcha(ip, token) {
    return new Promise((resolve, reject) => {
        let formData = new FormData();
        formData.append("secret", process.env.CF_SECRET);
        formData.append("response", token);
        formData.append("remoteip", ip);
        axios
            .post("https://challenges.cloudflare.com/turnstile/v0/siteverify", formData)
            .then((e) => {
            if (e.data?.success) {
                resolve({
                    success: true
                });
                logger.captcha(`${ip}: completed captcha`);
            }
            else {
                resolve({
                    success: false,
                    message: `a captcha nem valid... 🤖`
                });
            }
        })
            .catch((e) => {
            resolve({
                success: false,
                message: `a captcha validálása közben hiba történt... 👿`
            });
        });
    });
}
