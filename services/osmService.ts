import { OSMNode } from '../types';
import { DEFAULT_RADIUS_METERS } from '../constants';

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
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

  const query = `
    [out:json][timeout:25];
    (
      node${tagFilter}(around:${radius},${lat},${lng});
      way${tagFilter}(around:${radius},${lat},${lng});
      relation${tagFilter}(around:${radius},${lat},${lng});
    );
    out center;
  `;

  let lastError: any = null;

  for (const url of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Overpass API error (${url}): ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.includes("<") && text.includes(">")) {
          throw new Error(`Received XML/HTML instead of JSON from ${url}. Check if the mirror is down or rate limited.`);
        }
        throw new Error(`Expected JSON but got ${contentType} from ${url}`);
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error(`Malformed JSON response from ${url}`);
      }

      console.log(`Success from ${url}: found ${data.elements?.length || 0} elements`);
      
      if (!Array.isArray(data.elements)) {
        console.warn(`No 'elements' array in response from ${url}`, data);
        return [];
      }

      return data.elements
        .filter((el: any) => el && typeof el === 'object')
        .map((el: any) => ({
          id: el.id,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          tags: el.tags || {},
        }))
        .filter((el: OSMNode) => el.lat && el.lon);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`Fetch from ${url} timed out`);
      } else {
        console.warn(`Failed to fetch from ${url}, trying next...`, error);
      }
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to connect to all Overpass servers");
};