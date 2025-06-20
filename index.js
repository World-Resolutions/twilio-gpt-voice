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
  const voiceResponse = new VoiceResponse();

  try {
    const transcript = req.body.SpeechResult || '';
    const prompt = transcript.trim()
      ? `You are a friendly AI receptionist. The user said: "${transcript}". Reply conversationally and briefly.`
      : "Greet the caller and ask how you can help.";

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: "system", content: "You are a helpful AI receptionist who speaks clearly and politely on the phone." },
        { role: "user", content: prompt }
      ]
    });

    const aiResponse = completion.choices[0].message.content;

    voiceResponse.say({ voice: 'Polly.Joanna', language: 'en-US' }, aiResponse);
    voiceResponse.gather({
      input: 'speech',
      timeout: 5,
      speechTimeout: 'auto',
      action: '/voice',
      method: 'POST'
    });

  } catch (err) {
    console.error("❌ Error in /voice:", err.message);
    voiceResponse.say("Sorry, something went wrong. Please try again later.");
  }

  res.type('text/xml');
  res.send(voiceResponse.toString());
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
