import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { getUserBuilds, deleteBuild } from '../lib/database'
import ProtectedRoute from '../components/ProtectedRoute'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [builds, setBuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingBuild, setDeletingBuild] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadUserBuilds(user.id)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  // Refresh builds when page becomes visible (returning from playground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadUserBuilds(user.id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  // Refresh builds when router changes (returning from playground)
  useEffect(() => {
    if (user) {
      loadUserBuilds(user.id)
    }
  }, [router.asPath, user])

  const loadUserBuilds = async (userId) => {
    try {
      setRefreshing(true)
      const userBuilds = await getUserBuilds(userId)
      setBuilds(userBuilds)
      console.log('Loaded builds:', userBuilds) // Debug log
    } catch (error) {
      console.error('Error loading builds:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    if (user) {
      await loadUserBuilds(user.id)
    }
  }

  const handleDeleteBuild = async (buildId) => {
    if (!confirm('Are you sure you want to delete this build?')) return

    setDeletingBuild(buildId)
    try {
      await deleteBuild(buildId)
      await loadUserBuilds(user.id)
    } catch (error) {
      console.error('Error deleting build:', error)
    } finally {
      setDeletingBuild(null)
    }
  }

  const handleCreateNewDesign = () => {
    router.push('/playground')
  }

  // Debug function to test database connection
  const testDatabaseConnection = async () => {
    if (!user) return;
    
    try {
      console.log('Testing database connection...');
      const testBuilds = await getUserBuilds(user.id);
      console.log('Database connection successful. Builds found:', testBuilds.length);
      console.log('Builds data:', testBuilds);
      // setToast(`Database test: ${testBuilds.length} builds found`); // This line was removed as per the new_code
    } catch (error) {
      console.error('Database connection failed:', error);
      // setToast('Database connection failed. Check console for details.'); // This line was removed as per the new_code
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">My Dashboard</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Welcome back! Create and manage your drone designs with ease.
            </p>
          </div>

          {/* Create New Design Card */}
          <div className="mb-16">
            <div
              onClick={handleCreateNewDesign}
              className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:shadow-2xl transition-all cursor-pointer group"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Create New Design</h2>
                <p className="text-gray-600 text-lg">Start building your next drone masterpiece</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {builds.length > 0 && (
            <div className="mb-16">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{builds.length}</div>
                      <div className="text-gray-600 font-medium">Total Builds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        ${builds.reduce((sum, build) => sum + (build.total_cost || 0), 0).toFixed(0)}
                      </div>
                      <div className="text-gray-600 font-medium">Total Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {builds.reduce((sum, build) => sum + (build.total_weight || 0), 0).toFixed(0)}g
                      </div>
                      <div className="text-gray-600 font-medium">Total Weight</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {builds.reduce((sum, build) => sum + (build.flight_time || 0), 0)} min
                      </div>
                      <div className="text-gray-600 font-medium">Total Flight Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Builds */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <h2 className="text-3xl font-bold text-gray-900">Recent Builds</h2>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                  title="Refresh builds"
                >
                  <svg 
                    className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-lg">Your saved drone designs and configurations</p>
              <div className="mt-4">
                <span className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  {refreshing ? 'Refreshing...' : `${builds.length} ${builds.length === 1 ? 'build' : 'builds'} total`}
                </span>
                {/* Temporary debug button */}
                {/* <button
                  onClick={testDatabaseConnection}
                  className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                >
                  Debug DB
                </button> */}
              </div>
            </div>

            {builds.length === 0 ? (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No builds yet</h3>
                <p className="text-gray-600 mb-6 text-lg">Create your first drone design to get started</p>
                <button
                  onClick={handleCreateNewDesign}
                  className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition text-lg"
                >
                  Create Your First Build
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {builds.map((build) => (
                  <div key={build.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">{build.name}</h3>
                        <div className="flex space-x-3">
                          <Link
                            href={`/playground?id=${build.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteBuild(build.id)}
                            disabled={deletingBuild === build.id}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            {deletingBuild === build.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 text-sm text-gray-600">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span>Cost:</span>
                          <span className="font-semibold text-lg">${build.total_cost || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span>Weight:</span>
                          <span className="font-semibold">{build.total_weight || 0}g</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span>Flight Time:</span>
                          <span className="font-semibold">{build.flight_time || 0} min</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span>Parts:</span>
                          <span className="font-semibold">{build.parts?.length || 0}</span>
                        </div>
                      </div>

                      <div className="mt-6 text-xs text-gray-500 text-center">
                        Created {new Date(build.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 