import { OSMNode } from '../types';
import { DEFAULT_RADIUS_METERS } from '../constants';

const GEOAPIFY_API_KEY = (import.meta as any).env.VITE_GEOAPIFY_API_KEY;

/**
 * Maps OpenStreetMap tag pairs to Geoapify categories.
 */
const mapOsmToGeoapify = (key: string, value: string): string => {
  const mapping: Record<string, string> = {
    'amenity:pharmacy': 'healthcare.pharmacy',
    'amenity:hospital': 'healthcare.hospital',
    'amenity:clinic': 'healthcare.clinic',
    'amenity:dentist': 'healthcare.dentist',
    'amenity:bank': 'service.financial.bank',
    'amenity:atm': 'service.financial.atm',
    'amenity:post_office': 'service.post',
    'amenity:police': 'service.police',
    'amenity:fire_station': 'service.fire_station',
    'shop:supermarket': 'commercial.supermarket',
    'shop:bakery': 'commercial.bakery',
    'shop:clothes': 'commercial.clothing',
    'shop:electronics': 'commercial.electronics',
    'amenity:restaurant': 'catering.restaurant',
    'amenity:cafe': 'catering.cafe',
    'amenity:fast_food': 'catering.fast_food',
    'amenity:school': 'education.school',
    'amenity:university': 'education.university',
    'amenity:library': 'education.library',
    'amenity:place_of_worship': 'religion.place_of_worship',
    'amenity:mosque': 'religion.place_of_worship',
    'amenity:cinema': 'entertainment.cinema',
    'leisure:park': 'leisure.park',
    'leisure:playground': 'leisure.playground',
    'amenity:bus_station': 'public_transport.bus',
    'amenity:fuel': 'service.vehicle.fuel',
    'amenity:taxi': 'service.taxi',
    'amenity:toilets': 'amenity.toilet',
    'amenity:drinking_water': 'amenity.drinking_water',
    'amenity:parking': 'service.vehicle.parking',
    'amenity:bureau_de_change': 'service.financial.currency_exchange'
  };
  return mapping[`${key}:${value}`] || mapping[`amenity:${value}`] || mapping[`shop:${value}`] || `${key}.${value}`;
};

export const fetchNearbyServices = async (
  lat: number,
  lng: number,
  key: string,
  value: string,
  radius: number = DEFAULT_RADIUS_METERS,
  _extraTags?: Record<string, string>
): Promise<OSMNode[]> => {
  const category = mapOsmToGeoapify(key, value);
  const apiKey = GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.warn("Geoapify API Key is missing. Falling back to empty results.");
    return [];
  }

  const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},${radius}&bias=proximity:${lng},${lat}&limit=20&apiKey=${apiKey}`;

  console.log(`Searching Geoapify for category ${category} around ${lat},${lng} with radius ${radius}m`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Geoapify API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.features)) {
      console.warn("Malformed response from Geoapify", data);
      return [];
    }

    const points = data.features.map((feature: any) => {
      const props = feature.properties;
      // Calculate distance to origin (lat, lng) to sort correctly
      const d = props.distance || 0; // Geoapify usually provides this or we can calc

      return {
        id: props.place_id || Math.random(),
        lat: props.lat,
        lon: props.lon,
        distance: d, // New field for pre-calculated distance
        tags: {
          name: props.name,
          'name:ar': props.name_international?.ar || props.name,
          'addr:full': props.formatted,
          opening_hours: props.opening_hours,
          phone: props.datasource?.raw?.phone || props.contact?.phone,
          website: props.datasource?.raw?.website || props.contact?.email
        }
      };
    });

    // Sort by distance if not already sorted by API
    return points.sort((a: any, b: any) => a.distance - b.distance);

  } catch (error) {
    console.error("Geoapify fetch failed:", error);
    throw error;
  }
};
