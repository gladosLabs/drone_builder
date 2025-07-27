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
        await loadUserBuilds(user.id)
        // Try to sync optimizations from localStorage to database
        await syncOptimizationsToDatabase()
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
      
      // Load optimizations from localStorage for each build
      const buildsWithOptimizations = userBuilds.map(build => {
        try {
          const localStorageKey = `build_optimizations_${build.id}`;
          const storedOptimizations = localStorage.getItem(localStorageKey);
          if (storedOptimizations) {
            const optimizationsData = JSON.parse(storedOptimizations);
            return {
              ...build,
              optimizations: optimizationsData.optimizations
            };
          }
        } catch (error) {
          console.error('Error loading optimizations from localStorage:', error);
        }
        return build;
      });
      
      setBuilds(buildsWithOptimizations)
      console.log('Loaded builds with optimizations:', buildsWithOptimizations) // Debug log
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

  // Sync optimizations from localStorage to database
  const syncOptimizationsToDatabase = async () => {
    if (!user) return;
    
    try {
      const builds = await getUserBuilds(user.id);
      
      for (const build of builds) {
        const localStorageKey = `build_optimizations_${build.id}`;
        const storedOptimizations = localStorage.getItem(localStorageKey);
        
        if (storedOptimizations) {
          const optimizationsData = JSON.parse(storedOptimizations);
          
          // Try to save optimizations to database
          const { error } = await supabase
            .from('builds')
            .update({
              optimizations: optimizationsData.optimizations,
              updated_at: new Date().toISOString()
            })
            .eq('id', build.id);
          
          if (!error) {
            // Remove from localStorage if successfully saved to database
            localStorage.removeItem(localStorageKey);
            console.log(`Synced optimizations for build ${build.id} to database`);
          }
        }
      }
      
      // Reload builds after sync
      await loadUserBuilds(user.id);
    } catch (error) {
      console.error('Error syncing optimizations:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-[#8b95c9] bg-clip-text text-transparent mb-4">
              My Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Welcome back! Create and manage your drone designs with ease.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-6 py-3 bg-gradient-to-r from-[#8b95c9] to-[#7a84b8] text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none flex items-center space-x-2"
                title="Refresh builds"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={syncOptimizationsToDatabase}
                className="px-6 py-3 bg-gradient-to-r from-[#84dcc6] to-[#73cbb5] text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                title="Sync optimizations to database"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Sync Optimizations</span>
              </button>
            </div>
          </div>

          {/* Create New Design Card */}
          <div className="mb-16">
            <div
              onClick={handleCreateNewDesign}
              className="max-w-2xl mx-auto bg-gradient-to-br from-white to-[#84dcc6]/5 rounded-2xl shadow-xl p-12 border-2 border-dashed border-[#8b95c9] hover:border-[#7a84b8] hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#84dcc6] to-[#73cbb5] rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-[#8b95c9] bg-clip-text text-transparent mb-4">Create New Design</h2>
                <p className="text-gray-600 text-lg">Start building your next drone masterpiece</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {builds.length > 0 && (
            <div className="mb-16">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-white to-[#8b95c9]/5 rounded-2xl shadow-xl p-8 border border-gray-100">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-[#8b95c9] bg-clip-text text-transparent mb-8 text-center">Quick Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center p-6 bg-white/60 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8b95c9] to-[#7a84b8] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-[#8b95c9] mb-1">{builds.length}</div>
                      <div className="text-gray-600 font-medium">Total Builds</div>
                    </div>
                    <div className="text-center p-6 bg-white/60 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#84dcc6] to-[#73cbb5] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-[#84dcc6] mb-1">
                        ${builds.reduce((sum, build) => sum + (build.total_cost || 0), 0).toFixed(0)}
                      </div>
                      <div className="text-gray-600 font-medium">Total Value</div>
                    </div>
                    <div className="text-center p-6 bg-white/60 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#acd7ec] to-[#9bc6db] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-[#acd7ec] mb-1">
                        {builds.reduce((sum, build) => sum + (build.total_weight || 0), 0).toFixed(0)}g
                      </div>
                      <div className="text-gray-600 font-medium">Total Weight</div>
                    </div>
                    <div className="text-center p-6 bg-white/60 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7a84b8] to-[#6a74a8] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-[#7a84b8] mb-1">
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
                  className="p-2 text-gray-600 hover:text-[#8b95c9] hover:bg-[#e8f4ff] rounded-full transition-colors disabled:opacity-50"
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
                <span className="inline-block px-4 py-2 bg-[#e8f4ff] text-[#8b95c9] rounded-full text-sm font-medium">
                  {refreshing ? 'Refreshing...' : `${builds.length} ${builds.length === 1 ? 'build' : 'builds'} total`}
                </span>
              </div>
            </div>

            {builds.length === 0 ? (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-coolors p-12 text-center border border-[#d6edff]">
                <div className="w-20 h-20 bg-[#e8f4ff] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-[#8b95c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No builds yet</h3>
                <p className="text-gray-600 mb-6 text-lg">Create your first drone design to get started</p>
                <button
                  onClick={handleCreateNewDesign}
                  className="px-8 py-4 btn-coolors-primary text-white font-semibold rounded-xl hover:shadow-coolors transition-all duration-200 text-lg"
                >
                  Create Your First Build
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {builds.map((build) => {
                  // Get the frame to determine drone type and arm count
                  const frame = build.parts?.find(p => p.id?.startsWith('frame-'));
                  const motors = build.parts?.filter(p => p.id?.startsWith('motor-')) || [];
                  const props = build.parts?.filter(p => p.id?.startsWith('prop-')) || [];
                  const battery = build.parts?.find(p => p.id === 'battery');
                  const camera = build.parts?.find(p => p.id === 'camera');
                  const fc = build.parts?.find(p => p.id?.startsWith('fc-'));
                  const companion = build.parts?.find(p => p.id?.startsWith('companion-'));
                  
                  const armCount = frame?.arms || 4;
                  const hasFrame = !!frame;
                  
                  return (
                    <div key={build.id} className="bg-white rounded-2xl shadow-coolors overflow-hidden hover:shadow-coolors-hover transition-all duration-200 border border-[#d6edff]">
                      {/* Drone Image Section */}
                      <div className="h-48 bg-gradient-to-br from-[#d6edff] to-[#e8f4ff] flex items-center justify-center relative overflow-hidden">
                        {hasFrame ? (
                          <div className="w-32 h-32 relative">
                            {/* Frame - different shapes based on type */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              {frame.id === 'frame-x' && (
                                <div className="w-24 h-24 border-4 border-[#8b95c9] rounded-lg transform rotate-45"></div>
                              )}
                              {frame.id === 'frame-h' && (
                                <div className="w-24 h-16 border-4 border-[#8b95c9] rounded-lg"></div>
                              )}
                              {frame.id === 'frame-cinewhoop' && (
                                <div className="w-28 h-28 border-4 border-[#8b95c9] rounded-full"></div>
                              )}
                              {frame.id === 'frame-tinywhoop' && (
                                <div className="w-20 h-20 border-4 border-[#8b95c9] rounded-lg transform rotate-45"></div>
                              )}
                              {frame.id === 'frame-hex' && (
                                <div className="w-28 h-28 border-4 border-[#8b95c9] transform rotate-30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
                              )}
                              {frame.id === 'frame-octo' && (
                                <div className="w-32 h-32 border-4 border-[#8b95c9] transform rotate-22.5" style={{ clipPath: 'polygon(50% 0%, 100% 12.5%, 100% 37.5%, 100% 62.5%, 100% 87.5%, 50% 100%, 0% 87.5%, 0% 62.5%, 0% 37.5%, 0% 12.5%)' }}></div>
                              )}
                            </div>
                            
                            {/* Arms based on frame type */}
                            {Array.from({ length: armCount }, (_, i) => {
                              const angle = (i / armCount) * Math.PI * 2;
                              const x = Math.cos(angle) * 12;
                              const y = Math.sin(angle) * 12;
                              return (
                                <div
                                  key={i}
                                  className="absolute w-1 h-8 bg-[#8b95c9] transform -translate-x-1/2 -translate-y-1/2"
                                  style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`,
                                    transform: `translate(-50%, -50%) rotate(${angle}rad)`
                                  }}
                                ></div>
                              );
                            })}
                            
                            {/* Motors */}
                            {motors.map((motor, i) => {
                              const angle = (i / armCount) * Math.PI * 2;
                              const x = Math.cos(angle) * 12;
                              const y = Math.sin(angle) * 12;
                              return (
                                <div
                                  key={i}
                                  className="absolute w-6 h-6 bg-[#84dcc6] rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                  style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`
                                  }}
                                >
                                  <div className="w-4 h-4 bg-white rounded-full"></div>
                                </div>
                              );
                            })}
                            
                            {/* Propellers */}
                            {props.map((prop, i) => {
                              const angle = (i / armCount) * Math.PI * 2;
                              const x = Math.cos(angle) * 12;
                              const y = Math.sin(angle) * 12;
                              return (
                                <div
                                  key={i}
                                  className="absolute w-8 h-8 bg-[#acd7ec] rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                  style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`
                                  }}
                                >
                                  <div className="w-6 h-6 bg-white rounded-full"></div>
                                </div>
                              );
                            })}
                            
                            {/* Battery */}
                            {battery && (
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-[#fbbf24] rounded flex items-center justify-center">
                                <div className="w-6 h-2 bg-[#f59e0b] rounded"></div>
                              </div>
                            )}
                            
                            {/* Camera */}
                            {camera && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-4 bg-white rounded border-2 border-[#acd7ec] flex items-center justify-center">
                                <div className="w-3 h-2 bg-[#8b95c9] rounded"></div>
                              </div>
                            )}
                            
                            {/* Flight Controller */}
                            {fc && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#ff9800] rounded"></div>
                            )}
                            
                            {/* Companion Computer */}
                            {companion && (
                              <div className="absolute top-1/2 left-1/2 transform translate-x-2 -translate-y-1/2 w-5 h-5 bg-[#43a047] rounded"></div>
                            )}
                          </div>
                        ) : (
                          // No frame - show placeholder
                          <div className="w-32 h-32 flex items-center justify-center">
                            <div className="text-[#8b95c9] text-4xl">🚁</div>
                          </div>
                        )}
                        
                        {/* Build Type Badge */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 bg-[#84dcc6] text-white text-xs font-semibold rounded-full">
                            {frame ? frame.name : 'Empty'}
                          </span>
                        </div>
                        
                        {/* Parts Count Badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2 py-1 bg-[#8b95c9] text-white text-xs font-semibold rounded-full">
                            {build.parts?.length || 0} parts
                          </span>
                        </div>
                        
                        {/* Optimization Badge */}
                        {build.optimizations && Object.keys(build.optimizations).filter(key => key !== 'lastUpdated').length > 0 && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-[#84dcc6] text-white text-xs font-semibold rounded-full flex items-center">
                              <span className="mr-1">⚡</span>
                              Optimized
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 truncate">{build.name}</h3>
                          <div className="flex space-x-3">
                            <Link
                              href={`/playground?id=${build.id}`}
                              className="text-[#8b95c9] hover:text-[#7a84b8] text-sm font-medium transition-colors"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/lifecycle?build=${build.id}`}
                              className="text-[#84dcc6] hover:text-[#73cbb5] text-sm font-medium transition-colors"
                            >
                              Optimize
                            </Link>
                            <button
                              onClick={() => handleDeleteBuild(build.id)}
                              disabled={deletingBuild === build.id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                              {deletingBuild === build.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 text-sm text-gray-600">
                          <div className="flex justify-between items-center py-2 border-b border-[#e8f4ff]">
                            <span>Cost:</span>
                            <span className="font-semibold text-lg text-[#84dcc6]">${build.total_cost || 0}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-[#e8f4ff]">
                            <span>Weight:</span>
                            <span className="font-semibold text-[#acd7ec]">{build.total_weight || 0}g</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-[#e8f4ff]">
                            <span>Flight Time:</span>
                            <span className="font-semibold text-[#7a84b8]">{build.flight_time || 0} min</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-[#e8f4ff]">
                            <span>Parts:</span>
                            <span className="font-semibold text-[#8b95c9]">{build.parts?.length || 0}</span>
                          </div>
                          
                          {/* Optimization Information */}
                          {build.optimizations && Object.keys(build.optimizations).filter(key => key !== 'lastUpdated').length > 0 && (
                            <div className="pt-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-700">Optimizations:</span>
                                <span className="text-xs text-[#84dcc6] font-semibold">
                                  {Object.keys(build.optimizations).filter(key => key !== 'lastUpdated').length} applied
                                </span>
                              </div>
                              <div className="space-y-1">
                                {Object.keys(build.optimizations)
                                  .filter(key => key !== 'lastUpdated')
                                  .map((optimization, index) => (
                                    <div key={index} className="flex items-center text-xs text-gray-500">
                                      <span className="mr-1">✓</span>
                                      {optimization === 'batteryOptimization' ? 'Battery Optimization' : optimization}
                                      {build.optimizations[optimization]?.appliedAt && (
                                        <span className="ml-auto text-gray-400">
                                          {new Date(build.optimizations[optimization].appliedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 text-xs text-gray-500 text-center">
                          Created {new Date(build.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 