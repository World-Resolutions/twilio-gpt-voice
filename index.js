const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const { twiml: { VoiceResponse } } = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/voice', async (req, res) => {
  const transcript = req.body.SpeechResult || 'Hello';
  const twiml = new VoiceResponse();

  // End the call if the user says "no", "that's all", etc.
  const endWords = ['no', 'nope', 'nothing', "that's all", 'we’re good', 'nah'];
  const lowerTranscript = transcript.trim().toLowerCase();

  if (endWords.some(word => lowerTranscript.includes(word))) {
    twiml.say("Okay! Thanks for calling. Have a great day!");
    twiml.hangup();
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    const prompt = `Act as a helpful and friendly receptionist. Someone said: "${transcript}". Respond politely and ask if there's anything else you can help with.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful AI voice assistant for a small business." },
        { role: "user", content: prompt },
      ],
    });

    const aiResponse = completion.data.choices[0].message.content;

    twiml.gather({
      input: 'speech',
      timeout: 5,
      action: '/voice',
    }).say(aiResponse);

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error("Error in /voice:", error.message);
    twiml.say("Sorry, there was an error processing your request.");
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
