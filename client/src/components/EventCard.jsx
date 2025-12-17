import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import { formatShortDate, getCategoryLabel, getCategoryIcon, getCapacityStatus, getPlaceholderImage, truncateText } from '../utils/helpers'

const EventCard = ({ event }) => {
  const {
    _id,
    title,
    description,
    date,
    time,
    location,
    capacity,
    category,
    image,
    attendees = [],
    creator
  } = event

  const capacityInfo = getCapacityStatus(attendees.length, capacity)
  const eventImage = image?.url || getPlaceholderImage(category)

  return (
    <Link to={`/events/${_id}`}>
      <article className="card group h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={eventImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = getPlaceholderImage(category)
            }}
          />
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="badge-primary flex items-center gap-1">
              <span>{getCategoryIcon(category)}</span>
              {getCategoryLabel(category)}
            </span>
          </div>
          {/* Capacity Status */}
          <div className="absolute top-3 right-3">
            <span className={`badge badge-${capacityInfo.color}`}>
              {capacityInfo.status === 'full' ? 'Sold Out' : `${capacity - attendees.length} spots`}
            </span>
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Date Badge */}
          <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {formatShortDate(date)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
            {truncateText(description, 100)}
          </p>

          {/* Meta Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>{attendees.length} / {capacity} attending</span>
            </div>
          </div>

          {/* Creator Info */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {creator?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              by {creator?.name || 'Unknown'}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default EventCard
