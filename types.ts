export interface ServiceDefinition {
  id: string;
  label: string;
  osmKey: string;
  osmValue: string;
  iconName: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  color: string; // Tailwind class for background
  textColor: string; // Tailwind class for text
  iconName: string;
  services: ServiceDefinition[];
}

export interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    "name:ar"?: string;
    "name:en"?: string;
    amenity?: string;
    shop?: string;
    [key: string]: string | undefined;
  };
}

export interface Location {
  lat: number;
  lng: number;
}