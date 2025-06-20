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
  const twiml = new VoiceResponse();
  const userSaid = req.body.SpeechResult;

  if (!userSaid) {
    // First interaction: greet and gather voice input
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice',
      method: 'POST',
      speechTimeout: 'auto'
    });
    gather.say('Hello! How can I assist you today?');

  } else {
    // Handle user response with OpenAI
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI phone assistant.' },
          { role: 'user', content: userSaid }
        ]
      });

      const responseText = completion.data.choices[0].message.content;

      const gather = twiml.gather({
        input: 'speech',
        action: '/voice',
        method: 'POST',
        speechTimeout: 'auto'
      });
      gather.say(responseText);
      twiml.pause({ length: 1 });

    } catch (error) {
      console.error("OpenAI Error:", error.message);
      twiml.say("Sorry, something went wrong while processing your request.");
    }
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
