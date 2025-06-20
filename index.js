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
  const userInput = req.body.SpeechResult?.toLowerCase().trim() || '';

  try {
    // If user says "no", "nothing", or similar, end the call
    if (
      userInput.includes("no") ||
      userInput.includes("nothing") ||
      userInput.includes("that’s all")
    ) {
      response.say("Okay, have a great day!");
      response.hangup();
    } else {
      // Ask OpenAI for a response
      const now = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

      const completion = await openai.chat.completions.create({
        model: "gpt-4", // Use "gpt-3.5-turbo" if you want faster & cheaper
        messages: [
          { role: "system", content: "You are a helpful AI receptionist for a small business." },
          { role: "user", content: `The current time is ${now}. A customer asked: "${userInput}".` },
        ],
      });

      const aiReply = completion.choices[0].message.content;

      response.say(aiReply);
      response.pause({ length: 1 });

      const gather = response.gather({
        input: 'speech',
        timeout: 5,
      });
      gather.say("Is there anything else I can help you with?");
    }

    res.type('text/xml');
    res.send(response.toString());

  } catch (error) {
    console.error("❌ Error in /voice:", error.message);
    response.say("There was an error processing your request. Please try again later.");
    res.type('text/xml');
    res.send(response.toString());
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
