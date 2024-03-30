const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socketIO = require("socket.io");
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { body, validationResult } = require("express-validator");
const qrcode = require("qrcode");
const pino = require("pino");
const fs = require("fs");
const con = require("./core/core.js");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 9000;
const path = "sessions/";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

io.on("connection", (socket) => {
    socket.on("StartConnection", async (device) => {
        const sessionPath = path.concat(device);

        if (fs.existsSync(sessionPath)) {
            socket.emit("message", "WhatsApp connected");
            socket.emit("ready", device);
        } else {
            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            const sock = makeWASocket({
                printQRInTerminal: false,
                auth: state,
                logger: pino({ level: "fatal" }),
                browser: ["theazran_", "EDGE", "1.0"],
            });

            sock.ev.on("connection.update", (update) => {
                const { connection, qr } = update;

                if (qr) {
                    qrcode.toDataURL(qr, (err, url) => {
                        socket.emit("qr", url);
                        socket.emit("message", "QR Code received, scan please!");
                    });
                }

                if (connection === "close") {
                    con.gas(null, device);
                    socket.emit("message", "WhatsApp connected");
                    socket.emit("ready", device);
                }
            });

            sock.ev.on("creds.update", saveCreds);
        }
    });

    socket.on("LogoutDevice", (device) => {
        const sessionPath = path.concat(device);

        if (fs.existsSync(sessionPath)) {
            fs.rmdirSync(sessionPath, { recursive: true });
            console.log("Logout device: " + device);
            socket.emit("message", "Logout device: " + device);
        }
    });
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/core/device.html");
});

app.get("/scan/:id", (req, res) => {
    res.sendFile(__dirname + "/core/index.html");
});

app.get("/send", (req, res) => {
    const { number, to, type, message, img } = req.query;
    const sessionPath = path.concat(number); // Assuming 'path' is defined elsewhere

    if (fs.existsSync(sessionPath)) {
        try {
            // Assuming 'con.gas' is a function defined elsewhere
            con.gas(message, number, to, type, img);
            res.status(200).json({ status: true, message: "success" });
        } catch (error) {
            res.status(401).json({ status: false, message: error.message });
        }
    } else {
        res.status(401).json({
            status: false,
            message: "Please scan the QR before using the API",
        });
    }
});


app.post(
    "/send",
    [
        body("number").notEmpty().isNumeric(),
        body("to").notEmpty().isNumeric(),
        body("type").notEmpty(),
        body("message").notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                message: errors.array(),
            });
        }

        const { number, to, type, message } = req.body;
        const sessionPath = path.concat(number);

        if (fs.existsSync(sessionPath)) {
            try {
                con.gas(message, number, to, type);
                res.status(200).json({ status: true, message: "success" });
            } catch (error) {
                res.status(401).json({ status: false, message: error });
            }
        } else {
            res.status(401).json({
                status: false,
                message: "Please scan the QR before using the API",
            });
        }
    }
);

app.post("/device", (req, res) => {
    const deviceNumber = req.body.device;
    res.redirect("/scan/" + deviceNumber);
});

server.listen(port, () => {
    console.log("App running on: " + port);
});

module.exports = app;