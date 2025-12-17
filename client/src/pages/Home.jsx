import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react'
import EventCard from '../components/EventCard'
import SearchFilter from '../components/SearchFilter'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../utils/api'

const Home = () => {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  })

  const initialCategory = searchParams.get('category') || 'all'

  const fetchEvents = async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category)
      }
      if (filters.page) params.append('page', filters.page)
      
      // Handle date range
      if (filters.dateRange && filters.dateRange !== 'all') {
        const today = new Date()
        let startDate, endDate

        switch (filters.dateRange) {
          case 'today':
            startDate = today.toISOString()
            endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString()
            break
          case 'week':
            startDate = today.toISOString()
            endDate = new Date(today.setDate(today.getDate() + 7)).toISOString()
            break
          case 'month':
            startDate = new Date().toISOString()
            endDate = new Date(today.setMonth(today.getMonth() + 1)).toISOString()
            break
          default:
            break
        }

        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
      }

      const response = await api.get(`/events?${params.toString()}`)
      setEvents(response.data.events)
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      })
    } catch (err) {
      setError('Failed to load events. Please try again.')
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents({ category: initialCategory })
  }, [initialCategory])

  const handleFilterChange = (filters) => {
    fetchEvents(filters)
  }

  const handlePageChange = (page) => {
    fetchEvents({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="container-custom relative">
          <div className="py-16 md:py-24 lg:py-32">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Discover events that matter to you</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Find Your Next
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                  Amazing Experience
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl">
                Discover local events, connect with like-minded people, and create unforgettable memories. From tech meetups to music festivals, find it all here.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <a 
                  href="#events" 
                  className="btn border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  Browse Events
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">500+</div>
                <div className="text-white/70 text-sm mt-1">Active Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">10K+</div>
                <div className="text-white/70 text-sm mt-1">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">50+</div>
                <div className="text-white/70 text-sm mt-1">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">99%</div>
                <div className="text-white/70 text-sm mt-1">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              className="fill-gray-50 dark:fill-gray-900"
            />
          </svg>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="section bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Upcoming Events
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore a variety of events happening near you. Use filters to find exactly what you're looking for.
            </p>
          </div>

          {/* Search and Filter */}
          <SearchFilter 
            onFilterChange={handleFilterChange}
            initialFilters={{ category: initialCategory }}
          />

          {/* Events Grid */}
          {loading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={() => fetchEvents()}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search filters or check back later.
              </p>
              <Link to="/create-event" className="btn-primary">
                Create an Event
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        page === pagination.currentPage
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container-custom">
          <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl p-8 md:p-12 lg:p-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Host Your Own Event?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Create and manage events with ease. Reach your audience and build your community.
            </p>
            <Link 
              to="/create-event"
              className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Create Your Event
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
