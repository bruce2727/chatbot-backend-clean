require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Route di benvenuto / test
app.get('/', (req, res) => {
  res.send('Benvenuto al chatbot backend! La route /chat è attiva.');
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DAILY_TOKEN_LIMIT = 3000;
const tokenUsage = {};

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

    if (!tokenUsage[userId] || tokenUsage[userId].date !== today) {
      tokenUsage[userId] = { date: today, tokensUsed: 0 };
    }

    if (tokenUsage[userId].tokensUsed >= DAILY_TOKEN_LIMIT) {
      return res.status(429).json({ error: 'Hai raggiunto il limite giornaliero di utilizzo token.' });
    }

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

    const reply = response.choices[0].message.content;
    const tokensUsed = response.usage ? response.usage.total_tokens : 0;

    tokenUsage[userId].tokensUsed += tokensUsed;

    console.log(`Token usati da ${userId} oggi: ${tokenUsage[userId].tokensUsed}`);

    res.json({
      reply,
      tokensUsed,
      tokensRemaining: DAILY_TOKEN_LIMIT - tokenUsage[userId].tokensUsed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore interno al server' });
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
