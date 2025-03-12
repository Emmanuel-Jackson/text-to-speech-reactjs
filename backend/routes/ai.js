router.post('/chat', auth, async (req, res) => {
    try {
      const { message } = req.body;
      
      // Add validation
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          error: 'Invalid message format' 
        });
      }
  
      console.log('Sending to DeepSeek:', message); // Add logging
      
      const response = await axios.post(
        `${process.env.DEEPSEEK_API_URL}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: [{ 
            role: "user", 
            content: message.substring(0, 1000) // Limit message length
          }],
          temperature: 0.7,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // Add timeout
        }
      );
  
      console.log('DeepSeek Response:', response.data); // Add logging
      
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from DeepSeek');
      }
  
      res.json({ 
        reply: response.data.choices[0].message.content 
      });
  
    } catch (error) {
      console.error('Full Error:', {
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