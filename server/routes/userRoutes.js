const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyRsvps } = require('../controllers/rsvpController');
const Event = require('../models/Event');
const User = require('../models/User');

// Get user's RSVPed events
router.get('/my-rsvps', protect, getMyRsvps);

// Get user's dashboard stats
router.get('/dashboard-stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts in parallel for better performance
    const [createdEvents, rsvpedEvents, upcomingCreated, upcomingRsvps] = await Promise.all([
      Event.countDocuments({ creator: userId }),
      Event.countDocuments({ attendees: userId }),
      Event.countDocuments({ 
        creator: userId, 
        date: { $gte: new Date() } 
      }),
      Event.countDocuments({ 
        attendees: userId, 
        date: { $gte: new Date() } 
      })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCreated: createdEvents,
        totalRsvps: rsvpedEvents,
        upcomingCreated,
        upcomingRsvps
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard stats', 
      error: error.message 
    });
  }
});

// Get user profile by ID (public info only)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's public events
    const publicEvents = await Event.find({ 
      creator: req.params.id,
      isActive: true,
      date: { $gte: new Date() }
    })
    .select('title date location image category')
    .sort({ date: 1 })
    .limit(5);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        memberSince: user.createdAt
      },
      upcomingEvents: publicEvents
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile', 
      error: error.message 
    });
  }
});

module.exports = router;
