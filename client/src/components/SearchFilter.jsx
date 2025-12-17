import { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { categories } from '../utils/helpers'

const SearchFilter = ({ onFilterChange, initialFilters = {} }) => {
  const [search, setSearch] = useState(initialFilters.search || '')
  const [category, setCategory] = useState(initialFilters.category || 'all')
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || 'all')
  const [showFilters, setShowFilters] = useState(false)

  const dateRanges = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ]

  useEffect(() => {
    const debounce = setTimeout(() => {
      onFilterChange({ search, category, dateRange })
    }, 300)

    return () => clearTimeout(debounce)
  }, [search, category, dateRange])

  const clearFilters = () => {
    setSearch('')
    setCategory('all')
    setDateRange('all')
  }

  const hasActiveFilters = search || category !== 'all' || dateRange !== 'all'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 mb-8">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${
            hasActiveFilters ? 'ring-2 ring-primary-500' : ''
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs flex items-center justify-center">
              {[search, category !== 'all', dateRange !== 'all'].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="label">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input"
              >
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-secondary w-full md:w-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Category Pills (Mobile friendly) */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === 'all'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchFilter
