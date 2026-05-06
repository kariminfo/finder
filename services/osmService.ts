import { OSMNode } from '../types';
import { DEFAULT_RADIUS_METERS } from '../constants';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export const fetchNearbyServices = async (
  lat: number,
  lng: number,
  key: string,
  value: string,
  extraTags?: Record<string, string>
): Promise<OSMNode[]> => {
  // Construct the query
  // We use [out:json] for JSON format.
  // We query 'node', 'way', and 'relation' to be comprehensive (e.g. a hospital might be a polygon/way).
  // 'around' filters by radius.
  
  let tagFilter = `["${key}"="${value}"]`;
  
  // Special case handling (e.g., Mosque needs amenity=place_of_worship AND religion=muslim)
  if (value === 'place_of_worship') {
      tagFilter += `["religion"="muslim"]`;
  }

  // We use `out center;` to get the center coordinate of ways/relations automatically
  const query = `
    [out:json][timeout:25];
    (
      node${tagFilter}(around:${DEFAULT_RADIUS_METERS},${lat},${lng});
      way${tagFilter}(around:${DEFAULT_RADIUS_METERS},${lat},${lng});
      relation${tagFilter}(around:${DEFAULT_RADIUS_METERS},${lat},${lng});
    );
    out center;
  `;

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Normalize data: 'center' property in ways/relations becomes lat/lon
    return data.elements.map((el: any) => ({
      id: el.id,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon,
      tags: el.tags,
    })).filter((el: OSMNode) => el.lat && el.lon); // Ensure we have coordinates

  } catch (error) {
    console.error("Failed to fetch OSM data:", error);
    throw error;
  }
};