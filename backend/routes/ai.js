const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');

router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await axios.post(
      `${process.env.DEEPSEEK_API_URL}/chat/completions`,
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('DeepSeek Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'AI processing failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;