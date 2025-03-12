const router = require('express').Router();
const { HfInference } = require('@huggingface/inference');
const auth = require('../middleware/auth');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message?.trim() || message.length > 500) {
      return res.status(400).json({ 
        error: 'Message must be 1-500 characters' 
      });
    }

    // Use LLaMA 2-7b-chat model
    const response = await hf.textGeneration({
      model: 'meta-llama/Llama-2-7b-chat-hf',
      inputs: `<s>[INST] ${message} [/INST]`,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        repetition_penalty: 1.2
      }
    });

    if (!response.generated_text) {
      throw new Error('Empty response from AI');
    }

    res.json({ reply: response.generated_text });

  } catch (error) {
    console.error('AI Error:', error.message);
    res.status(500).json({
      error: 'AI service error',
      details: error.message.includes('quota') 
        ? 'Free tier limit reached' 
        : error.message
    });
  }
});

module.exports = router;