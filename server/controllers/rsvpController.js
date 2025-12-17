const mongoose = require('mongoose');
const Event = require('../models/Event');

/**
 * RSVP Controller
 * 
 * This controller handles the critical business logic for event RSVPs.
 * It implements atomic operations with MongoDB to prevent race conditions
 * and ensure data integrity when multiple users attempt to RSVP simultaneously.
 * 
 * Key concurrency handling strategies:
 * 1. Atomic findOneAndUpdate with conditional queries
 * 2. MongoDB transactions for ACID compliance
 * 3. $addToSet for idempotent operations
 * 4. Conditional expressions ($expr) for capacity checks
 */

// @desc    RSVP to an event (Join)
// @route   POST /api/events/:id/rsvp
// @access  Private
const joinEvent = async (req, res) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    /**
     * ATOMIC RSVP OPERATION
     * 
     * This is the critical section that handles concurrency.
     * The findOneAndUpdate operation is atomic - MongoDB guarantees that
     * the read and write happen as a single, indivisible operation.
     * 
     * The query conditions ensure that:
     * 1. The event exists
     * 2. The user is NOT already in the attendees array
     * 3. The current number of attendees is LESS than the capacity
     * 
     * Only if ALL conditions are met will the update execute.
     * This prevents race conditions where two users try to claim the last spot.
     */
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        // Condition: User is not already attending
        attendees: { $ne: userId },
        // Condition: Event has available capacity
        // $expr allows comparing fields within the same document
        $expr: { 
          $lt: [
            { $size: '$attendees' }, // Current attendee count
            '$capacity'              // Maximum capacity
          ] 
        }
      },
      {
        // $addToSet ensures the user is added only once (idempotent)
        // Even if this operation is somehow called twice, it won't duplicate
        $addToSet: { attendees: userId }
      },
      {
        new: true,        // Return the updated document
        session,          // Use the transaction session
        runValidators: true
      }
    )
    .populate('creator', 'name email avatar')
    .populate('attendees', 'name email avatar');

    // If event is null, the atomic operation failed
    // We need to determine WHY it failed to give a helpful error message
    if (!event) {
      await session.abortTransaction();
      session.endSession();

      // Fetch the event separately to determine the failure reason
      const existingEvent = await Event.findById(eventId);

      if (!existingEvent) {
        return res.status(404).json({ 
          message: 'Event not found' 
        });
      }

      // Check if event date has passed
      if (new Date(existingEvent.date) < new Date()) {
        return res.status(400).json({ 
          message: 'Cannot RSVP to a past event' 
        });
      }

      // Check if user is the creator (optional: prevent creators from RSVPing)
      if (existingEvent.creator.toString() === userId) {
        return res.status(400).json({ 
          message: 'Event creators are automatically attending their events' 
        });
      }

      // Check if user already RSVPed
      if (existingEvent.attendees.map(a => a.toString()).includes(userId)) {
        return res.status(400).json({ 
          message: 'You have already RSVPed to this event' 
        });
      }

      // Must be at capacity
      if (existingEvent.attendees.length >= existingEvent.capacity) {
        return res.status(400).json({ 
          message: 'Sorry, this event is at full capacity',
          spotsRemaining: 0
        });
      }

      // Unknown failure
      return res.status(400).json({ 
        message: 'Unable to RSVP. Please try again.' 
      });
    }

    // Success! Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Successfully RSVPed to event!',
      event,
      spotsRemaining: event.capacity - event.attendees.length
    });

  } catch (error) {
    // Rollback transaction on any error
    await session.abortTransaction();
    session.endSession();

    console.error('Join event error:', error);

    // Handle specific MongoDB errors
    if (error.name === 'MongoError' && error.code === 112) {
      // WriteConflict - transaction conflict
      return res.status(409).json({ 
        message: 'Concurrent update detected. Please try again.' 
      });
    }

    res.status(500).json({ 
      message: 'Error joining event', 
      error: error.message 
    });
  }
};

// @desc    Cancel RSVP (Leave event)
// @route   DELETE /api/events/:id/rsvp
// @access  Private
const leaveEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    /**
     * ATOMIC RSVP REMOVAL
     * 
     * Similar to joining, we use an atomic operation for leaving.
     * The query ensures the user IS in the attendees array before removing.
     */
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        // Condition: User must be in attendees to leave
        attendees: userId
      },
      {
        // $pull removes the user from the array atomically
        $pull: { attendees: userId }
      },
      {
        new: true,
        session
      }
    )
    .populate('creator', 'name email avatar')
    .populate('attendees', 'name email avatar');

    if (!event) {
      await session.abortTransaction();
      session.endSession();

      // Check why the operation failed
      const existingEvent = await Event.findById(eventId);

      if (!existingEvent) {
        return res.status(404).json({ 
          message: 'Event not found' 
        });
      }

      return res.status(400).json({ 
        message: 'You are not RSVPed to this event' 
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Successfully cancelled your RSVP',
      event,
      spotsRemaining: event.capacity - event.attendees.length
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Leave event error:', error);
    res.status(500).json({ 
      message: 'Error cancelling RSVP', 
      error: error.message 
    });
  }
};

// @desc    Get user's RSVPed events
// @route   GET /api/users/my-rsvps
// @access  Private
const getMyRsvps = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({ 
      attendees: userId,
      isActive: true
    })
    .populate('creator', 'name email avatar')
    .populate('attendees', 'name email avatar')
    .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Get RSVPs error:', error);
    res.status(500).json({ 
      message: 'Error fetching your RSVPs', 
      error: error.message 
    });
  }
};

// @desc    Check RSVP status for an event
// @route   GET /api/events/:id/rsvp-status
// @access  Private
const checkRsvpStatus = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found' 
      });
    }

    const isAttending = event.attendees.map(a => a.toString()).includes(userId);
    const isCreator = event.creator.toString() === userId;

    res.status(200).json({
      success: true,
      isAttending,
      isCreator,
      spotsRemaining: event.capacity - event.attendees.length,
      isFull: event.attendees.length >= event.capacity
    });
  } catch (error) {
    console.error('Check RSVP status error:', error);
    res.status(500).json({ 
      message: 'Error checking RSVP status', 
      error: error.message 
    });
  }
};

module.exports = {
  joinEvent,
  leaveEvent,
  getMyRsvps,
  checkRsvpStatus
};
