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
    const prompt = `Act as a friendly receptionist. Someone said: "${transcript}". Reply politely.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful AI voice assistant for a small business.' },
        { role: 'user', content: prompt },
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    const response = new VoiceResponse();
    response.say(aiResponse);
    response.pause({ length: 1 });
    response.say("Is there anything else I can help you with?");
    response.listen(); // allows the user to speak again

    res.type('text/xml');
    res.send(response.toString());

  } catch (error) {
    console.error("❌ Error in /voice:", error.message);
    const response = new VoiceResponse();
    response.say("Sorry, there was an error processing your request. Please try again later.");
    res.type('text/xml');
    res.send(response.toString());
  }
});

// ✅ CORRECT SERVER START
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
