import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Check,
  X,
  Loader2,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate, formatDateTime, getCategoryLabel, getCategoryIcon, getCapacityStatus, getPlaceholderImage, getInitials } from '../utils/helpers'
import api from '../utils/api'
import toast from 'react-hot-toast'

const EventDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`)
      setEvent(response.data.event)
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Event not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Event not found
          </h2>
          <Link to="/" className="btn-primary">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = user?.id === event.creator?._id
  const isAttending = event.attendees?.some(a => a._id === user?.id)
  const capacityInfo = getCapacityStatus(event.attendees?.length || 0, event.capacity)
  const isPast = new Date(event.date) < new Date()

  const handleRSVP = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to RSVP')
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } })
      return
    }

    setRsvpLoading(true)
    try {
      if (isAttending) {
        await api.delete(`/events/${id}/rsvp`)
        toast.success('RSVP cancelled')
      } else {
        await api.post(`/events/${id}/rsvp`)
        toast.success('Successfully RSVPed!')
      }
      fetchEvent() // Refresh event data
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update RSVP'
      toast.error(message)
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.delete(`/events/${id}`)
      toast.success('Event deleted successfully')
      navigate('/')
    } catch (error) {
      toast.error('Failed to delete event')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Image */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img
          src={event.image?.url || getPlaceholderImage(event.category)}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <Link 
          to="/"
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Category Badge */}
        <div className="absolute top-4 right-4">
          <span className="badge-primary text-sm">
            {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
          </span>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container-custom">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(event.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {event.time}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                About This Event
              </h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Location
              </h2>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {event.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Attendees ({event.attendees?.length || 0})
                </h2>
                <span className={`badge badge-${capacityInfo.color}`}>
                  {capacityInfo.label}
                </span>
              </div>
              
              {event.attendees?.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {event.attendees.map((attendee) => (
                    <div 
                      key={attendee._id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getInitials(attendee.name)}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {attendee.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No attendees yet. Be the first to RSVP!
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg sticky top-24">
              {/* Organizer */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                  {getInitials(event.creator?.name)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Organized by</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {event.creator?.name}
                  </p>
                </div>
              </div>

              {/* Event Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(event.date, event.time)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.attendees?.length || 0} / {event.capacity} spots filled
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      capacityInfo.status === 'full' ? 'bg-red-500' :
                      capacityInfo.status === 'almostFull' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(((event.attendees?.length || 0) / event.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              {isPast ? (
                <div className="text-center py-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    This event has ended
                  </p>
                </div>
              ) : isCreator ? (
                <div className="space-y-3">
                  <Link 
                    to={`/edit-event/${id}`}
                    className="btn-primary w-full py-3"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </Link>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger w-full py-3"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRSVP}
                  disabled={rsvpLoading || (capacityInfo.status === 'full' && !isAttending)}
                  className={`w-full py-3 ${
                    isAttending 
                      ? 'btn-secondary' 
                      : capacityInfo.status === 'full'
                        ? 'btn bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-primary'
                  }`}
                >
                  {rsvpLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isAttending ? (
                    <>
                      <UserMinus className="w-5 h-5 mr-2" />
                      Cancel RSVP
                    </>
                  ) : capacityInfo.status === 'full' ? (
                    'Event Full'
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      RSVP Now
                    </>
                  )}
                </button>
              )}

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="btn-secondary w-full py-3 mt-3"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Event?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. All RSVPs will be cancelled.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary flex-1 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="btn-danger flex-1 py-2.5"
              >
                {deleteLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetails
