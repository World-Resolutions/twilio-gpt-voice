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
  const response = new VoiceResponse();

  try {
    const transcript = req.body.SpeechResult?.toLowerCase().trim() || '';

    // Check if user wants to end the call
    if (transcript.includes('no') || transcript.includes('nothing') || transcript.includes('that’s all')) {
      response.say("Okay, have a great day!");
      response.hangup();
    } else {
      // AI generates a reply to the question
      const now = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
      const prompt = `The current time is ${now}. A customer said: "${transcript}". Respond like a friendly receptionist.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4", // or "gpt-3.5-turbo"
        messages: [
          { role: "system", content: "You are a helpful AI voice assistant for a small business." },
          { role: "user", content: prompt },
        ],
      });

      const aiResponse = completion.choices[0].message.content;

      response.say(aiResponse);
      response.pause({ length: 1 });
      response.say("Is there anything else I can help you with?");
      response.listen({ timeout: 5 });
    }

    res.type('text/xml');
    res.send(response.toString());

  } catch (error) {
    console.error("Error in /voice:", error.message);
    response.say("Sorry, there was an error processing your request. Please try again later.");
    res.type('text/xml');
    res.send(response.toString());
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
