const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const { twiml: { VoiceResponse } } = require('twilio');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/voice', async (req, res) => {
  try {
    const transcript = req.body.SpeechResult || 'Hello';
    const prompt = `Act as a friendly, helpful receptionist. A caller just said: "${transcript}". Respond clearly and ask how you can help next.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // change to gpt-3.5-turbo if needed
      messages: [
        { role: "system", content: "You are a polite and helpful AI receptionist for a small business." },
        { role: "user", content: prompt }
      ],
    });

    const aiReply = completion.data.choices[0].message.content;

    const response = new VoiceResponse();
    response.say({ voice: 'Polly.Joanna', language: 'en-US' },
