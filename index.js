require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Imposta qui il limite giornaliero token per utente
const DAILY_TOKEN_LIMIT = 3000;

// Storage in memoria per il consumo token giornaliero per utente
const tokenUsage = {};

// Funzione per ottenere la data corrente in formato YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

app.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId e message sono obbligatori' });
    }

    const today = getTodayDate();

    // Inizializza o resetta il contatore se il giorno è cambiato
    if (!tokenUsage[userId] || tokenUsage[userId].date !== today) {
      tokenUsage[userId] = { date: today, tokensUsed: 0 };
    }

    // Controlla se l'utente ha superato il limite token
    if (tokenUsage[userId].tokensUsed >= DAILY_TOKEN_LIMIT) {
      return res.status(429).json({ error: 'Hai raggiunto il limite giornaliero di utilizzo token.' });
    }

    // Chiamata API OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sei un tutor AI specializzato nel supporto agli insegnanti. Rispondi in modo professionale e chiaro.`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content || response.data.choices[0].message.content;

    // Aggiorna il conteggio token usati
    const tokensUsed = response.usage ? response.usage.total_tokens : 0;
    tokenUsage[userId].tokensUsed += tokensUsed;

    res.json({ reply, tokensUsed, tokensRemaining: DAILY_TOKEN_LIMIT - tokenUsage[userId].tokensUsed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore interno al server' });
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
