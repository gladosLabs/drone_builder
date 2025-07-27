import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { getDiscussions, createDiscussion, getCategories } from '../lib/community';

export default function Community() {
  const [activeTab, setActiveTab] = useState('discussions');
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [discussions, setDiscussions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: []
  });

  const experts = [
    {
      id: 1,
      name: "Alex Chen",
      expertise: ["Racing", "PID Tuning", "Motor Optimization"],
      rating: 4.9,
      reviews: 127,
      avatar: "AC",
      online: true,
      hourlyRate: "$50"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      expertise: ["Cinematic", "Camera Setup", "Smooth Flying"],
      rating: 4.8,
      reviews: 89,
      avatar: "SJ",
      online: false,
      hourlyRate: "$45"
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      expertise: ["Long Range", "Antenna Design", "Battery Management"],
      rating: 4.7,
      reviews: 156,
      avatar: "MR",
      online: true,
      hourlyRate: "$60"
    },
    {
      id: 4,
      name: "Emma Wilson",
      expertise: ["Beginner Training", "Safety", "Education"],
      rating: 4.9,
      reviews: 203,
      avatar: "EW",
      online: true,
      hourlyRate: "$40"
    }
  ];

  const events = [
    {
      id: 1,
      title: "Drone Racing Workshop",
      date: "2024-02-15",
      time: "2:00 PM EST",
      type: "virtual",
      attendees: 45,
      maxAttendees: 50,
      host: "Alex Chen"
    },
    {
      id: 2,
      title: "Cinematic Flying Techniques",
      date: "2024-02-18",
      time: "7:00 PM EST",
      type: "virtual",
      attendees: 32,
      maxAttendees: 40,
      host: "Sarah Johnson"
    },
    {
      id: 3,
      title: "Local Drone Meetup - NYC",
      date: "2024-02-20",
      time: "6:00 PM EST",
      type: "in-person",
      attendees: 18,
      maxAttendees: 25,
      host: "Mike Rodriguez"
    }
  ];

  // Load discussions and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const discussionsData = await getDiscussions(selectedCategory === 'all' ? null : selectedCategory);
        const categoriesData = await getCategories();
        
        setDiscussions(discussionsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCategory]);

  // Handle category selection
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  // Force reload categories
  const reloadCategories = async () => {
    try {
      console.log('Reloading categories...');
      const categoriesData = await getCategories();
      console.log('New categories data:', categoriesData);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error reloading categories:', error);
    }
  };

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };
    checkUser();
  }, []);

  const availableCategories = [
    { value: 'general', label: 'General Discussion' },
    { value: 'racing', label: 'Racing' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'long-range', label: 'Long Range' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'builds', label: 'Builds & Projects' },
    { value: 'reviews', label: 'Reviews & Recommendations' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim().toLowerCase();
      if (!formData.tags.includes(newTag) && formData.tags.length < 5) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        e.target.value = '';
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to create a post');
      return;
    }
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Create the discussion in Supabase
      await createDiscussion(
        formData.title.trim(),
        formData.content.trim(),
        formData.category,
        formData.tags
      );
      
      // Close the form and reset
      setShowCreateForm(false);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        tags: []
      });
      
      // Reload discussions to show the new post
      const discussionsData = await getDiscussions(selectedCategory === 'all' ? null : selectedCategory);
      setDiscussions(discussionsData);
      
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">DroneBuilder Community</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with fellow drone enthusiasts, share knowledge, and learn from experts in the field.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-coolors mb-8 border border-[#d6edff]">
          {[
            { id: 'discussions', label: 'Discussions', icon: '💬' },
            { id: 'experts', label: 'Find Experts', icon: '👨‍💼' },
            { id: 'events', label: 'Events', icon: '📅' },
            { id: 'chat', label: 'Live Chat', icon: '💭' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#8b95c9] text-white shadow-coolors'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-[#d6edff]'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'discussions' && (
          <div className="space-y-6">
            {/* Categories */}
            {/* Category Filter */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border shadow-coolors ${
                    selectedCategory === 'all'
                      ? 'bg-[#8b95c9] text-white border-[#8b95c9]'
                      : 'bg-white text-gray-700 border-[#d6edff] hover:bg-[#d6edff]'
                  }`}
                >
                  All Discussions
                </button>
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategorySelect(category.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border shadow-coolors ${
                      selectedCategory === category.name
                        ? 'bg-[#8b95c9] text-white border-[#8b95c9]'
                        : 'bg-white text-gray-700 border-[#d6edff] hover:bg-[#d6edff]'
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
              <button
                onClick={reloadCategories}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-[#d6edff] rounded-lg transition-colors"
                title="Refresh categories"
              >
                🔄 Refresh
              </button>
            </div>


            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg shadow-coolors border border-[#d6edff] p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b95c9]"></div>
                  <span className="ml-3 text-gray-600">Loading discussions...</span>
                </div>
              </div>
            )}

            {/* Discussions */}
            {!loading && (
              <div className="bg-white rounded-lg shadow-coolors border border-[#d6edff]">
                {discussions.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No discussions found in this category.</p>
                    <button 
                      onClick={() => setShowCreateForm(true)}
                      className="mt-4 px-6 py-3 btn-coolors-primary text-white rounded-lg hover:shadow-coolors-hover transition-all duration-200"
                    >
                      Start the first discussion
                    </button>
                  </div>
                ) : (
                  discussions.map((discussion) => (
                    <div key={discussion.id} className="p-6 border-b border-[#d6edff] last:border-b-0 hover:bg-[#d6edff]/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {discussion.is_pinned && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                📌 Pinned
                              </span>
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                              <Link href={`/community/discussion/${discussion.id}`} className="hover:text-[#8b95c9]">
                                {discussion.title}
                              </Link>
                            </h3>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>By {discussion.author_name || 'Anonymous'}</span>
                            <span>{discussion.reply_count || 0} replies</span>
                            <span>{discussion.views || 0} views</span>
                            <span>{discussion.vote_count > 0 ? `+${discussion.vote_count}` : discussion.vote_count} votes</span>
                            <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex space-x-2">
                            {discussion.tags && discussion.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-[#84dcc6] text-gray-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <span className="inline-block px-3 py-1 bg-[#acd7ec] text-gray-800 text-xs rounded-full capitalize">
                            {discussion.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Start New Discussion */}
            <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Start a New Discussion</h3>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 btn-coolors-primary text-white rounded-lg hover:shadow-coolors-hover transition-all duration-200"
              >
                Create New Post
              </button>
            </div>
          </div>
        )}

        {activeTab === 'experts' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experts.map((expert) => (
                <div key={expert.id} className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[#8b95c9] rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {expert.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{expert.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm text-gray-600 ml-1">{expert.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({expert.reviews} reviews)</span>
                        <span className={`w-2 h-2 rounded-full ${expert.online ? 'bg-[#84dcc6]' : 'bg-gray-400'}`}></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Expertise:</h4>
                    <div className="flex flex-wrap gap-2">
                      {expert.expertise.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-[#d6edff] text-gray-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">{expert.hourlyRate}/hr</span>
                    <button className="px-4 py-2 btn-coolors-primary text-white rounded-lg hover:shadow-coolors-hover transition-all duration-200">
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.type === 'virtual' 
                        ? 'bg-[#acd7ec] text-gray-800'
                        : 'bg-[#84dcc6] text-gray-800'
                    }`}>
                      {event.type === 'virtual' ? '🌐 Virtual' : '📍 In-Person'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {event.attendees}/{event.maxAttendees}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">Hosted by {event.host}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📅</span>
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🕒</span>
                      {event.time}
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 btn-coolors-primary text-white rounded-lg hover:shadow-coolors-hover transition-all duration-200">
                    Join Event
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-coolors p-6 border border-[#d6edff]">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Community Chat</h3>
              <p className="text-gray-600 mb-6">
                Connect with other drone builders in real-time. Share tips, ask questions, and build relationships.
              </p>
              <button className="px-6 py-3 btn-coolors-primary text-white rounded-lg hover:shadow-coolors-hover transition-all duration-200">
                Join Live Chat
              </button>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Discussion</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent transition-colors"
                    placeholder="What's your question or topic?"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent transition-colors"
                    required
                  >
                    {availableCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (press Enter to add, max 5)
                  </label>
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent transition-colors"
                    placeholder="Add tags like 'motors', 'racing', 'beginner'..."
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 bg-[#84dcc6] text-gray-800 text-sm rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-gray-600 hover:text-gray-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent transition-colors resize-none"
                    placeholder="Describe your question, share your experience, or start a discussion..."
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 btn-coolors-primary text-white rounded-lg hover:shadow-coolors-hover transition-all duration-200"
                  >
                    Create Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 