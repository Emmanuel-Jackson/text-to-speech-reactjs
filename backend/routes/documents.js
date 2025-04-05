const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('documents');
    res.json(user.documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { documents: { title, content } } },
      { new: true }
    );
    
    res.json(user.documents[user.documents.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:docId', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const user = await User.findOneAndUpdate(
      { 
        _id: req.user.id,
        'documents._id': req.params.docId 
      },
      { 
        $set: { 
          'documents.$.title': title,
          'documents.$.content': content,
          'documents.$.updatedAt': new Date()
        } 
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const updatedDoc = user.documents.find(doc => doc._id.toString() === req.params.docId);
    res.json(updatedDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:docId', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { documents: { _id: req.params.docId } } }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;