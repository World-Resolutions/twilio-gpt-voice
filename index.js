app.post('/voice', async (req, res) => {
  try {
    const transcript = req.body.SpeechResult || 'Hello';
    const prompt = `Act as a friendly receptionist. Someone said: "${transcript}". Reply politely.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful AI voice assistant for a small business." },
        { role: "user", content: prompt },
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    const response = new VoiceResponse();
    const gather = response.gather({
      input: 'speech',
      timeout: 5,
      speechTimeout: 'auto',
      action: '/voice', // same route to handle the next input
      method: 'POST',
    });

    gather.say(aiResponse);

    res.type('text/xml');
    res.send(response.toString());

  } catch (error) {
    console.error("Error in /voice:", error.message);
    const response = new VoiceResponse();
    response.say("Sorry, there was an error processing your request. Please try again later.");
    res.type('text/xml');
    res.send(response.toString());
  }
});
