import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EventForm from '../components/EventForm'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CreateEvent = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      const response = await api.post('/events', formData)
      toast.success('Event created successfully!')
      navigate(`/events/${response.data.event._id}`)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Create New Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Fill in the details below to create your event
          </p>
        </div>

        {/* Form Card */}
        <div className="max-w-3xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <EventForm 
              onSubmit={handleSubmit}
              isLoading={loading}
              submitLabel="Create Event"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateEvent
