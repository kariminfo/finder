import { OSMNode } from '../types';
import { DEFAULT_RADIUS_METERS } from '../constants';

const OVERPASS_MIRRORS = [
  'https://overpass.openstreetmap.fr/api/interpreter', // French mirror (Often better CORS/Global)
  'https://overpass-api.de/api/interpreter',      // Main server
  'https://overpass.osm.ch/api/interpreter',       // Swiss mirror
  'https://overpass.kumi.systems/api/interpreter'  // Another German mirror
];

export const fetchNearbyServices = async (
  lat: number,
  lng: number,
  key: string,
  value: string,
  radius: number = DEFAULT_RADIUS_METERS,
  extraTags?: Record<string, string>
): Promise<OSMNode[]> => {
  let tagFilter = `["${key}"="${value}"]`;
  
  if (value === 'place_of_worship') {
      tagFilter += `["religion"="muslim"]`;
  }

  // More robust query syntax using union for broader compatibility
  const query = `[out:json][timeout:25];
    (
      node${tagFilter}(around:${radius},${lat},${lng});
      way${tagFilter}(around:${radius},${lat},${lng});
      relation${tagFilter}(around:${radius},${lat},${lng});
    );
    out center;`;

  console.log(`Searching for ${key}=${value} around ${lat},${lng} with radius ${radius}m`);

  let anyMirrorSucceeded = false;
  let lastError: any = null;

  for (const url of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 
      
      // Use GET as it is generally more stable for CORS in some mirrors
      const fullUrl = `${url}?data=${encodeURIComponent(query)}`;
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      anyMirrorSucceeded = true;

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        const errorText = await response.text();
        // If we get 429 (Too Many Requests), we MUST try another mirror
        if (response.status === 429) {
          console.warn(`Rate limited by ${url}, trying next...`);
          continue;
        }
        throw new Error(`Overpass API error (${url}): ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.includes("<") && text.includes(">")) {
          throw new Error(`Received XML/HTML instead of JSON from ${url}. Mirror might be down or rate limited.`);
        }
        throw new Error(`Expected JSON but got ${contentType} from ${url}`);
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error(`Malformed JSON response from ${url}`);
      }

      const elements = data.elements || [];
      console.log(`Response from ${url}: found ${elements.length} elements`);
      
      // If we found elements, return them. 
      // If NOT, and we still have mirrors to try, we might want to continue in case this mirror is incomplete.
      // However, usually Overpass mirrors are global. We'll return if we got a successful 200 with data.
      if (elements.length > 0) {
        return elements
          .filter((el: any) => el && typeof el === 'object')
          .map((el: any) => ({
            id: el.id,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            tags: el.tags || {},
          }))
          .filter((el: OSMNode) => el.lat && el.lon);
      }
      
      // If we reached here and elements.length is 0, we'll continue to the next mirror just in case
      console.warn(`No results from ${url}, trying next mirror as fallback...`);
      continue;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`Fetch from ${url} timed out`);
      } else {
        console.warn(`Failed to fetch from ${url}, trying next...`, error);
      }
      lastError = error;
    }
  }

  if (anyMirrorSucceeded) {
    return [];
  }
  
  throw lastError || new Error("Failed to connect to all Overpass servers");
};