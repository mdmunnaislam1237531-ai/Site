const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const admin = require("firebase-admin");
const pino = require("pino");

// তোমার আপলোড করা JSON ফাইলটি এখানে কানেক্ট করা হচ্ছে
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hidndnd-default-rtdb.firebaseio.com/"
});
const db = admin.database();

async function startPairing(phone) {
    const { state, saveCreds } = await useMultiFileAuthState('sessions/' + phone);
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    try {
        if (!sock.authState.creds.registered) {
            await delay(3000); 
            const code = await sock.requestPairingCode(phone.trim());
            await db.ref('codes/' + phone).set(code);
            console.log(`Success: ${phone} -> ${code}`);
        }
    } catch (err) {
        console.log("Error: ", err);
    }
}

// ফায়ারবেস থেকে নতুন রিকোয়েস্ট চেক করা
db.ref('requests').on('child_added', (snapshot) => {
    const phone = snapshot.key;
    startPairing(phone);
});

console.log("Server is running...");
