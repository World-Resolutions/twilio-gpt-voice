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
    const prompt = `Act as a friendly receptionist. A caller said: "${transcript}". Reply politely and ask what else you can help with.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" if you prefer
      messages: [
        { role: "system", content: "You are a helpful AI voice assistant." },
        { role: "user", content: prompt }
      ],
    });

    const aiResponse = completion.data.choices[0].message.content;

    const response = new VoiceResponse();
    response.say({ voice: 'Polly.Joanna', language: 'en-US' }, aiResponse);

    response.gather({
      input: 'speech',
      action: '/voice',
      method: 'POST',
      speechTimeout: 'auto'
    });
