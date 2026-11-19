import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "../components/AppHeader";
import { DatePickerField } from "../components/DatePickerField";
import { PageContainer } from "../components/PageContainer";
import { placesApi, plannerApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import {
  ItineraryResponse,
  RecommendedPlace,
  TripWizardInput,
} from "../types";

type Stage = "wizard" | "itinerary" | "recommendations";

export const TripPlannerScreen: React.FC<{ route?: any }> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { isDemoMode } = useAuth();
  const initialProvince = route?.params?.preselectedProvince || "";

  const [stage, setStage] = useState<Stage>("wizard");
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [companions, setCompanions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState<TripWizardInput>({
    province: initialProvince,
    total_guest: "",
    place: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    total_days: 3,
    budget: "",
  });

  useEffect(() => {
    let mounted = true;
    plannerApi
      .getOptions()
      .then((opts) => {
        if (!mounted) return;
        setProvinces(opts.provinces);
        setCompanions(opts.counts);
        setCategories(opts.places);
        setForm((prev) => {
          const candidateProvince = initialProvince || prev.province;
          const matchingProvince = opts.provinces.find((province) => {
            const selected = candidateProvince.trim().toLowerCase();
            return (
              province.toLowerCase() === selected ||
              selected.split(",").some((part: string) => {
                const addressPart = part.trim();
                return (
                  addressPart.length > 0 &&
                  province.toLowerCase().includes(addressPart)
                );
              })
            );
          });
          return {
            ...prev,
            province:
              matchingProvince ||
              (opts.provinces.includes(candidateProvince)
                ? candidateProvince
                : opts.provinces[0] || ""),
            total_guest: prev.total_guest || opts.counts[0] || "",
            place: prev.place || opts.places[0] || "",
          };
        });
      })
      .catch(() => {
        if (mounted) {
          setOptionsError("Could not load trip options from the database.");
        }
      })
      .finally(() => {
        if (mounted) setOptionsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [initialProvince]);

  const [itineraryData, setItineraryData] = useState<ItineraryResponse | null>(
    null
  );
  const [selectedHotels, setSelectedHotels] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedPlaces, setSelectedPlaces] = useState<Record<string, boolean>>(
    {}
  );
  const [recommendations, setRecommendations] = useState<RecommendedPlace[]>(
    []
  );

  // Save to Calendar modal state
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [placeToSave, setPlaceToSave] = useState<RecommendedPlace | null>(null);
  const [saveDate, setSaveDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [savingPlace, setSavingPlace] = useState(false);

  const handleBack = () => {
    if (stage === "recommendations") {
      setStage("itinerary");
    } else if (stage === "itinerary") {
      setStage("wizard");
    } else if (step > 1) {
      setStep((current) => current - 1);
    } else {
      navigation.navigate("Home");
    }
  };

  const computedDays = useMemo(() => {
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 1;
  }, [form.start_date, form.end_date]);

  const handleGenerateItinerary = async () => {
    if (!form.province || !provinces.includes(form.province)) {
      Alert.alert("Missing Destination", "Please select a destination.");
      setStep(1);
      return;
    }
    if (!form.total_guest || !companions.includes(form.total_guest)) {
      Alert.alert("Missing Travel Group", "Please select who is traveling.");
      setStep(2);
      return;
    }
    if (!form.place || !categories.includes(form.place)) {
      Alert.alert("Missing Category", "Please select a place category.");
      setStep(3);
      return;
    }
    if (!form.budget.trim()) {
      Alert.alert("Missing Budget", "Please enter your estimated budget.");
      setStep(5);
      return;
    }

    setLoading(true);
    setRequestError(null);
    try {
      if (isDemoMode) {
        const catalog = await plannerApi.getCatalog(form.province);
        setItineraryData({
          ...catalog.itinerary,
          location: catalog.location || form.province,
        });
      } else {
        const res = await plannerApi.generateItinerary({
          location: form.province,
          total_days: computedDays,
          place: form.place,
          total_guest: form.total_guest,
        });
        setItineraryData(res);
      }
      setStage("itinerary");
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Could not load itinerary data."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRecommendations = async () => {
    setLoading(true);
    setRequestError(null);
    try {
      if (isDemoMode) {
        const catalog = await plannerApi.getCatalog(form.province);
        setRecommendations(catalog.recommendations);
      } else {
        const res = await plannerApi.getRecommendations({
          province: form.province,
          place: form.place,
          budget: form.budget,
          total_guest: form.total_guest,
        });
        setRecommendations(res);
      }
      setStage("recommendations");
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Could not load recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCalendar = async () => {
    if (!placeToSave || !saveDate.trim()) return;
    setSavingPlace(true);
    try {
      if (!isDemoMode) {
        await placesApi.save({
          name: placeToSave.name,
          type: placeToSave.type,
          location: placeToSave.location || placeToSave.address || form.province,
          description: placeToSave.description,
          date: saveDate.trim(),
        });
      }
      setSaveModalVisible(false);
      Alert.alert(
        "Saved to Calendar",
        `${placeToSave.name} has been added for ${saveDate}.`
      );
    } catch {
      Alert.alert("Error", "Could not save place. Please try again.");
    } finally {
      setSavingPlace(false);
    }
  };

  const openInMaps = (item: RecommendedPlace) => {
    const query = encodeURIComponent(
      `${item.name} ${item.address || item.location || form.province}`
    );
    const url =
      item.link || `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader onPressBack={handleBack} />

      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#13357B" />
          <Text className="mt-4 text-center text-base font-semibold text-ink">
            GALA.ai is crafting your {form.province || "Philippines"} trip...
          </Text>
          <Text className="mt-1 text-center text-xs text-slate-500">
            Matching places for {form.total_guest} within PHP {form.budget}
          </Text>
        </View>
      ) : stage === "wizard" ? (
        <ScrollView className="flex-1 px-4 py-5">
          <PageContainer maxWidth={960}>
          {(optionsError || requestError) && (
            <Text className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-center text-xs text-red-700">
              {optionsError || requestError}
            </Text>
          )}
          {optionsLoading && (
            <Text className="mb-4 text-center text-sm text-slate-500">
              Loading trip options...
            </Text>
          )}

          {/* Progress Header */}
          <View className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-primary">
                AI Trip Planner
              </Text>
              <Text className="text-xs font-semibold text-slate-500">
                Step {step} of 5
              </Text>
            </View>
            <View className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <View
                style={{ width: `${(step / 5) * 100}%` }}
                className="h-full rounded-full bg-primary"
              />
            </View>
          </View>

          {/* Step 1: Province */}
          {step === 1 && (
            <View className="rounded-2xl bg-white p-5 shadow-sm">
              <Text className="mb-1 text-xl font-bold text-ink">
                Where do you wanna go?
              </Text>
              <Text className="mb-4 text-xs text-slate-500">
                Select a province or destination in the Philippines.
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {provinces.map((prov) => {
                  const active = form.province === prov;
                  return (
                    <TouchableOpacity
                      key={prov}
                      onPress={() => {
                        setForm((prev) => ({ ...prev, province: prov }));
                        setStep(2);
                      }}
                      className={`rounded-xl border px-3.5 py-2.5 ${
                        active
                          ? "border-primary bg-primary"
                          : "border-slate-200 bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          active ? "text-white" : "text-ink"
                        }`}
                      >
                        {prov}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!optionsLoading && provinces.length === 0 && (
                <Text className="mt-3 text-xs text-slate-500">
                  No destinations are configured in the database.
                </Text>
              )}
            </View>
          )}

          {/* Step 2: Who's coming? */}
          {step === 2 && (
            <View className="rounded-2xl bg-white p-5 shadow-sm">
              <Text className="mb-1 text-xl font-bold text-ink">
                Who's coming?
              </Text>
              <Text className="mb-4 text-xs text-slate-500">
                Choose your travel group size.
              </Text>

              <View className="gap-3">
                {companions.map((opt) => {
                  const active = form.total_guest === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() =>
                        setForm((prev) => ({ ...prev, total_guest: opt }))
                      }
                      className={`flex-row items-center justify-between rounded-xl border px-4 py-3.5 ${
                        active
                          ? "border-primary bg-auth-surface"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <Text className="text-sm font-bold text-ink">{opt}</Text>
                      <Ionicons
                        name={
                          active ? "checkmark-circle" : "ellipse-outline"
                        }
                        size={20}
                        color={active ? "#13357B" : "#94A3B8"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!optionsLoading && companions.length === 0 && (
                <Text className="text-xs text-slate-500">
                  No travel group options are configured.
                </Text>
              )}

              <View className="mt-6 flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  className="flex-1 items-center rounded-xl border border-slate-300 py-3"
                >
                  <Text className="text-sm font-semibold text-slate-700">
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  className="flex-1 items-center rounded-xl bg-primary py-3"
                >
                  <Text className="text-sm font-bold text-white">Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Place Category */}
          {step === 3 && (
            <View className="rounded-2xl bg-white p-5 shadow-sm">
              <Text className="mb-1 text-xl font-bold text-ink">
                What kind of place?
              </Text>
              <Text className="mb-4 text-xs text-slate-500">
                Pick your preferred travel experience.
              </Text>

              <View className="gap-2.5">
                {categories.map((cat) => {
                  const active = form.place === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setForm((prev) => ({ ...prev, place: cat }));
                        setStep(4);
                      }}
                      className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${
                        active
                          ? "border-primary bg-primary"
                          : "border-slate-200 bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          active ? "text-white" : "text-ink"
                        }`}
                      >
                        {cat}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={active ? "#FFFFFF" : "#64748B"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!optionsLoading && categories.length === 0 && (
                <Text className="text-xs text-slate-500">
                  No place categories are configured.
                </Text>
              )}

              <TouchableOpacity
                onPress={() => setStep(2)}
                className="mt-5 items-center rounded-xl border border-slate-300 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Dates */}
          {step === 4 && (
            <View className="rounded-2xl bg-white p-5 shadow-sm">
              <Text className="mb-1 text-xl font-bold text-ink">
                Set the dates!
              </Text>
              <Text className="mb-4 text-xs text-slate-500">
                Choose your start and end dates.
              </Text>

              <DatePickerField
                label="Start Date"
                value={form.start_date}
                onChange={(val) =>
                  setForm((prev) => ({ ...prev, start_date: val }))
                }
              />
              <DatePickerField
                label="End Date"
                value={form.end_date}
                onChange={(val) =>
                  setForm((prev) => ({ ...prev, end_date: val }))
                }
                minimumDate={form.start_date}
              />

              <View className="rounded-xl bg-auth-surface px-4 py-3">
                <Text className="text-center text-sm font-bold text-primary">
                  Trip Duration: {computedDays}{" "}
                  {computedDays === 1 ? "Day" : "Days"}
                </Text>
              </View>

              <View className="mt-6 flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  className="flex-1 items-center rounded-xl border border-slate-300 py-3"
                >
                  <Text className="text-sm font-semibold text-slate-700">
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStep(5)}
                  className="flex-1 items-center rounded-xl bg-primary py-3"
                >
                  <Text className="text-sm font-bold text-white">Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 5: Budget */}
          {step === 5 && (
            <View className="rounded-2xl bg-white p-5 shadow-sm">
              <Text className="mb-1 text-xl font-bold text-ink">
                What's your budget?
              </Text>
              <Text className="mb-4 text-xs text-slate-500">
                Enter your estimated trip budget in PHP.
              </Text>

              <View className="mb-4 flex-row items-center rounded-xl border border-slate-200 bg-surface px-4">
                <Text className="mr-2 text-base font-bold text-primary">
                  PHP
                </Text>
                <TextInput
                  value={form.budget}
                  onChangeText={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      budget: val.replace(/[^0-9]/g, ""),
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="Enter your budget"
                  className="flex-1 py-3 text-base font-semibold text-ink"
                />
              </View>

              <View className="mb-5 rounded-xl bg-surface p-3.5">
                <Text className="text-xs font-semibold text-slate-600">
                  Summary: {form.province} • {form.total_guest} • {form.place} •{" "}
                  {computedDays} Days
                </Text>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setStep(4)}
                  className="flex-1 items-center rounded-xl border border-slate-300 py-3.5"
                >
                  <Text className="text-sm font-semibold text-slate-700">
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGenerateItinerary}
                  className="flex-1 items-center rounded-xl bg-primary py-3.5"
                >
                  <Text className="text-sm font-bold text-white">
                    Go! Generate
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          </PageContainer>
        </ScrollView>
      ) : stage === "itinerary" && itineraryData ? (
        <ScrollView className="flex-1 px-4 py-5">
          <PageContainer maxWidth={960}>
          {requestError && (
            <Text className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-center text-xs text-red-700">
              {requestError}
            </Text>
          )}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase text-primary">
                Suggested Itinerary
              </Text>
              <Text className="text-xl font-bold text-ink">
                {itineraryData.location}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setStage("wizard")}
              className="rounded-lg bg-white px-3 py-2"
            >
              <Text className="text-xs font-semibold text-primary">
                Edit Trip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hotel Options */}
          {itineraryData.hotels.length > 0 && (
            <View className="mb-5">
              <Text className="mb-2.5 text-base font-bold text-ink">
                Hotel Options
              </Text>
              <View className="gap-3">
                {itineraryData.hotels.map((hotel, idx) => {
                  const key = `hotel_${idx}`;
                  const checked = !!selectedHotels[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() =>
                        setSelectedHotels((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                      className={`rounded-2xl border bg-white p-4 ${
                        checked ? "border-primary" : "border-slate-200"
                      }`}
                    >
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-ink">
                            {hotel.hotel_name}
                          </Text>
                          {!!hotel.hotel_address && (
                            <Text className="mt-0.5 text-xs text-slate-500">
                              {hotel.hotel_address}
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name={checked ? "checkbox" : "square-outline"}
                          size={22}
                          color={checked ? "#13357B" : "#94A3B8"}
                        />
                      </View>

                      <View className="mt-2 flex-row flex-wrap gap-2">
                        {!!hotel.price_per_night && (
                          <View className="rounded-full bg-auth-surface px-2.5 py-1">
                            <Text className="text-xs font-bold text-primary">
                              {hotel.price_per_night}/night
                            </Text>
                          </View>
                        )}
                        {!!hotel.rating && (
                          <View className="rounded-full bg-amber-100 px-2.5 py-1">
                            <Text className="text-xs font-bold text-amber-800">
                              ★ {hotel.rating}
                            </Text>
                          </View>
                        )}
                      </View>

                      {!!hotel.description && (
                        <Text className="mt-2 text-xs leading-5 text-slate-600">
                          {hotel.description}
                        </Text>
                      )}
                      {!!hotel.hotel_image_url && (
                        <Image
                          source={{ uri: hotel.hotel_image_url }}
                          className="mt-3 h-36 w-full rounded-xl"
                          resizeMode="cover"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Day-wise Itinerary */}
          <Text className="mb-2.5 text-base font-bold text-ink">
            Day-wise Itinerary
          </Text>
          {Object.entries(itineraryData.itinerary).map(([dayKey, dayVal]) => (
            <View key={dayKey} className="mb-5">
              <Text className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">
                {dayKey.replace(/_/g, " ")}
              </Text>
              <View className="gap-3">
                {(dayVal.places_to_visit ?? []).map((place, idx) => {
                  const id = `${dayKey}_${idx}`;
                  const checked = !!selectedPlaces[id];
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() =>
                        setSelectedPlaces((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                      className={`rounded-2xl border bg-white p-4 ${
                        checked ? "border-primary" : "border-slate-200"
                      }`}
                    >
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="flex-1 text-base font-bold text-ink">
                          {place.place_name}
                        </Text>
                        <Ionicons
                          name={checked ? "checkbox" : "square-outline"}
                          size={22}
                          color={checked ? "#13357B" : "#94A3B8"}
                        />
                      </View>
                      {!!place.place_details && (
                        <Text className="mt-1.5 text-xs leading-5 text-slate-600">
                          {place.place_details}
                        </Text>
                      )}
                      <View className="mt-2.5 gap-1">
                        <Text className="text-xs text-slate-700">
                          <Text className="font-bold">Ticket: </Text>
                          {place.ticket_pricing || "N/A"}
                        </Text>
                        <Text className="text-xs text-slate-700">
                          <Text className="font-bold">Best Time: </Text>
                          {place.best_time_to_visit || "N/A"}
                        </Text>
                        <Text className="text-xs text-slate-700">
                          <Text className="font-bold">Travel Time: </Text>
                          {place.time_to_travel || "N/A"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          {itineraryData.hotels.length === 0 &&
            Object.keys(itineraryData.itinerary).length === 0 && (
              <Text className="mb-5 text-center text-sm text-slate-500">
                No itinerary content is available for this destination in the
                database yet.
              </Text>
            )}

          <TouchableOpacity
            onPress={handleLoadRecommendations}
            className="mb-8 items-center rounded-xl bg-primary py-4"
          >
            <Text className="text-sm font-bold text-white">
              Continue to Recommendations
            </Text>
          </TouchableOpacity>
          </PageContainer>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-4 py-5">
          <PageContainer maxWidth={960}>
          {requestError && (
            <Text className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-center text-xs text-red-700">
              {requestError}
            </Text>
          )}
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase text-primary">
                Recommendations
              </Text>
              <Text className="text-xl font-bold text-ink">
                {form.province || "Philippines"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setStage("itinerary")}
              className="rounded-lg bg-white px-3 py-2"
            >
              <Text className="text-xs font-semibold text-primary">
                Back to Itinerary
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-8 gap-3">
            {recommendations.map((item, idx) => (
              <View
                key={`${item.name}_${idx}`}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-bold text-ink">
                    {item.name}
                  </Text>
                  <View className="rounded-full bg-auth-surface px-2.5 py-1">
                    <Text className="text-[11px] font-bold text-primary">
                      {item.type}
                    </Text>
                  </View>
                </View>

                <Text className="mb-2 text-xs text-slate-500">
                  {item.address || item.location}
                </Text>
                <Text className="mb-4 text-xs leading-5 text-slate-600">
                  {item.description}
                </Text>

                <View className="flex-row gap-2.5">
                  <TouchableOpacity
                    onPress={() => openInMaps(item)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-primary py-2.5"
                  >
                    <Ionicons name="map-outline" size={16} color="#13357B" />
                    <Text className="text-xs font-bold text-primary">
                      Open Maps
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setPlaceToSave(item);
                      setSaveDate(form.start_date);
                      setSaveModalVisible(true);
                    }}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text className="text-xs font-bold text-white">
                      Save to Calendar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {recommendations.length === 0 && (
              <Text className="text-center text-sm text-slate-500">
                No recommendations are available for this destination yet.
              </Text>
            )}
          </View>
          </PageContainer>
        </ScrollView>
      )}

      {/* Save to Calendar Modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-5">
          <View
            className="w-full rounded-2xl bg-white p-5"
            style={{ maxWidth: 560 }}
          >
            <Text className="mb-1 text-lg font-bold text-ink">
              Add to Calendar
            </Text>
            <Text className="mb-4 text-xs text-slate-500">
              {placeToSave?.name}
            </Text>

            <DatePickerField
              label="Visit Date"
              value={saveDate}
              onChange={setSaveDate}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setSaveModalVisible(false)}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3"
              >
                <Text className="text-xs font-bold text-slate-700">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={savingPlace}
                onPress={handleSaveToCalendar}
                className="flex-1 items-center rounded-xl bg-primary py-3"
              >
                <Text className="text-xs font-bold text-white">
                  {savingPlace ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
