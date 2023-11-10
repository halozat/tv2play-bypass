# tv2play-bypass 👀

> a web interface for ripping stream links from tv2play, and proxying it, with no ads.

### [t2p.lath.hu](https://t2p.lath.hu)

this tool can generate **m3u8 stream** links, that you can stream on multiple platforms, online or locally.

## ❤️‍🔥 quick start

you need to **pull this repo** by using <br/>
`gh repo clone lathlaszlo/tv2play-bypass`

then **start setup**, by executing <br/>
`setup.sh`

if it successfully completed the setup, then create a **.env** file. <br/>
here are the **values for a working setup**.

```dosini
PORT # optional, sets the listening port.
URL # the url that the site is running on.
PROXY_MEDIA # the url that you allow streaming on (on cloudflare, probably disable caching on this subdomain.)
T2P_MAIL # tv2play email
T2P_PASS # tv2play password
CF_SITEKEY # turnstile captcha site key.
CF_SECRET # turnstile captcha secret key.
```

then just execute <br/>
`start.sh` <br/>
and you should be **up and running**.

## 🤩 contribute

if you found **some bugs**, or **vulnerabilities** open a **pull request**.

## 📃 license

this project is under the [MIT license](https://opensource.org/license/mit/).
