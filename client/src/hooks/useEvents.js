import { useState, useCallback } from 'react'
import api from '../utils/api'

export const useEvents = () => {
  const [events, setEvents] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/events?${queryString}`)
      setEvents(response.data.events)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEvent = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/events/${id}`)
      setEvent(response.data.event)
      return response.data.event
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createEvent = useCallback(async (eventData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/events', eventData)
      return response.data.event
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateEvent = useCallback(async (id, eventData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.put(`/events/${id}`, eventData)
      return response.data.event
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteEvent = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await api.delete(`/events/${id}`)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const rsvpToEvent = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post(`/events/${id}/rsvp`)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to RSVP')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelRsvp = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.delete(`/events/${id}/rsvp`)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel RSVP')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    events,
    event,
    loading,
    error,
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
    cancelRsvp
  }
}

export default useEvents
