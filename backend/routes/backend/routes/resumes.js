const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all resumes for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single resume
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create resume
router.post(
  '/',
  [auth, body('title').notEmpty().withMessage('Title is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, template_id, resume_data } = req.body;

    try {
      const result = await db.query(
        'INSERT INTO resumes (user_id, title, template_id, resume_data, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [req.userId, title, template_id || 'modern', JSON.stringify(resume_data || {})]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update resume
router.put('/:id', auth, async (req, res) => {
  const { title, template_id, resume_data } = req.body;

  try {
    const result = await db.query(
      'UPDATE resumes SET title = $1, template_id = $2, resume_data = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, template_id, JSON.stringify(resume_data), req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete resume
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
```

---

### 7. `backend/.env.example`
```
# Database (from Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Environment
NODE_ENV=production
PORT=5000
