import { useState } from 'react'
import { Upload, X, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react'
import { categories, uploadToCloudinary } from '../utils/helpers'
import api from '../utils/api'
import toast from 'react-hot-toast'

const EventForm = ({ initialData = {}, onSubmit, isLoading = false, submitLabel = 'Create Event' }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
    time: initialData.time || '',
    location: initialData.location || '',
    capacity: initialData.capacity || '',
    category: initialData.category || 'other'
  })
  
  const [image, setImage] = useState(initialData.image?.url || null)
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setImageFile(file)
    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImageFile(null)
  }

  const generateDescription = async () => {
    if (!formData.title || !formData.category) {
      toast.error('Please enter a title and select a category first')
      return
    }

    setGenerating(true)
    try {
      const response = await api.post('/events/generate-description', {
        title: formData.title,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        time: formData.time
      })
      
      setFormData(prev => ({ ...prev, description: response.data.description }))
      toast.success('Description generated!')
    } catch (error) {
      toast.error('Failed to generate description')
    } finally {
      setGenerating(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required'
    } else if (new Date(formData.date) < new Date().setHours(0, 0, 0, 0)) {
      newErrors.date = 'Date cannot be in the past'
    }
    
    if (!formData.time) {
      newErrors.time = 'Time is required'
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    
    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required'
    } else if (parseInt(formData.capacity) < 1) {
      newErrors.capacity = 'Capacity must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    let imageData = initialData.image || null

    // Upload image if new file selected
    if (imageFile) {
      setUploading(true)
      try {
        imageData = await uploadToCloudinary(imageFile)
      } catch (error) {
        toast.error('Failed to upload image')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    onSubmit({
      ...formData,
      capacity: parseInt(formData.capacity),
      image: imageData
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="label">Event Image</label>
        <div className="mt-1">
          {image ? (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={image}
                alt="Event preview"
                className="w-full h-48 md:h-64 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 md:h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="label">Event Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="Enter event title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="label">Category *</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="input"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description with AI Generator */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="description" className="label mb-0">Description *</label>
          <button
            type="button"
            onClick={generateDescription}
            disabled={generating}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          className={`input resize-none ${errors.description ? 'input-error' : ''}`}
          placeholder="Describe your event..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="label">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className={`input ${errors.date ? 'input-error' : ''}`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-500">{errors.date}</p>
          )}
        </div>
        <div>
          <label htmlFor="time" className="label">Time *</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className={`input ${errors.time ? 'input-error' : ''}`}
          />
          {errors.time && (
            <p className="mt-1 text-sm text-red-500">{errors.time}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="label">Location *</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className={`input ${errors.location ? 'input-error' : ''}`}
          placeholder="Enter event location"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-500">{errors.location}</p>
        )}
      </div>

      {/* Capacity */}
      <div>
        <label htmlFor="capacity" className="label">Capacity *</label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          min="1"
          className={`input ${errors.capacity ? 'input-error' : ''}`}
          placeholder="Maximum number of attendees"
        />
        {errors.capacity && (
          <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading || uploading}
          className="btn-primary px-8 py-3"
        >
          {(isLoading || uploading) && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {uploading ? 'Uploading Image...' : isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default EventForm
