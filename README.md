# GALA.ai — React Native + NativeWind Frontend

Converted from the active user-facing CodeIgniter 3 views of `gala-ai` (`Home/index`, `Home/form`, `partials/itinerary_modal`, `Login`, `Register`, and `Profile`) into an **Expo SDK 54 + TypeScript + NativeWind v4** mobile frontend ready to connect to a **Laravel Sanctum + PostgreSQL** backend.

## Setup

```bash
npm install
npx expo install --fix
npm run web
```

Open the browser URL printed by Expo. To run in Expo Go on a phone or emulator
instead, use `npx expo start -c`. Opening the Metro server URL directly while
running the native target returns Expo's JSON manifest; it is not the web app.

Set your Laravel API URL via `EXPO_PUBLIC_API_URL` (for example in `.env`):

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```

Web builds store the API token in browser local storage; use HTTPS and protect
the deployed app against cross-site scripting (XSS).

For Google sign-in, set the three platform-specific OAuth client IDs in
`frontend/.env` and add the same IDs, comma-separated, to
`GOOGLE_OAUTH_CLIENT_IDS` in `backend/.env`. Register the Expo web redirect URI
and the `gala-ai://oauthredirect` native scheme with the matching Google OAuth
clients, then restart Expo and clear Laravel's cached configuration.

## Included Screens & Modules

- Home slides, trending destinations, planner choices, registration/profile gender options, curated planner data, and saved places are loaded from the Laravel database. Only active `planner_options` rows appear in selectors, and the API validates submissions against those rows. Carousel and destination image fields store paths to files in `backend/public/`; the database stores filenames/paths, not image binaries.
- `src/screens/HomeScreen.tsx` — Hero carousel and **Trending Places in the Philippines** cards.
- `src/screens/LoginScreen.tsx` — Email/password and Google login with Sanctum token storage (SecureStore on native, browser local storage on web), password visibility toggle, and an offline Demo Mode toggle.
- `src/screens/RegisterScreen.tsx` — Responsive registration form with `username`, `gender`, calendar-based birthdate, `email`, `+63` PH mobile number validation, and `password`.
- `src/screens/TripPlannerScreen.tsx` — 5-step AI Trip Planner wizard (Province, Companions, Category, Dates, Budget) -> Suggested Itinerary (Hotels + Day-wise Places) -> Recommendations + Save to Calendar modal.
- `src/screens/ProfileScreen.tsx` — User profile info, avatar picker (`expo-image-picker`), Edit Account modal, Portal/Password modal, and Saved Places calendar list + details modal.
- `src/api/client.ts` & `src/api/endpoints.ts` — Axios client with Sanctum Bearer token interceptor and typed API calls.

## Expected Laravel Sanctum API Routes

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/login` | Returns `{ token, user }` |
| `POST` | `/api/auth/google` | Verifies a Google ID token and returns `{ token, user }` |
| `POST` | `/api/register` | Returns `{ token, user }` |
| `POST` | `/api/logout` | Revokes current Sanctum token |
| `GET` | `/api/user` | Returns authenticated `user` |
| `GET` | `/api/carousel-slides` | Returns active database-backed carousel slides |
| `GET` | `/api/trending-places` | Returns trending places list |
| `GET` | `/api/planner/options` | Returns destinations, travel groups, categories, and registration choices |
| `GET` | `/api/planner/catalog?location=Palawan` | Returns curated database itinerary and recommendations |
| `POST` | `/api/planner/itinerary` | Generates hotel + day-wise itinerary |
| `POST` | `/api/planner/recommendations` | Returns recommended places with coordinates |
| `GET` | `/api/places` | Lists user's saved calendar places |
| `POST` | `/api/places` | Saves a place to user's calendar |
| `PUT` | `/api/profile` | Updates `username`, `birthdate`, `gender` |
| `PUT` | `/api/profile/password` | Updates password |
| `POST` | `/api/profile/avatar` | Multipart avatar upload |
