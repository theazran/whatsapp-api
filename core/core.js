const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = "sessions/";

exports.gas = function (msg, no, to, type) {
    connect(no, msg, to, type);
};

async function connect(sta, msg, to, type) {
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
                const id = to + "@s.whatsapp.net";
                if (type === "chat") {
                    sock.sendMessage(id, {
                        text: msg,
                    });
                }
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);

    return sock;
}
