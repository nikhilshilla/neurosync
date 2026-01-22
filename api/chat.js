// check/api/chat.js
const fetch = require('node-fetch');

module.exports = async(req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages, model = "llama-3.1-8b-instant" } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Bad Request: messages array is missing or empty",
                receivedBody: req.body
            });
        }

        if (!process.env.GROQ_API_KEY) {
            console.error("ERROR: GROQ_API_KEY is missing!");
            return res.status(500).json({ error: "Missing GROQ_API_KEY" });
        }

        console.log("📨 Vercel: Calling Groq API with model:", model);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        const data = await response.json();

        console.log("✅ Vercel: Groq response status:", response.status);

        if (!response.ok) {
            console.error("❌ Vercel: Groq error:", data);
            return res.status(response.status).json({
                error: "Groq API Error",
                details: data
            });
        }

        res.json(data);

    } catch (error) {
        console.error("❌ Vercel: Server error:", error);
        res.status(500).json({
            error: error.message,
            fallback: "The AI service is experiencing high demand. Please try again in a moment."
        });
    }
};