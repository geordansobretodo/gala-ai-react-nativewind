import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "../components/AppHeader";
import { homeApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { CarouselSlide, TrendingPlace } from "../types";

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const showDesktopScrollControls = SCREEN_WIDTH >= 768;
  const [activeSlide, setActiveSlide] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<TrendingPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const carouselRef = React.useRef<ScrollView>(null);
  const trendingRef = React.useRef<FlatList<TrendingPlace>>(null);
  const trendingOffsetRef = React.useRef(0);
  const [trendingScrollOffset, setTrendingScrollOffset] = useState(0);
  const trendingCardWidth = Math.min(SCREEN_WIDTH * 0.82, 360);
  const trendingInterval = trendingCardWidth + 16;
  const maxTrendingOffset = Math.max(
    0,
    trendingPlaces.length * trendingCardWidth +
      Math.max(0, trendingPlaces.length - 1) * 16 +
      32 -
      SCREEN_WIDTH
  );

  useEffect(() => {
    let mounted = true;
    const loadHomeContent = async () => {
      const [slidesRes, placesRes] = await Promise.allSettled([
        homeApi.getCarouselSlides(),
        homeApi.getTrendingPlaces(),
      ]);
      if (!mounted) return;
      const failures: string[] = [];
      if (slidesRes.status === "fulfilled") {
        setSlides(slidesRes.value);
      } else {
        failures.push("Could not load carousel slides.");
      }
      if (placesRes.status === "fulfilled") {
        setTrendingPlaces(placesRes.value);
      } else {
        failures.push("Could not load trending places.");
      }
      setLoadError(failures.length ? failures.join(" ") : null);
      setLoading(false);
    };
    void loadHomeContent();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = setInterval(() => {
      setActiveSlide((current) => {
        const next = (current + 1) % slides.length;
        carouselRef.current?.scrollTo({
          x: next * SCREEN_WIDTH,
          y: 0,
          animated: true,
        });
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [SCREEN_WIDTH, slides.length]);

  const showSlide = (index: number) => {
    setActiveSlide(index);
    carouselRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      y: 0,
      animated: true,
    });
  };

  const moveTrending = (direction: -1 | 1) => {
    const offset = Math.max(
      0,
      Math.min(
        maxTrendingOffset,
        trendingOffsetRef.current + direction * trendingInterval
      )
    );
    trendingOffsetRef.current = offset;
    setTrendingScrollOffset(offset);
    trendingRef.current?.scrollToOffset({ offset, animated: true });
  };

  const handlePlanTrip = (preselectedProvince?: string) => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    navigation.navigate("Planner", { preselectedProvince });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader onPressAuth={() => navigation.navigate("Login")} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loadError && (
          <Text className="px-4 py-3 text-center text-sm text-red-700">
            {loadError} Check your connection and try again.
          </Text>
        )}
        {!loading && slides.length === 0 && !loadError && (
          <Text className="px-4 py-3 text-center text-sm text-slate-500">
            No featured slides are available yet.
          </Text>
        )}

        {/* Hero Carousel */}
        {slides.length > 0 && (
          <View className="relative">
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setActiveSlide(Math.min(index, slides.length - 1));
              }}
              scrollEventThrottle={16}
            >
              {slides.map((slide) => (
                <View
                  key={slide.id}
                  style={{ width: SCREEN_WIDTH }}
                  className="relative h-80"
                >
                  <Image
                    source={slide.image}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 items-center justify-center bg-ink/55 px-6">
                    <Text className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-white">
                      {slide.title}
                    </Text>
                    <Text className="mb-3 text-center text-3xl font-bold text-white">
                      {slide.subtitle}
                    </Text>
                    <Text className="mb-6 text-center text-sm leading-5 text-white/90">
                      {slide.description}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => handlePlanTrip()}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-primary px-8 py-3.5 shadow-md"
            >
              <Text className="text-sm font-bold text-white">Plan a Trip</Text>
            </TouchableOpacity>

            {showDesktopScrollControls && slides.length > 1 && (
              <View
                pointerEvents="box-none"
                className="absolute inset-y-0 left-0 right-0 flex-row items-center justify-between px-3"
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Previous slide"
                  onPress={() =>
                    showSlide((activeSlide - 1 + slides.length) % slides.length)
                  }
                  className="h-10 w-10 items-center justify-center rounded-full bg-black/45"
                >
                  <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Next slide"
                  onPress={() => showSlide((activeSlide + 1) % slides.length)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-black/45"
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Carousel Indicators */}
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-2">
              {slides.map((slide, idx) => (
                <TouchableOpacity
                  key={slide.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Show slide ${idx + 1} of ${slides.length}`}
                  accessibilityState={{ selected: idx === activeSlide }}
                  onPress={() => showSlide(idx)}
                  className={`h-2 rounded-full ${
                    idx === activeSlide ? "w-6 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </View>
          </View>
        )}

        {/* Trending Places in the Philippines */}
        <View className="px-4 py-6">
          <View className="mb-4 items-center">
            <Text className="text-xs font-bold uppercase tracking-widest text-primary">
              Discover
            </Text>
            <Text className="mt-1 text-center text-2xl font-bold text-ink">
              Trending Places in the Philippines
            </Text>
          </View>

          {loading && (
            <Text className="text-center text-sm text-slate-500">
              Loading places...
            </Text>
          )}
          {!loading && trendingPlaces.length === 0 && !loadError && (
            <Text className="text-center text-sm text-slate-500">
              No trending places are available yet.
            </Text>
          )}
          {showDesktopScrollControls && trendingPlaces.length > 1 && (
            <View className="mb-3 flex-row justify-end gap-2">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Previous trending places"
                disabled={trendingScrollOffset <= 0}
                onPress={() => moveTrending(-1)}
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  trendingScrollOffset <= 0 ? "bg-slate-300" : "bg-primary"
                }`}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Next trending places"
                disabled={trendingScrollOffset >= maxTrendingOffset - 1}
                onPress={() => moveTrending(1)}
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  trendingScrollOffset >= maxTrendingOffset - 1
                    ? "bg-slate-300"
                    : "bg-primary"
                }`}
              >
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          <FlatList
            ref={trendingRef}
            data={trendingPlaces}
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            scrollEnabled={trendingPlaces.length > 1}
            showsHorizontalScrollIndicator={false}
            snapToInterval={trendingCardWidth + 16}
            snapToAlignment="start"
            decelerationRate="fast"
            keyExtractor={(place) => place.id}
            style={{ width: SCREEN_WIDTH }}
            onScroll={(event) => {
              const offset = event.nativeEvent.contentOffset.x;
              trendingOffsetRef.current = offset;
              setTrendingScrollOffset((current) => {
                const atStart = offset <= 0;
                const atEnd = offset >= maxTrendingOffset - 1;
                const wasAtStart = current <= 0;
                const wasAtEnd = current >= maxTrendingOffset - 1;
                return atStart === wasAtStart && atEnd === wasAtEnd
                  ? current
                  : offset;
              });
            }}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
            renderItem={({ item: place }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handlePlanTrip(place.trend_place_address)}
                style={{ width: trendingCardWidth }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <View className="relative h-48 w-full">
                  <Image
                    source={place.image}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-0 left-0 right-0 flex-row items-center bg-ink/60 px-3 py-2">
                    <Ionicons name="location-sharp" size={14} color="#FFFFFF" />
                    <Text className="ml-1.5 text-xs font-medium text-white">
                      {place.trend_place_address}
                    </Text>
                  </View>
                </View>

                <View className="p-4">
                  <View className="mb-1.5 flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-ink">
                      {place.trend_place_name}
                    </Text>
                    <View className="flex-row gap-0.5">
                      {Array.from({ length: place.rating ?? 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={14}
                          color="#13357B"
                        />
                      ))}
                    </View>
                  </View>
                  <Text className="text-sm leading-5 text-slate-600">
                    {place.description}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
