import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

// Date formatting utilities
export const formatDate = (date) => {
  const d = new Date(date)
  return format(d, 'MMMM d, yyyy')
}

export const formatDateTime = (date, time) => {
  const d = new Date(date)
  return `${format(d, 'MMMM d, yyyy')} at ${time}`
}

export const formatShortDate = (date) => {
  const d = new Date(date)
  return format(d, 'MMM d')
}

export const getRelativeDate = (date) => {
  const d = new Date(date)
  
  if (isToday(d)) {
    return 'Today'
  }
  
  if (isTomorrow(d)) {
    return 'Tomorrow'
  }
  
  if (isPast(d)) {
    return formatDistanceToNow(d, { addSuffix: true })
  }
  
  return formatDistanceToNow(d, { addSuffix: true })
}

export const isEventPast = (date) => {
  return isPast(new Date(date))
}

// Category utilities
export const categories = [
  { value: 'conference', label: 'Conference', icon: '🎤' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
  { value: 'social', label: 'Social', icon: '🎉' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'art', label: 'Art', icon: '🎨' },
  { value: 'food', label: 'Food & Drink', icon: '🍕' },
  { value: 'tech', label: 'Tech', icon: '💻' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'other', label: 'Other', icon: '📌' }
]

export const getCategoryLabel = (value) => {
  const category = categories.find(c => c.value === value)
  return category ? category.label : 'Other'
}

export const getCategoryIcon = (value) => {
  const category = categories.find(c => c.value === value)
  return category ? category.icon : '📌'
}

// Image utilities
export const getPlaceholderImage = (category) => {
  const placeholders = {
    conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    workshop: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    social: 'https://images.unsplash.com/photo-1529543544277-750e0e7c8e11?w=800&h=400&fit=crop',
    sports: 'https://images.unsplash.com/photo-1461896836934- voices1-86d91c8a3d?w=800&h=400&fit=crop',
    music: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
    art: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&h=400&fit=crop',
    food: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    tech: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    business: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    other: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop'
  }
  return placeholders[category] || placeholders.other
}

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 6
}

// Capacity utilities
export const getCapacityStatus = (attendees, capacity) => {
  const remaining = capacity - attendees
  const percentage = (attendees / capacity) * 100

  if (remaining === 0) {
    return { status: 'full', label: 'Full', color: 'danger' }
  }
  
  if (percentage >= 80) {
    return { status: 'almostFull', label: `Only ${remaining} spots left!`, color: 'warning' }
  }
  
  if (percentage >= 50) {
    return { status: 'filling', label: `${remaining} spots remaining`, color: 'primary' }
  }
  
  return { status: 'available', label: `${remaining} spots available`, color: 'success' }
}

// Cloudinary upload utility
export const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  )

  if (!response.ok) {
    throw new Error('Image upload failed')
  }

  const data = await response.json()
  return {
    url: data.secure_url,
    publicId: data.public_id
  }
}

// Truncate text utility
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// Generate initials from name
export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
