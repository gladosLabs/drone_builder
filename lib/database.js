import { supabase } from './supabase'

// User Profile Functions
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Build Functions
export async function getUserBuilds(userId) {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getPublicBuilds() {
  const { data, error } = await supabase
    .from('builds')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        full_name
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createBuild(buildData) {
  const { data, error } = await supabase
    .from('builds')
    .insert(buildData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateBuild(buildId, updates) {
  const { data, error } = await supabase
    .from('builds')
    .update(updates)
    .eq('id', buildId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteBuild(buildId) {
  const { error } = await supabase
    .from('builds')
    .delete()
    .eq('id', buildId)
  
  if (error) throw error
  return true
}

export async function getBuild(buildId) {
  console.log('getBuild called with buildId:', buildId);
  
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('id', buildId)
    .single()
  
  if (error) {
    console.error('getBuild error:', error);
    throw error;
  }
  
  console.log('getBuild success:', data);
  return data;
}

// Parts Catalog Functions
export async function getPartsCatalog() {
  const { data, error } = await supabase
    .from('parts_catalog')
    .select('*')
    .order('category', { ascending: true })
  
  if (error) throw error
  return data
}

export async function getPartsByCategory(category) {
  const { data, error } = await supabase
    .from('parts_catalog')
    .select('*')
    .eq('category', category)
    .order('name', { ascending: true })
  
  if (error) throw error
  return data
}

// User Favorites Functions
export async function getUserFavorites(userId) {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      *,
      builds:build_id (
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function addToFavorites(userId, buildId) {
  const { data, error } = await supabase
    .from('user_favorites')
    .insert({
      user_id: userId,
      build_id: buildId
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function removeFromFavorites(userId, buildId) {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('build_id', buildId)
  
  if (error) throw error
  return true
}

// User Settings Functions
export async function getUserSettings(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error
  }
  
  return data || {
    user_id: userId,
    theme: 'light',
    units: 'metric',
    notifications_enabled: true
  }
}

export async function updateUserSettings(userId, updates) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...updates
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Enhanced Build Analysis Functions
export function analyzeBuild(parts) {
  if (!parts || parts.length === 0) {
    return {
      totalCost: 0,
      totalWeight: 0,
      flightTime: 0,
      maxPayload: 0,
      estimatedSpeed: 0,
      estimatedRange: 0,
      warnings: ['No parts added to build']
    }
  }

  // Calculate totals
  const totalCost = parts.reduce((sum, part) => sum + (part.cost || 0), 0)
  const totalWeight = parts.reduce((sum, part) => sum + (part.weight || 0), 0)
  
  // Get frame for arm count
  const frame = parts.find(p => p.category === 'frame')
  const motors = parts.filter(p => p.category === 'motor')
  const battery = parts.find(p => p.id === 'battery')
  
  if (!frame) {
    return {
      totalCost,
      totalWeight,
      flightTime: 0,
      maxPayload: 0,
      estimatedSpeed: 0,
      estimatedRange: 0,
      warnings: ['No frame selected']
    }
  }

  // Calculate thrust
  const totalThrust = motors.reduce((sum, motor) => {
    const thrust = motor.properties?.thrust || 800
    return sum + thrust
  }, 0)

  // Calculate max payload
  const maxPayload = totalThrust - totalWeight

  // Calculate flight time (rough estimation)
  const batteryCapacity = battery?.properties?.capacity || 2200
  const flightTime = Math.max(0, Math.round((batteryCapacity / (totalWeight * 0.8)) * 0.6 * 10) / 10)

  // Calculate speed (rough estimation)
  const avgKV = motors.length > 0 
    ? motors.reduce((sum, motor) => sum + (motor.properties?.kv || 2300), 0) / motors.length
    : 2300
  const estimatedSpeed = Math.round((avgKV / 1000) * 40)

  // Calculate range
  const estimatedRange = Math.round(flightTime * estimatedSpeed / 2)

  // Generate warnings
  const warnings = []
  if (totalThrust < totalWeight * 1.5) {
    warnings.push('Underpowered build! Thrust-to-weight ratio is too low.')
  }
  if (flightTime < 5) {
    warnings.push('Very short flight time!')
  }
  if (maxPayload < 0) {
    warnings.push('Cannot lift any payload!')
  }
  if (motors.length !== frame.properties?.arms) {
    warnings.push(`Frame requires ${frame.properties?.arms} motors, but ${motors.length} are selected.`)
  }

  return {
    totalCost,
    totalWeight,
    totalThrust,
    maxPayload,
    flightTime,
    estimatedSpeed,
    estimatedRange,
    warnings
  }
}

// Build Management Functions
export async function toggleBuildVisibility(buildId, isPublic) {
  const { data, error } = await supabase
    .from('builds')
    .update({ is_public: isPublic })
    .eq('id', buildId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function duplicateBuild(buildId, userId, newName) {
  // Get the original build
  const originalBuild = await getBuild(buildId)
  if (!originalBuild) throw new Error('Build not found')
  
  // Create a new build with the same parts but new name
  const newBuildData = {
    user_id: userId,
    name: newName || `${originalBuild.name} (Copy)`,
    parts: originalBuild.parts,
    total_cost: originalBuild.total_cost,
    total_weight: originalBuild.total_weight,
    flight_time: originalBuild.flight_time,
    max_payload: originalBuild.max_payload,
    estimated_speed: originalBuild.estimated_speed,
    estimated_range: originalBuild.estimated_range,
    is_public: false // Always start as private
  }
  
  return await createBuild(newBuildData)
}

export async function getBuildStats(userId) {
  const { data, error } = await supabase
    .from('builds')
    .select('total_cost, total_weight, flight_time, created_at')
    .eq('user_id', userId)
  
  if (error) throw error
  
  if (!data || data.length === 0) {
    return {
      totalBuilds: 0,
      totalValue: 0,
      totalWeight: 0,
      totalFlightTime: 0,
      averageCost: 0,
      averageWeight: 0
    }
  }
  
  const totalBuilds = data.length
  const totalValue = data.reduce((sum, build) => sum + (build.total_cost || 0), 0)
  const totalWeight = data.reduce((sum, build) => sum + (build.total_weight || 0), 0)
  const totalFlightTime = data.reduce((sum, build) => sum + (build.flight_time || 0), 0)
  
  return {
    totalBuilds,
    totalValue,
    totalWeight,
    totalFlightTime,
    averageCost: totalValue / totalBuilds,
    averageWeight: totalWeight / totalBuilds
  }
}

// Enhanced search with filters
export async function searchBuilds(query, filters = {}) {
  let queryBuilder = supabase
    .from('builds')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  // Add search query
  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }

  // Add filters
  if (filters.userId) {
    queryBuilder = queryBuilder.eq('user_id', filters.userId)
  }
  
  if (filters.isPublic !== undefined) {
    queryBuilder = queryBuilder.eq('is_public', filters.isPublic)
  }
  
  if (filters.minCost) {
    queryBuilder = queryBuilder.gte('total_cost', filters.minCost)
  }
  
  if (filters.maxCost) {
    queryBuilder = queryBuilder.lte('total_cost', filters.maxCost)
  }

  const { data, error } = await queryBuilder
  
  if (error) throw error
  return data
} 