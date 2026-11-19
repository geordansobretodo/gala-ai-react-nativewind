import { ImageSourcePropType } from "react-native";

export interface User {
  id: number;
  username: string;
  email: string;
  sex?: string | null;
  gender?: string | null;
  birthdate?: string | null;
  age?: number | null;
  phone?: string | null;
  address?: string | null;
  account_status?: string;
  avatar_url?: string | null;
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: ImageSourcePropType | { uri: string };
}

export interface TrendingPlace {
  id: string;
  trend_place_name: string;
  trend_place_address: string;
  description: string;
  image: ImageSourcePropType | { uri: string };
  rating?: number;
}

export interface PlannerOptions {
  provinces: string[];
  places: string[];
  counts: string[];
  genders: string[];
}

export interface PlannerCatalog {
  location: string;
  itinerary: Pick<ItineraryResponse, "hotels" | "itinerary">;
  recommendations: RecommendedPlace[];
}

export interface HotelOption {
  hotel_name: string;
  hotel_address?: string;
  price_per_night?: string;
  rating?: string | number;
  description?: string;
  hotel_image_url?: string;
}

export interface ItineraryPlace {
  place_name: string;
  place_details?: string;
  ticket_pricing?: string;
  rating?: string | number;
  best_time_to_visit?: string;
  time_to_travel?: string;
  place_image_url?: string;
}

export interface ItineraryDay {
  theme?: string;
  places_to_visit: ItineraryPlace[];
}

export interface ItineraryResponse {
  location: string;
  hotels: HotelOption[];
  itinerary: Record<string, ItineraryDay>;
}

export interface RecommendedPlace {
  name: string;
  lat: number | string;
  lng: number | string;
  address?: string;
  type: string;
  location: string;
  description: string;
  link?: string;
}

export interface SavedPlace {
  id?: number;
  title: string;
  start: string; // YYYY-MM-DD
  type: string;
  location: string;
  description: string;
}

export interface TripWizardInput {
  province: string;
  total_guest: string;
  place: string;
  start_date: string;
  end_date: string;
  total_days: number;
  budget: string;
}
