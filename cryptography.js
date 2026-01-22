// cryptography.js
// All operations happen locally using Web Crypto API. [file:1]

let aesKey = null;
let rsaKeyPair = null;

const $ = (id) => document.getElementById(id);

function setMode(text, running) {
  $("visMode").textContent = text;
  $("cryptoStream").classList.toggle("active", !!running);
}

function initBlocks() {
  const container = $("cryptoBlocks");
  container.innerHTML = "";
  for (let i = 0; i < 60; i++) {
    const b = document.createElement("div");
    b.className = "crypto-block";
    container.appendChild(b);
  }
}

function pulseBlocks(ms = 900) {
  const blocks = [...document.querySelectorAll(".crypto-block")];
  const start = performance.now();
  function tick(t) {
    const p = Math.min(1, (t - start) / ms);
    blocks.forEach((b, i) => {
      const on = Math.random() < (0.25 + 0.35 * p);
      b.classList.toggle("on", on);
    });
    if (p < 1) requestAnimationFrame(tick);
    else blocks.forEach((b) => b.classList.remove("on"));
  }
  requestAnimationFrame(tick);
}

function bufToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

function abToB64(ab) {
  const bytes = new Uint8Array(ab);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function exportAesKeyHex(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufToHex(raw);
}

async function exportRsaPublicPem(key) {
  const spki = await crypto.subtle.exportKey("spki", key);
  const b64 = abToB64(spki);
  const lines = b64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

async function exportRsaPrivatePem(key) {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", key);
  const b64 = abToB64(pkcs8);
  const lines = b64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return bufToHex(digest);
}

async function generateKeys() {
  setMode("Generating Keys", true);
  pulseBlocks(900);

  $("cryptoOutput").textContent = "Generating keys...";
  $("securityTitle").textContent = "Generating";
  $("securitySub").textContent = "Creating AES + RSA key material...";

  const t0 = performance.now();

  // AES-256-GCM key
  aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // RSA-2048 for signatures
  rsaKeyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  );

  const aesHex = await exportAesKeyHex(aesKey);
  const pubPem = await exportRsaPublicPem(rsaKeyPair.publicKey);
  const privPem = await exportRsaPrivatePem(rsaKeyPair.privateKey);

  $("aesKeyView").textContent = aesHex;
  $("rsaPublicView").textContent = pubPem;
  $("rsaPrivateView").textContent = privPem;

  $("keyStrength").textContent = "AES‑256 + RSA‑2048";

  const t1 = performance.now();
  $("encryptionTime").textContent = `${Math.round(t1 - t0)}ms`;

  $("btnEncrypt").disabled = false;
  $("btnSign").disabled = false;

  $("cryptoOutput").textContent =
`Keys generated successfully.

AES Key (hex) and RSA keys (PEM) are displayed in the right panel.`;

  $("securityTitle").textContent = "Ready";
  $("securitySub").textContent = "AES‑256‑GCM + RSA‑2048";

  setMode("Idle", false);
}

async function encryptAndHash() {
  if (!aesKey) {
    $("cryptoOutput").textContent = "Generate keys first.";
    return;
  }

  const msg = $("cryptoMessage").value || "";
  if (!msg.trim()) {
    $("cryptoOutput").textContent = "Enter a message first.";
    return;
  }

  setMode("Encrypt + Hash", true);
  pulseBlocks(900);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBytes = new TextEncoder().encode(msg);

  const t0 = performance.now();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plainBytes
  );
  const t1 = performance.now();

  $("encryptionTime").textContent = `${Math.round(t1 - t0)}ms`;

  // hash original message
  const h0 = performance.now();
  const hashHex = await sha256Hex(msg);
  const h1 = performance.now();
  const hashesPerSec = 1000 / Math.max(1, (h1 - h0));
  $("hashesPerSec").textContent = `${hashesPerSec.toFixed(1)}`;

  $("hashOriginal").textContent = msg;
  $("hashValue").textContent = hashHex;

  const ivHex = bufToHex(iv.buffer);
  const ctHex = bufToHex(ciphertext);

  $("cryptoOutput").textContent =
`AES‑256‑GCM Encryption + SHA‑256 Hash

IV (hex):
${ivHex}

Ciphertext (hex):
${ctHex}

SHA‑256(message):
${hashHex}`;

  $("securityTitle").textContent = "Encrypted";
  $("securitySub").textContent = "AES‑GCM done, hash computed";

  setMode("Idle", false);
}

async function signAndVerify() {
  if (!rsaKeyPair) {
    $("cryptoOutput").textContent = "Generate keys first.";
    return;
  }

  const msg = $("cryptoMessage").value || "";
  if (!msg.trim()) {
    $("cryptoOutput").textContent = "Enter a message first.";
    return;
  }

  setMode("Sign + Verify", true);
  pulseBlocks(900);

  const data = new TextEncoder().encode(msg);

  const signature = await crypto.subtle.sign(
    { name: "RSA-PSS", saltLength: 32 },
    rsaKeyPair.privateKey,
    data
  );

  const ok = await crypto.subtle.verify(
    { name: "RSA-PSS", saltLength: 32 },
    rsaKeyPair.publicKey,
    signature,
    data
  );

  const sigHex = bufToHex(signature);

  $("cryptoOutput").textContent =
`RSA‑PSS (SHA‑256) Signature

Signature (hex):
${sigHex}

Verification:
${ok ? "VALID ✅" : "INVALID ❌"}`;

  $("securityTitle").textContent = ok ? "Verified" : "Verify Failed";
  $("securitySub").textContent = "RSA‑PSS sign/verify complete";

  setMode("Idle", false);
}

document.addEventListener("DOMContentLoaded", () => {
  initBlocks();
  setMode("Idle", false);

  $("btnGenKeys").addEventListener("click", () => {
    generateKeys().catch((err) => {
      console.error(err);
      $("cryptoOutput").textContent = "Error generating keys: " + err.message;
      $("securityTitle").textContent = "Error";
      $("securitySub").textContent = err.message;
      setMode("Error", false);
    });
  });

  $("btnEncrypt").addEventListener("click", () => {
    encryptAndHash().catch((err) => {
      console.error(err);
      $("cryptoOutput").textContent = "Error: " + err.message;
      $("securityTitle").textContent = "Error";
      $("securitySub").textContent = err.message;
      setMode("Error", false);
    });
  });

  $("btnSign").addEventListener("click", () => {
    signAndVerify().catch((err) => {
      console.error(err);
      $("cryptoOutput").textContent = "Error: " + err.message;
      $("securityTitle").textContent = "Error";
      $("securitySub").textContent = err.message;
      setMode("Error", false);
    });
  });
});
