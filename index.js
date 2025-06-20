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

  try {
    const transcript = req.body.SpeechResult || 'Hello';
    const prompt = `Act as a friendly receptionist. Someone said: "${transcript}". Reply politely.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Or "gpt-3.5-turbo" if you want
      messages: [
        { role: "system", content: "You are a helpful AI voice assistant for a business." },
        { role: "user", content: prompt }
      ]
    });

    const aiResponse = completion.choices?.[0]?.message?.content || "Sorry, I had trouble understanding. Could you repeat that?";
    console.log("AI response:", aiResponse);

    twiml.say(aiResponse);
    twiml.pause({ length: 1 });
    twiml.say("Is there anything else I can help you with?");
    twiml.listen({ timeout: 5 });

  } catch (error) {
    console.error("Error in /voice:", error);
    twiml.say("Sorry, there was an error processing your request. Please try again later.");
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
