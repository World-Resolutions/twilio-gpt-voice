const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/voice', async (req, res) => {
  const transcript = req.body.SpeechResult || 'Hello';
  const prompt = `Act as a friendly AI receptionist. Someone said: "${transcript}". Respond politely and clearly.`;

  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const response = completion.data.choices[0].message.content;

  const twiml = new VoiceResponse();
  twiml.say(response);
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
