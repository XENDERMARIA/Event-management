const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const { deleteImage } = require('../middleware/upload');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 12,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Search by title, description, or location
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    } else {
      // By default, only show upcoming events
      query.date = { $gte: new Date() };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('creator', 'name email avatar')
        .populate('attendees', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      message: 'Error fetching events', 
      error: error.message 
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name email avatar')
      .populate('attendees', 'name email avatar');

    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found' 
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ 
      message: 'Error fetching event', 
      error: error.message 
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { title, description, date, time, location, capacity, category, image } = req.body;

    // Create event data
    const eventData = {
      title,
      description,
      date: new Date(date),
      time,
      location,
      capacity: parseInt(capacity),
      category: category || 'other',
      creator: req.user.id
    };

    // Handle image from request body (Cloudinary URL from frontend upload)
    if (image) {
      eventData.image = {
        url: image.url || image,
        publicId: image.publicId || ''
      };
    }

    // Handle file upload from multer
    if (req.file) {
      eventData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const event = await Event.create(eventData);

    // Populate creator info
    await event.populate('creator', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ 
      message: 'Error creating event', 
      error: error.message 
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (owner only)
const updateEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found' 
      });
    }

    // Check ownership
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized to update this event' 
      });
    }

    const { title, description, date, time, location, capacity, category, image } = req.body;

    // Build update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (location) updateData.location = location;
    if (category) updateData.category = category;
    
    // Handle capacity update - ensure it's not less than current attendees
    if (capacity) {
      const newCapacity = parseInt(capacity);
      if (newCapacity < event.attendees.length) {
        return res.status(400).json({ 
          message: `Capacity cannot be less than current attendees (${event.attendees.length})` 
        });
      }
      updateData.capacity = newCapacity;
    }

    // Handle image update
    if (image) {
      // Delete old image from Cloudinary if exists
      if (event.image.publicId) {
        await deleteImage(event.image.publicId);
      }
      updateData.image = {
        url: image.url || image,
        publicId: image.publicId || ''
      };
    }

    // Handle file upload from multer
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (event.image.publicId) {
        await deleteImage(event.image.publicId);
      }
      updateData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('creator', 'name email avatar')
    .populate('attendees', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ 
      message: 'Error updating event', 
      error: error.message 
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (owner only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found' 
      });
    }

    // Check ownership
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this event' 
      });
    }

    // Delete image from Cloudinary if exists
    if (event.image.publicId) {
      await deleteImage(event.image.publicId);
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      message: 'Error deleting event', 
      error: error.message 
    });
  }
};

// @desc    Get user's created events
// @route   GET /api/events/my-events
// @access  Private
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ creator: req.user.id })
      .populate('creator', 'name email avatar')
      .populate('attendees', 'name email avatar')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ 
      message: 'Error fetching your events', 
      error: error.message 
    });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents
};
