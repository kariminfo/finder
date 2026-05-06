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
      const response = await fetch(url, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Overpass API error (${url}): ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Success from ${url}: found ${data.elements?.length || 0} elements`);
      
      return data.elements.map((el: any) => ({
        id: el.id,
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
        tags: el.tags,
      })).filter((el: OSMNode) => el.lat && el.lon);

    } catch (error) {
      console.warn(`Failed to fetch from ${url}, trying next...`, error);
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to connect to all Overpass servers");
};