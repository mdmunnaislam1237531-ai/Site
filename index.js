const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const admin = require("firebase-admin");
const pino = require("pino");

// তোমার আপলোড করা JSON ফাইলটি এখানে কানেক্ট করা হচ্ছে
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hidndnd-default-rtdb.firebaseio.com"
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
            // নম্বর থেকে স্পেস বা অন্য চিহ্ন সরানো
            const cleanNumber = phone.replace(/[+ ]/g, '');
            const code = await sock.requestPairingCode(cleanNumber);
            
            // ফায়ারবেসে কোডটি পাঠানো
            await db.ref('codes/' + phone).set(code);
            console.log(`নম্বর ${phone} এর জন্য কোড জেনারেট হয়েছে: ${code}`);
        }
    } catch (err) {
        console.log("কোড জেনারেট এরর: ", err);
    }
}

// ফায়ারবেস থেকে নতুন রিকোয়েস্ট চেক করা
db.ref('requests').on('child_added', (snapshot) => {
    const phone = snapshot.key;
    startPairing(phone);
});

console.log("রেন্ডার সার্ভার পুরোপুরি সচল...");
