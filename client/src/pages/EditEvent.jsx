import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EventForm from '../components/EventForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

const EditEvent = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${id}`)
        const eventData = response.data.event

        // Check ownership
        if (eventData.creator._id !== user?.id) {
          toast.error('You are not authorized to edit this event')
          navigate(`/events/${id}`)
          return
        }

        setEvent(eventData)
      } catch (error) {
        toast.error('Event not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id, user, navigate])

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    try {
      await api.put(`/events/${id}`, formData)
      toast.success('Event updated successfully!')
      navigate(`/events/${id}`)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update event'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={`/events/${id}`}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Edit Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update the details of your event
          </p>
        </div>

        {/* Form Card */}
        <div className="max-w-3xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <EventForm 
              initialData={event}
              onSubmit={handleSubmit}
              isLoading={submitting}
              submitLabel="Update Event"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditEvent
