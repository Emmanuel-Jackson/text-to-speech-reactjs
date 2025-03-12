const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');

router.post('/chat', auth, async (req, res) => {
    try {
      console.log('[DEBUG] Headers:', req.headers);
      console.log('[DEBUG] Auth User:', req.user);
      console.log('[DEBUG] Request Body:', req.body);
  
      const { message } = req.body;
      
      // Add validation
      if (!message || typeof message !== 'string') {
        console.log('[ERROR] Invalid message format');
        return res.status(400).json({ error: 'Invalid message format' });
      }
  
      console.log('[DEBUG] Sending to DeepSeek:', message.substring(0, 50));
  
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
          timeout: 10000
        }
      );
  
      console.log('[DEBUG] DeepSeek Response:', response.data);
  
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from DeepSeek');
      }
  
      res.json({ reply: response.data.choices[0].message.content });
  
    } catch (error) {
      console.error('[ERROR] Full Error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack
      });
      
      res.status(500).json({ 
        error: 'AI service unavailable',
        details: error.response?.data?.error?.message || error.message
      });
    }
  });

module.exports = router;