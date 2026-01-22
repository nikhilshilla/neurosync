const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ DEBUG
console.log("Groq API Key loaded:", process.env.GROQ_API_KEY ? "YES" : "NO");
console.log("First 10 chars:", process.env.GROQ_API_KEY?.substring(0, 10));

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running. Use POST /api/chat");
});

app.post("/api/chat", async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    const { messages } = req.body;

    // ✅ validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Bad Request: messages array is missing or empty",
        receivedBody: req.body,
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("ERROR: API key is missing!");
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ UPDATED WORKING GROQ MODEL
        model: "llama-3.1-8b-instant",
        messages: messages,
      }),
    });

    const data = await r.json();

    console.log("Groq response status:", r.status);

    if (!r.ok) {
      console.error("Groq error:", data);
      return res.status(r.status).json({
        error: "Groq API Error",
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend running: http://localhost:${port}`));
