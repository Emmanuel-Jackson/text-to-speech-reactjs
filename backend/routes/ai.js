const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');

router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Sending to DeepSeek:', message); // Debugging

    const response = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/chat/completions`,
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // Add timeout
      }
    );

    console.log('DeepSeek Response:', response.data); // Debugging

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek');
    }

    res.json({ reply: response.data.choices[0].message.content });

  } catch (error) {
    console.error('AI Route Error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    res.status(500).json({ 
      error: 'AI service unavailable',
      details: error.response?.data?.error?.message || error.message,
      code: error.code
    });
  }
});

module.exports = router;