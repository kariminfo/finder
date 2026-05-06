import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES, APP_NAME } from './constants';
import { Icon } from './components/Icon';
import LeafletMap from './components/LeafletMap';
import { fetchNearbyServices } from './services/osmService';
import { OSMNode, Location } from './types';

// --- Helper Functions ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// --- Components ---

const Header = () => (
  <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-100">
    <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition">
          <Icon name="MapPin" className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{APP_NAME}</h1>
      </Link>
      <div className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 border border-green-200">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        المغرب
      </div>
    </div>
  </header>
);

const HomePage = () => {
  return (
    <div className="p-4 pb-20 max-w-md mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-8 mt-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">ما الذي تبحث عنه؟</h2>
        <p className="text-slate-500 text-sm">اختر فئة للعثور على أقرب الخدمات في نطاق 2 كم</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className={`${cat.color} ${cat.textColor} p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-lg hover:scale-105 transition-all active:scale-95 border border-white/60 group`}
          >
            <div className="p-3 bg-white/40 rounded-full group-hover:bg-white/60 transition">
                <Icon name={cat.iconName} size={32} />
            </div>
            <span className="font-bold text-base lg:text-lg">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === id);

  if (!category) return <div className="p-8 text-center">فئة غير موجودة</div>;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen animate-in slide-in-from-right duration-300">
       <div className={`p-6 ${category.color} pb-10 rounded-b-[2.5rem] shadow-sm mb-6`}>
         {/* Explicitly navigate to Home '/' instead of -1 to be safe */}
         <button onClick={() => navigate('/')} className="bg-white/60 p-2 rounded-full hover:bg-white transition mb-4 backdrop-blur-sm shadow-sm flex items-center gap-2 pr-4 pl-2">
           <span className="text-sm font-bold text-slate-800">رجوع</span>
           <Icon name="ArrowRight" className={category.textColor} size={20} />
         </button>
         <h1 className={`text-3xl font-bold ${category.textColor} flex items-center gap-3`}>
            <div className="p-2 bg-white/30 rounded-xl">
                <Icon name={category.iconName} size={32} />
            </div>
            {category.label}
         </h1>
       </div>

       <div className="px-4 -mt-6 grid gap-3 pb-20">
         {category.services.map((service) => (
           <Link
             key={service.id}
             // Pass categoryId so MapPage knows where to go back to
             to={`/map?key=${service.osmKey}&value=${service.osmValue}&label=${service.label}&categoryId=${id}`}
             className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-200 hover:shadow-md active:bg-slate-50 transition-all group"
           >
             <div className="flex items-center gap-4">
               <div className={`p-3 rounded-full ${category.color} ${category.textColor} bg-opacity-50`}>
                 <Icon name={service.iconName} size={20} />
               </div>
               <span className="font-semibold text-slate-700 text-lg">{service.label}</span>
             </div>
             <Icon name="ChevronLeft" className="text-slate-300 group-hover:text-blue-500 transition" />
           </Link>
         ))}
       </div>
    </div>
  );
};

const PlaceList = ({ 
  places, 
  onSelect, 
  selectedId, 
  userLocation 
}: { 
  places: OSMNode[]; 
  onSelect: (id: number) => void; 
  selectedId: number | null; 
  userLocation: Location | null;
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to selected item
  useEffect(() => {
    if (selectedId && listRef.current) {
      const el = document.getElementById(`place-item-${selectedId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedId]);

  if (places.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Icon name="SearchX" size={32} className="opacity-50" />
        </div>
        <p className="font-medium">لا توجد نتائج قريبة.</p>
        <p className="text-xs mt-1">حاول البحث في منطقة أخرى.</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="divide-y divide-slate-100">
      {places.map((place) => {
        const name = place.tags?.['name:ar'] || place.tags?.['name'] || 'بدون اسم';
        const isSelected = selectedId === place.id;
        
        // Calculate distance if user location available
        let distStr = '';
        if (userLocation) {
          const d = calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lon);
          distStr = d < 1000 ? `${Math.round(d)}m` : `${(d/1000).toFixed(1)}km`;
        }

        return (
          <div
            key={place.id}
            id={`place-item-${place.id}`}
            onClick={() => onSelect(place.id)}
            className={`p-4 cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 border-l-4 ${
              isSelected 
                ? 'bg-blue-50 border-blue-600' 
                : 'hover:bg-slate-50 border-transparent hover:border-slate-300'
            }`}
          >
            <div className="flex-1">
              <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                {name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                {distStr && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 flex items-center gap-1 font-mono text-xs">
                     <Icon name="Navigation2" size={10} />
                     {distStr}
                  </span>
                )}
              </div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${
              isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400'
            }`}>
              <Icon name={isSelected ? "MapPin" : "MapPinOff"} size={18} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const osmKey = searchParams.get('key');
  const osmValue = searchParams.get('value');
  const label = searchParams.get('label') || 'Service';
  const categoryId = searchParams.get('categoryId'); // Read category context

  const [location, setLocation] = useState<Location | null>(null);
  const [points, setPoints] = useState<OSMNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Robust Back Navigation Handler
  const handleBack = () => {
    if (categoryId) {
      // Go back to the specific category
      navigate(`/category/${categoryId}`);
    } else {
      // Default to home if context is lost (e.g. direct link)
      navigate('/');
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        setError("المرجو تفعيل خدمة الموقع (GPS) للاستمرار.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (location && osmKey && osmValue) {
      setLoading(true);
      fetchNearbyServices(location.lat, location.lng, osmKey, osmValue)
        .then(data => {
          setPoints(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(`خطأ في جلب البيانات: ${err.message || 'مشكل في الشبكة'}`);
          setLoading(false);
        });
    }
  }, [location, osmKey, osmValue]);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row relative overflow-hidden bg-slate-50">
      
      {/* --- Top Navigation for Mobile (Absolute) --- */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center md:hidden pointer-events-none">
         <button 
           onClick={handleBack} 
           className="pointer-events-auto bg-white p-3 rounded-full shadow-xl text-slate-700 active:scale-95 transition-transform flex items-center justify-center border border-slate-100"
           aria-label="رجوع"
         >
           <Icon name="ArrowRight" size={20} />
         </button>
         <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg text-sm font-bold text-slate-800 pointer-events-auto border border-white/50">
            {label}
         </span>
      </div>

      {/* --- Sidebar (Desktop: Right, Mobile: Bottom) --- */}
      <div className="order-2 md:order-1 h-1/2 md:h-full w-full md:w-[400px] bg-white shadow-2xl z-20 flex flex-col md:border-l border-slate-200">
        
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
                <button onClick={handleBack} className="p-2 hover:bg-white rounded-lg transition text-slate-500 hover:text-slate-800">
                    <Icon name="ArrowRight" size={20} />
                </button>
                <h2 className="font-bold text-lg text-slate-800">{label}</h2>
            </div>
            <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                {points.length} نتائج
            </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center mt-10">
                    <Icon name="Loader2" className="animate-spin mb-2 text-blue-600" size={32} />
                    <span>جاري البحث عن أقرب الأماكن...</span>
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 bg-red-50 m-4 rounded-xl border border-red-100">
                    <Icon name="AlertCircle" className="mx-auto mb-2" />
                    {error}
                </div>
            ) : (
                <PlaceList 
                    places={points} 
                    onSelect={setSelectedId} 
                    selectedId={selectedId}
                    userLocation={location}
                />
            )}
        </div>
      </div>

      {/* --- Map Container --- */}
      <div className="order-1 md:order-2 h-1/2 md:h-full flex-1 relative z-10 bg-slate-200">
         {location && (
            <LeafletMap 
                userLocation={location} 
                points={points} 
                serviceLabel={label} 
                selectedId={selectedId}
                onSelect={setSelectedId}
            />
         )}
         {!location && !loading && !error && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
                 <div className="text-center">
                     <Icon name="Map" size={48} className="mx-auto mb-2 opacity-20" />
                     <p>بانتظار الموقع...</p>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
        <Routes>
          <Route path="/" element={<><Header /><HomePage /></>} />
          <Route path="/category/:id" element={<><Header /><CategoryPage /></>} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;