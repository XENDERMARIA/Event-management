import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Plus, 
  Users, 
  CalendarCheck,
  CalendarPlus,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../utils/api'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('created')
  const [createdEvents, setCreatedEvents] = useState([])
  const [rsvpEvents, setRsvpEvents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [createdRes, rsvpRes, statsRes] = await Promise.all([
          api.get('/events/my-events'),
          api.get('/users/my-rsvps'),
          api.get('/users/dashboard-stats')
        ])

        setCreatedEvents(createdRes.data.events)
        setRsvpEvents(rsvpRes.data.events)
        setStats(statsRes.data.stats)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const tabs = [
    { id: 'created', label: 'My Events', icon: CalendarPlus, count: createdEvents.length },
    { id: 'attending', label: 'Attending', icon: CalendarCheck, count: rsvpEvents.length }
  ]

  const currentEvents = activeTab === 'created' ? createdEvents : rsvpEvents

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's an overview of your events
              </p>
            </div>
            <Link to="/create-event" className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <CalendarPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalCreated}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Events Created
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalRsvps}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Events Attending
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.upcomingCreated}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upcoming Hosted
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.upcomingRsvps}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upcoming RSVPs
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {activeTab === 'created' 
                    ? "You haven't created any events yet"
                    : "You haven't RSVPed to any events yet"
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {activeTab === 'created'
                    ? "Start by creating your first event!"
                    : "Browse events and find something you're interested in!"
                  }
                </p>
                {activeTab === 'created' ? (
                  <Link to="/create-event" className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Link>
                ) : (
                  <Link to="/" className="btn-primary">
                    Browse Events
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
