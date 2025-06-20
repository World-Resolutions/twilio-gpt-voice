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
  const transcript = req.body.SpeechResult || 'Hello';
  const prompt = `Act as a friendly receptionist. Someone said: "${transcript}". Reply clearly and helpfully.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful AI receptionist for a business answering the phone.' },
        { role: 'user', content: prompt }
      ]
    });

    const responseText = completion.choices[0].message.content;

    const twiml = new VoiceResponse();
    twiml.say({ voice: 'Polly.Joanna', language: 'en-US' }, responseText);
    twiml.pause({ length: 2 });
    twiml.say("Is there anything else I can help you with?");
    twiml.pause({ length: 5 });

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error("Error in /voice:", error.message);

    const twiml = new VoiceResponse();
    twiml.say("Sorry, there was an error processing your request. Please try again later.");
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
