const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide an event description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Please provide an event date']
  },
  time: {
    type: String,
    required: [true, 'Please provide an event time']
  },
  location: {
    type: String,
    required: [true, 'Please provide an event location'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide event capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  category: {
    type: String,
    enum: ['conference', 'workshop', 'social', 'sports', 'music', 'art', 'food', 'tech', 'business', 'other'],
    default: 'other'
  },
  image: {
    url: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for spots remaining
eventSchema.virtual('spotsRemaining').get(function() {
  return this.capacity - this.attendees.length;
});

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.attendees.length >= this.capacity;
});

// Virtual for checking if event has passed
eventSchema.virtual('isPast').get(function() {
  return new Date(this.date) < new Date();
});

// Index for efficient queries
eventSchema.index({ date: 1 });
eventSchema.index({ creator: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ title: 'text', description: 'text', location: 'text' });

// Static method for atomic RSVP with concurrency handling
eventSchema.statics.atomicRSVP = async function(eventId, userId, session) {
  // Atomic operation: only adds user if:
  // 1. User is not already in attendees
  // 2. Current attendee count is less than capacity
  const event = await this.findOneAndUpdate(
    {
      _id: eventId,
      attendees: { $ne: userId }, // User not already attending
      $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] } // Has capacity
    },
    {
      $addToSet: { attendees: userId } // Atomic add (prevents duplicates)
    },
    {
      new: true,
      session,
      runValidators: true
    }
  ).populate('creator', 'name email avatar')
   .populate('attendees', 'name email avatar');

  return event;
};

// Static method for atomic RSVP removal
eventSchema.statics.atomicRemoveRSVP = async function(eventId, userId, session) {
  const event = await this.findOneAndUpdate(
    {
      _id: eventId,
      attendees: userId // User must be attending
    },
    {
      $pull: { attendees: userId }
    },
    {
      new: true,
      session
    }
  ).populate('creator', 'name email avatar')
   .populate('attendees', 'name email avatar');

  return event;
};

// Pre-save middleware to ensure data integrity
eventSchema.pre('save', function(next) {
  // Ensure attendees don't exceed capacity
  if (this.attendees.length > this.capacity) {
    next(new Error('Attendees cannot exceed capacity'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
