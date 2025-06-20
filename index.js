const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/', (req, res) => {
  res.send('✅ Twilio GPT Voice Assistant is live');
});

app.post('/voice', async (req, res) => {
  const voiceResponse = new VoiceResponse();
  const transcript = (req.body.SpeechResult || '').toLowerCase().trim();

  try {
    // Check if caller is ending the conversation
    const endPhrases = ['no', 'nope', 'nothing', 'nothing else', 'that\'s it', 'goodbye', 'bye', 'we\'re done', 'i\'m good'];
    const shouldHangUp = endPhrases.some(phrase => transcript.includes(phrase));

    if (shouldHangUp) {
      voiceResponse.say({ voice: 'Polly.Joanna', language: 'en-US' }, 'Okay, thank you for calling. Goodbye!');
      voiceResponse.hangup();
    } else {
      const prompt = transcript
        ? `The user said: "${transcript}". Respond clearly and politely like a helpful receptionist.`
        : "Greet the caller and ask how you can help.";

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: "system", content: "You are a friendly, polite AI receptionist." },
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
    }

  } catch (err) {
    console.error("❌ Error in /voice:", err.message);
    voiceResponse.say("Sorry, something went wrong. Please try again later.");
  }

  res.type('text/xml');
  res.send(voiceResponse.toString());
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
