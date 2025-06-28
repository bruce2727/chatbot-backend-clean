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

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sei il tutor AI del corso, rispondi solo a domande pertinenti agli argomenti del corso in modo semplice, chiaro e amichevole.',
        },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content || response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore interno al server' });
  }
});

const port = process.env.PORT || 3000; // Usa la porta fornita da Render, altrimenti 3000
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});

