const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { 
  getEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getMyEvents 
} = require('../controllers/eventController');
const { 
  joinEvent, 
  leaveEvent, 
  checkRsvpStatus 
} = require('../controllers/rsvpController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { generateAIDescription } = require('../utils/aiDescription');

// Validation rules for event creation/update
const eventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('time')
    .trim()
    .notEmpty()
    .withMessage('Time is required'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1')
];

const eventUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1')
];

// Public routes
router.get('/', optionalAuth, getEvents);
router.get('/my-events', protect, getMyEvents);
router.get('/:id', optionalAuth, getEvent);

// Protected routes - Event CRUD
router.post('/', protect, upload.single('image'), eventValidation, createEvent);
router.put('/:id', protect, upload.single('image'), eventUpdateValidation, updateEvent);
router.delete('/:id', protect, deleteEvent);

// RSVP routes
router.post('/:id/rsvp', protect, joinEvent);
router.delete('/:id/rsvp', protect, leaveEvent);
router.get('/:id/rsvp-status', protect, checkRsvpStatus);

// AI Description generator route
router.post('/generate-description', protect, async (req, res) => {
  try {
    const { title, category, location, date, time, additionalContext } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({ 
        message: 'Title and category are required for AI generation' 
      });
    }

    const description = await generateAIDescription({
      title,
      category,
      location: location || 'TBD',
      date: date || 'TBD',
      time: time || 'TBD',
      additionalContext
    });

    res.status(200).json({
      success: true,
      description
    });
  } catch (error) {
    console.error('AI description error:', error);
    res.status(500).json({ 
      message: 'Error generating description', 
      error: error.message 
    });
  }
});

module.exports = router;
