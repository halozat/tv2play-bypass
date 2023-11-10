import chalk from "chalk"

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// basic ahh, custom logger.
const logger = {
  log: function (prefix: string, color: string, text: string) {
    console.log(
      chalk.bgHex("#202020").bold(` ${formatDate(new Date())} `) +
        chalk.hex(color).bold(prefix.padStart(8, " ")) +
        " > " +
        chalk.white(text)
    )
  },
  info: function (text: string) {
    this.log("info", `#ffffff`, text)
  },
  error: function (text: string) {
    this.log("error", `#ff4242`, text)
  },
  request: function (text: string) {
    this.log("request", `#0066ff`, text)
  },
  captcha: function (text: string) {
    this.log("captcha", `#f5f542`, text)
  }
}

export default logger
