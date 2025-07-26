# DroneBuilder 🚁

A comprehensive web application for designing, building, and managing drone configurations with AI-powered recommendations and real-time analysis.

## 🌟 Features

### **Core Functionality**
- **Interactive 3D Drone Builder**: Drag-and-drop interface with realistic 3D rendering
- **Real-time Analysis**: Instant calculations of cost, weight, flight time, and performance
- **Part Compatibility**: Smart warnings and compatibility checks
- **Build Management**: Save, load, edit, and organize your drone designs

### **Build Storage & Management System**

#### **Database Architecture (Supabase PostgreSQL)**
```sql
-- Core builds table
CREATE TABLE builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parts JSONB NOT NULL, -- Complete parts array
  total_cost DECIMAL(10,2),
  total_weight DECIMAL(10,2),
  flight_time INTEGER,
  max_payload DECIMAL(10,2),
  estimated_speed INTEGER,
  estimated_range INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Build Data Structure**
Each build contains:
- **Basic Info**: Name, description, creation date
- **Parts Array**: Complete drone configuration (frames, motors, ESCs, etc.)
- **Calculated Metrics**: Cost, weight, flight time, performance specs
- **Analysis Data**: Compatibility warnings, performance indicators

#### **Save Process**
1. User builds drone in playground
2. Real-time analysis calculates metrics
3. Build data saved to Supabase database
4. Build appears in user's dashboard

#### **Load Process**
1. User selects build from dashboard
2. Build data retrieved from database
3. Parts restored to 3D canvas
4. Analysis recalculated and displayed

### **User Experience Features**

#### **For Beginners**
- **Simple Build Templates**: Pre-configured builds for common use cases
- **Cost Estimation**: Real-time pricing for all components
- **Educational Tooltips**: Learn about each part's function

#### **For Hobbyists**
- **Save/Load Builds**: Persistent storage of all designs
- **Motor Swap Effects**: See performance changes instantly
- **Build Comparison**: Compare different configurations

#### **For Educators**
- **Preset Templates**: Ready-to-use educational builds
- **Assembly Guide**: Step-by-step building instructions
- **Fun Facts & Quizzes**: Educational content about drones

#### **For Professionals**
- **Advanced Analysis**: Detailed performance metrics
- **Export Options**: JSON/CSV export for parts ordering
- **Build Sharing**: Public/private build visibility

### **Build Management Features**

#### **Dashboard**
- **Build Overview**: Visual cards with key metrics
- **Quick Stats**: Total builds, value, weight, flight time
- **Search & Filter**: Find builds by name, cost, or type
- **Bulk Operations**: Delete multiple builds

#### **Build Actions**
- **Save**: Store current build with name and analysis
- **Load**: Restore previous builds to playground
- **Edit**: Modify existing builds
- **Duplicate**: Create copies for experimentation
- **Delete**: Remove builds with confirmation
- **Share**: Toggle public/private visibility

#### **Export Options**
- **JSON Export**: Complete build data with analysis
- **CSV Export**: Parts list for ordering components
- **Build Summary**: Performance metrics and warnings

### **Performance Analysis**

#### **Real-time Calculations**
- **Total Cost**: Sum of all component prices
- **Total Weight**: Combined weight of all parts
- **Flight Time**: Estimated based on battery capacity and weight
- **Max Payload**: Maximum additional weight the drone can carry
- **Estimated Speed**: Calculated from motor KV ratings
- **Estimated Range**: Distance based on flight time and speed

#### **Compatibility Warnings**
- **Motor Count**: Ensures correct number for frame type
- **Thrust-to-Weight**: Warns if underpowered
- **Part Compatibility**: Checks component compatibility
- **Performance Issues**: Flags potential problems

## 🛠 Tech Stack

### **Frontend**
- **Next.js**: React framework with server-side rendering
- **React Three Fiber**: 3D rendering for drone visualization
- **DND Kit**: Drag-and-drop functionality
- **Tailwind CSS**: Utility-first styling

### **Backend**
- **Supabase**: PostgreSQL database with real-time features
- **Row Level Security**: Secure data access
- **Authentication**: Email/password and social login
- **Storage**: Build data and user preferences

### **3D Visualization**
- **Three.js**: 3D graphics library
- **React Three Drei**: Useful helpers for React Three Fiber
- **Realistic Models**: Accurate drone part representations

## 🚀 Getting Started

### **Prerequisites**
- Node.js 16+ 
- npm or yarn
- Supabase account

### **Installation**
```bash
# Clone the repository
git clone https://github.com/yourusername/DroneBuilder.git
cd DroneBuilder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### **Supabase Setup**
1. Create a new Supabase project
2. Run the schema file: `supabase-schema.sql`
3. Configure environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Development**
```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
DroneBuilder/
├── components/
│   ├── ui/                 # Reusable UI components
│   └── ProtectedRoute.js   # Authentication wrapper
├── lib/
│   ├── database.js         # Database operations
│   └── supabase.js         # Supabase client
├── pages/
│   ├── index.jsx           # Landing page
│   ├── login.jsx           # Authentication
│   ├── dashboard.jsx       # Build management
│   └── playground.jsx      # 3D builder interface
├── supabase-schema.sql     # Database schema
└── README.md
```

## 🔧 Database Schema

### **Tables**
- **profiles**: User profile information
- **builds**: Drone build configurations
- **parts_catalog**: Reference parts database
- **user_favorites**: Saved favorite builds
- **user_settings**: User preferences

### **Security**
- **Row Level Security**: Users can only access their own data
- **Authentication**: Required for all build operations
- **Data Validation**: Ensures build integrity

## 📊 Build Analysis System

### **Physics Calculations**
```javascript
// Example analysis function
function analyzeBuild(parts) {
  const totalCost = parts.reduce((sum, part) => sum + part.cost, 0);
  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const totalThrust = motors.reduce((sum, motor) => sum + motor.thrust, 0);
  
  return {
    totalCost,
    totalWeight,
    maxPayload: totalThrust - totalWeight,
    flightTime: calculateFlightTime(battery, totalWeight),
    warnings: generateWarnings(parts)
  };
}
```

### **Performance Metrics**
- **Cost Analysis**: Total and per-component pricing
- **Weight Distribution**: Component weight breakdown
- **Flight Performance**: Time, speed, range estimates
- **Compatibility**: Part compatibility validation

## 🔐 Security Features

### **Authentication**
- **Email/Password**: Traditional login
- **Social Login**: Google, GitHub OAuth
- **Password Reset**: Secure recovery process

### **Data Protection**
- **Row Level Security**: Database-level access control
- **User Isolation**: Users can only access their own builds
- **Input Validation**: Prevents malicious data

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Deploy to Vercel
npm run build
vercel --prod
```

### **Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Report bugs on GitHub
- **Discussions**: Join community discussions

---

**DroneBuilder** - Build your perfect drone with confidence! 🚁✨
