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
    const prompt = `Act as a helpful AI receptionist. A caller said: "${transcript}". Respond kindly and ask how else you can assist.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" if you want faster/cheaper
      messages: [
        { role: "system", content: "You are a helpful AI receptionist that responds clearly and professionally." },
        { role: "user", content: prompt },
      ],
    });

    const aiResponse = completion.data.choices[0].message.content;

    const twiml = new VoiceResponse();
    twiml.say({ voice: 'Polly.Joanna' }, aiResponse); // You can change to another voice later

    // Continue listening after response
    twiml.gather({
      input: 'speech',
      action: '/voice',
      method: 'POST',
      speechTimeout: 'auto'
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error in /voice:", error);
    const twiml = new VoiceResponse();
    twiml.say("Sorry, something went wrong. Please try again later.");
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
