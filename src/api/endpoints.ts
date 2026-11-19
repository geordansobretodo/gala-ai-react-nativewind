import { apiClient, resolveAssetUrl } from "./client";
import { ImagePickerAsset } from "expo-image-picker";
import {
  CarouselSlide,
  ItineraryResponse,
  PlannerCatalog,
  PlannerOptions,
  RecommendedPlace,
  SavedPlace,
  TrendingPlace,
  User,
} from "../types";

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface RegisterPayload {
  username: string;
  gender: string;
  birthdate: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

function normalizeUser(user: User): User {
  return {
    ...user,
    avatar_url: resolveAssetUrl(user.avatar_url) ?? user.avatar_url,
  };
}

// --- Auth (Laravel Sanctum) ---
export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/login", {
      ...payload,
      device_name: payload.device_name ?? "gala-mobile",
    });
    return { token: data.token, user: normalizeUser(data.user) };
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/google", {
      id_token: idToken,
      device_name: "gala-google",
    });
    return { token: data.token, user: normalizeUser(data.user) };
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/register", {
      ...payload,
      password_confirmation: payload.password_confirmation ?? payload.password,
    });
    return { token: data.token, user: normalizeUser(data.user) };
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/logout");
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ user: User } | User>("/user");
    const raw = "user" in data ? data.user : data;
    return normalizeUser(raw);
  },
};

// --- Home & Dynamic Assets ---
export const homeApi = {
  getCarouselSlides: async (): Promise<CarouselSlide[]> => {
    const { data } = await apiClient.get<{ data: any[] }>("/carousel-slides");
    return (data.data ?? []).map((item) => ({
      id: String(item.id),
      title: item.title,
      subtitle: item.subtitle,
      description: item.description ?? "",
      image: {
        uri: resolveAssetUrl(item.image_url || item.image?.uri) || "",
      },
    }));
  },

  getTrendingPlaces: async (): Promise<TrendingPlace[]> => {
    const { data } = await apiClient.get<{ data: any[] }>("/trending-places");
    return (data.data ?? []).map((item) => ({
      id: String(item.id),
      trend_place_name: item.trend_place_name,
      trend_place_address: item.trend_place_address,
      description: item.description,
      rating: item.rating ?? 5,
      image: {
        uri: resolveAssetUrl(item.image_url || item.image?.uri) || "",
      },
    }));
  },
};

// --- Trip Planner / AI Itinerary ---
export const plannerApi = {
  getOptions: async (): Promise<PlannerOptions> => {
    const { data } = await apiClient.get<PlannerOptions>("/planner/options");
    return data;
  },

  getCatalog: async (location: string): Promise<PlannerCatalog> => {
    const { data } = await apiClient.get<PlannerCatalog>("/planner/catalog", {
      params: { location },
    });
    return data;
  },

  generateItinerary: async (params: {
    location: string;
    total_days: number;
    place: string;
    total_guest: string;
  }): Promise<ItineraryResponse> => {
    const { data } = await apiClient.post<{
      status: string;
      location: string;
      itinerary: {
        hotels: ItineraryResponse["hotels"];
        itinerary: ItineraryResponse["itinerary"];
      };
    }>("/planner/itinerary", params);

    return {
      location: data.location || params.location,
      hotels: data.itinerary?.hotels ?? [],
      itinerary: data.itinerary?.itinerary ?? {},
    };
  },

  getRecommendations: async (params: {
    province: string;
    place: string;
    budget: string;
    total_guest: string;
  }): Promise<RecommendedPlace[]> => {
    const { data } = await apiClient.post<{
      status: string;
      data: RecommendedPlace[];
    }>("/planner/recommendations", params);
    return data.data ?? [];
  },
};

// --- Saved Places / Calendar ---
export const placesApi = {
  list: async (): Promise<SavedPlace[]> => {
    const { data } = await apiClient.get<{ status: string; data: SavedPlace[] }>(
      "/places"
    );
    return data.data ?? [];
  },

  save: async (payload: {
    name: string;
    type: string;
    location: string;
    description: string;
    date: string;
  }): Promise<SavedPlace> => {
    const { data } = await apiClient.post<{ status: string; data: SavedPlace }>(
      "/places",
      payload
    );
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/places/${id}`);
  },
};

// --- Profile ---
export const profileApi = {
  updateAccount: async (payload: {
    username: string;
    birthdate: string;
    gender: string;
  }): Promise<User> => {
    const { data } = await apiClient.put<{ user: User }>("/profile", payload);
    return normalizeUser(data.user);
  },

  updatePassword: async (payload: {
    old_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> => {
    await apiClient.put("/profile/password", payload);
  },

  uploadAvatar: async (asset: ImagePickerAsset): Promise<User> => {
    const formData = new FormData();
    const filename =
      asset.fileName || asset.uri.split(/[\\/]/).pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = asset.mimeType || (match ? `image/${match[1]}` : "image/jpeg");

    if (asset.file) {
      formData.append("avatar", asset.file, filename);
    } else {
      formData.append(
        "avatar",
        {
          uri: asset.uri,
          name: filename,
          type,
        } as unknown as Blob
      );
    }

    const { data } = await apiClient.post<{ user: User }>(
      "/profile/avatar",
      formData
    );
    return normalizeUser(data.user);
  },
};
