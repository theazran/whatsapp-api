const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = "sessions/";

exports.gas = function (msg, no, to, type, img) {
    connect(no, msg, to, type, img);
};

async function connect(sta, msg, to, type, img) {
    const sessionPath = path.concat(sta);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        defaultQueryTimeoutMs: undefined,
        logger: pino({ level: "fatal" }),
        browser: ["FFA", "EDGE", "1.0"],
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection == "connecting") return;

        if (connection === "close") {
            let statusCode = lastDisconnect.error?.output?.statusCode;

            if (statusCode === DisconnectReason.restartRequired) {
                return;
            } else if (statusCode === DisconnectReason.loggedOut) {
                if (fs.existsSync(sessionPath)) {
                    fs.unlinkSync(sessionPath);
                }
                return;
            }
        } else if (connection === "open") {
            if (msg != null && to != null) {
                const id = to
                if (type === "chat") {
                    sock.sendMessage(id + "@s.whatsapp.net", {
                        text: msg,
                    });
                } else if (type === "image") {
                    sock.sendMessage(id + "@g.us", { image: { url: img }, caption: msg })
                }
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);

    return sock;
}
