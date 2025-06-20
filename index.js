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
  const vr = new VoiceResponse();

  try {
    const transcript = req.body.SpeechResult || 'Hello';
    const prompt = `Act as a friendly receptionist. Someone said: "${transcript}". Reply politely.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" if preferred
      messages: [
        { role: "system", content: "You are a helpful AI voice assistant for a small business." },
        { role: "user", content: prompt }
      ]
    });

    const aiResponse = completion.choices?.[0]?.message?.content || "Sorry, I didn't catch that.";

    const gather = vr.gather({
      input: 'speech',
      timeout: 5,
      speechTimeout: 'auto',
      action: '/voice',
      method: 'POST'
    });

    gather.say(aiResponse);
    vr.redirect('/voice'); // In case no input is given

  } catch (error) {
    console.error("Error in /voice:", error);
    vr.say("Sorry, there was an error processing your request. Please try again later.");
  }

  res.type('text/xml');
  res.send(vr.toString());
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
