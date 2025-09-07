"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Clock, Plus, Trash2, Eye, Share2, ArrowLeft, Check } from "lucide-react"

const ItineraryTestApp = () => {
  const [currentView, setCurrentView] = useState("create") // create, preview, published
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishedId] = useState("test-123")

  // Form state
  const [type, setType] = useState("trip")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [coverImageUrl, setCoverImageUrl] = useState("")

  const [activities, setActivities] = useState([
    { title: "", location: "", time: "", description: "", requireRsvp: false },
  ])

  const [packingItems, setPackingItems] = useState([{ name: "", checked: false }])

  const [expenses, setExpenses] = useState([{ category: "", amount: 0 }])

  // Activity management
  const addActivity = () => {
    setActivities([...activities, { title: "", location: "", time: "", description: "", requireRsvp: false }])
  }

  const updateActivity = (index, field, value) => {
    const updatedActivities = [...activities]
    updatedActivities[index] = { ...updatedActivities[index], [field]: value }
    setActivities(updatedActivities)
  }

  const removeActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index))
  }

  // Packing management
  const addPackingItem = () => {
    setPackingItems([...packingItems, { name: "", checked: false }])
  }

  const updatePackingItem = (index, field, value) => {
    const updatedItems = [...packingItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setPackingItems(updatedItems)
  }

  const removePackingItem = (index) => {
    setPackingItems(packingItems.filter((_, i) => i !== index))
  }

  // Expense management
  const addExpense = () => {
    setExpenses([...expenses, { category: "", amount: 0 }])
  }

  const updateExpense = (index, field, value) => {
    const updatedExpenses = [...expenses]
    if (field === "amount") {
      // Prevent negative amounts
      value = Math.max(0, Number.parseFloat(value) || 0)
    }
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value }
    setExpenses(updatedExpenses)
  }

  const removeExpense = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  // Publishing logic
  const handlePublish = async () => {
    if (!title?.trim()) {
      alert("Please provide a title for your " + type)
      return
    }

    const dateError = validateDates()
    if (dateError) {
      alert(dateError)
      return
    }

    if (coverImageUrl && !validateImageUrl(coverImageUrl)) {
      alert("Please provide a valid image URL")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setCurrentView("published")
      alert(`Your ${type} has been published successfully!`)
    }, 2000)
  }

  const handlePreview = () => {
    if (!title?.trim()) {
      alert("Please provide a title to preview")
      return
    }

    const dateError = validateDates()
    if (dateError) {
      alert(dateError)
      return
    }

    if (coverImageUrl && !validateImageUrl(coverImageUrl)) {
      alert("Please provide a valid image URL (jpg, jpeg, png, gif, webp)")
      return
    }

    setCurrentView("preview")
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setLocation("")
    setStartDate("")
    setEndDate("")
    setCoverImageUrl("")
    setActivities([{ title: "", location: "", time: "", description: "", requireRsvp: false }])
    setPackingItems([{ name: "", checked: false }])
    setExpenses([{ category: "", amount: 0 }])
    setCurrentView("create")
  }

  // Form validation functions
  const validateDates = () => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return "End date cannot be before start date"
    }
    if (startDate && new Date(startDate) < new Date().toISOString().split("T")[0]) {
      return "Start date cannot be in the past"
    }
    return null
  }

  const validateImageUrl = (url) => {
    if (!url) return true
    try {
      new URL(url)
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    } catch {
      return false
    }
  }

  const filterEmptyItems = (items, field) => {
    return items.filter((item) => {
      if (field === "name") return item[field]?.trim()
      if (field === "category") return item[field]?.trim() || item.amount > 0
      return true
    })
  }

  useEffect(() => {
    if (type === "event") {
      setActivities([{ title: "", location: "", time: "", description: "", requireRsvp: false }])
    }
  }, [type])

  // Create View
  if (currentView === "create") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2">Create New Itinerary</h1>
            <p className="text-center text-gray-600">Plan and share your perfect trip or event</p>
          </div>

          {/* Type Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">What are you creating?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  type === "trip" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setType("trip")}
              >
                <div className="text-2xl mb-2">✈️</div>
                <h3 className="font-semibold">Trip</h3>
                <p className="text-sm text-gray-600">Multi-day travel itinerary</p>
              </div>
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  type === "event" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setType("event")}
              >
                <div className="text-2xl mb-2">🎉</div>
                <h3 className="font-semibold">Event</h3>
                <p className="text-sm text-gray-600">Single or multi-day event</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Enter ${type} title...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Describe your ${type}...`}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter location..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      coverImageUrl && !validateImageUrl(coverImageUrl) ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  {coverImageUrl && !validateImageUrl(coverImageUrl) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid image URL</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validateDates() ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split("T")[0]}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validateDates() ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>
              </div>
              {validateDates() && <p className="text-red-500 text-sm">{validateDates()}</p>}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="public" className="ml-2 text-sm text-gray-700">
                  Make this {type} public (others can discover and view it)
                </label>
              </div>
            </div>
          </div>

          {/* Activities - Only for trips */}
          {type === "trip" && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Activities</h2>
                <button
                  onClick={addActivity}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Activity
                </button>
              </div>

              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-700">Activity {index + 1}</h3>
                      {activities.length > 1 && (
                        <button onClick={() => removeActivity(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={activity.title}
                        onChange={(e) => updateActivity(index, "title", e.target.value)}
                        placeholder="Activity title..."
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={activity.location}
                        onChange={(e) => updateActivity(index, "location", e.target.value)}
                        placeholder="Location..."
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="time"
                          value={activity.time}
                          onChange={(e) => updateActivity(index, "time", e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`rsvp-${index}`}
                          checked={activity.requireRsvp}
                          onChange={(e) => updateActivity(index, "requireRsvp", e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`rsvp-${index}`} className="ml-2 text-sm text-gray-700">
                          Require RSVP
                        </label>
                      </div>
                    </div>

                    <textarea
                      value={activity.description}
                      onChange={(e) => updateActivity(index, "description", e.target.value)}
                      placeholder="Activity description..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to Bring - For events, Packing List - For trips */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{type === "event" ? "What to Bring" : "Packing List"}</h2>
              <button
                onClick={addPackingItem}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add {type === "event" ? "Item" : "Item"}
              </button>
            </div>

            <div className="space-y-2">
              {packingItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => updatePackingItem(index, "checked", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updatePackingItem(index, "name", e.target.value)}
                    placeholder={type === "event" ? "Item to bring..." : "Packing item..."}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {packingItems.length > 1 && (
                    <button onClick={() => removePackingItem(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Budget Tracker */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Budget Tracker</h2>
              <button
                onClick={addExpense}
                className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Expense
              </button>
            </div>

            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3"
                >
                  <input
                    type="text"
                    value={expense.category}
                    onChange={(e) => updateExpense(index, "category", e.target.value)}
                    placeholder="Expense category..."
                    className="flex-1 w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="relative w-full sm:w-32">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => updateExpense(index, "amount", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {expenses.length > 1 && (
                    <button
                      onClick={() => removeExpense(index)}
                      className="text-red-500 hover:text-red-700 self-center sm:self-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Budget:</span>
                  <span className="text-lg text-green-600">
                    $
                    {expenses
                      .reduce((sum, expense) => sum + (expense.amount || 0), 0)
                      .toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handlePreview}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </button>
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Publish {type.charAt(0).toUpperCase() + type.slice(1)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Preview View
  if (currentView === "preview") {
    const validActivities = filterEmptyItems(activities, "title")
    const validPackingItems = filterEmptyItems(packingItems, "name")
    const validExpenses = filterEmptyItems(expenses, "category")

    const totalBudget = validExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    const completedPacking = validPackingItems.filter((item) => item.checked).length

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6">
            <button
              onClick={() => setCurrentView("create")}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </button>

            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Preview Mode</h1>
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cover Image */}
          <div className="mb-8">
            {coverImageUrl && validateImageUrl(coverImageUrl) ? (
              <img
                src={coverImageUrl || "/placeholder.svg"}
                alt={title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = "none"
                  e.target.nextSibling.style.display = "flex"
                }}
              />
            ) : null}
            <div
              className={`w-full h-64 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center ${
                coverImageUrl && validateImageUrl(coverImageUrl) ? "hidden" : "flex"
              }`}
            >
              <span className="text-lg text-gray-500">No cover image</span>
            </div>
          </div>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{title || "Untitled " + type}</h2>
                <div className="flex items-center mt-2 text-gray-600">
                  {startDate && (
                    <div className="flex items-center mr-4">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {startDate}
                        {endDate && endDate !== startDate && ` - ${endDate}`}
                      </span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-block px-2 py-1 rounded-full text-xs ${isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {isPublic ? "Public" : "Private"}
                </div>
              </div>
            </div>

            {description && <p className="text-gray-700 whitespace-pre-line">{description}</p>}
          </div>

          {/* Activities - Only show if there are valid activities */}
          {type === "trip" && validActivities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Activities</h3>
              <div className="space-y-4">
                {validActivities.map((activity, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{activity.title}</h4>
                      {activity.time && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {activity.time}
                        </div>
                      )}
                    </div>
                    {activity.location && (
                      <div className="flex items-center mb-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {activity.location}
                      </div>
                    )}
                    {activity.description && <p className="text-gray-700 text-sm mb-2">{activity.description}</p>}
                    {activity.requireRsvp && (
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        RSVP Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to Bring / Packing List - Only show if there are valid items */}
          {validPackingItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{type === "event" ? "What to Bring" : "Packing List"}</h3>
                <span className="text-sm text-gray-600">
                  {completedPacking}/{validPackingItems.length} {type === "event" ? "ready" : "packed"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {validPackingItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${item.checked ? "bg-green-500 border-green-500" : "border-gray-300"}`}
                    >
                      {item.checked && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${item.checked ? "line-through text-gray-500" : ""}`}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget - Only show if there are valid expenses */}
          {validExpenses.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Budget Overview</h3>
                <span className="text-xl font-bold text-green-600">
                  $
                  {totalBudget.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="space-y-2">
                {validExpenses.map((expense, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{expense.category || "Uncategorized"}</span>
                    <span className="font-medium">
                      $
                      {(expense.amount || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Published View
  if (currentView === "published") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">🎉 Your {type} has been published!</h1>

            <p className="text-gray-600 mb-6">
              "{title}" is now live and {isPublic ? "publicly accessible" : "private"}.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Share your {type}:</p>
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="text"
                  value={`https://myapp.com/itinerary/${publishedId}`}
                  readOnly
                  className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://myapp.com/itinerary/${publishedId}`)
                    alert("Link copied to clipboard!")
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setCurrentView("preview")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Published {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>

              <button
                onClick={resetForm}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Another {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-3">What's Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-600 mb-2">📊</div>
                  <h4 className="font-medium mb-1">Track Engagement</h4>
                  <p className="text-gray-600">Monitor views, saves, and shares of your {type}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-600 mb-2">✏️</div>
                  <h4 className="font-medium mb-1">Make Updates</h4>
                  <p className="text-gray-600">Edit your {type} anytime to keep it current</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-600 mb-2">🤝</div>
                  <h4 className="font-medium mb-1">Collaborate</h4>
                  <p className="text-gray-600">Invite others to contribute or follow along</p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              Published on {new Date().toLocaleDateString()} • {type.charAt(0).toUpperCase() + type.slice(1)} ID:{" "}
              {publishedId}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default ItineraryTestApp
