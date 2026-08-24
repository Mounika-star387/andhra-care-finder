# AP Health Finder

Build a modern, responsive hospital-finder web application focused on Andhra Pradesh, India.

IMPORTANT:

Do not use fake, invented, or hardcoded hospital information.

Use live and reliable location/place data through an appropriate maps/places service such as Google Maps / Google Places API.

When real information is unavailable, clearly display “Information unavailable” instead of creating data.

The application must have EXACTLY 3 main pages.

==================================================

PAGE 1 — HOME / HOSPITAL SEARCH

==================================================

Create a clean and attractive homepage for finding nearby hospitals.

Main heading:

“Find Hospitals Near You”

Subheading:

“Find nearby hospitals, distance, travel time, availability and emergency assistance in one place.”

Main features:

1. USER LOCATION

- Ask for the user's current location using browser geolocation permission.

- Add a button:

  “Use My Location”

- If location permission is denied, allow the user to manually enter:

  - City

  - Area

  - Pincode

- Clearly show the current selected location.

2. ANDHRA PRADESH HOSPITAL COUNT

- Provide an Andhra Pradesh hospital overview.

- Show the number of hospitals currently available in Andhra Pradesh based on the connected live places/maps data.

- DO NOT invent a fixed number.

- Label it clearly as:

  “Hospitals found in Andhra Pradesh”

- The number should come from the available live data/search results.

3. SEARCH

Add a large search box where users can type:

- hospital name

- area

- city

- emergency hospital

- government hospital

- private hospital

- specialty

Example placeholder:

“Search hospitals, areas or services…”

4. VOICE SEARCH

Add a microphone/voice-search button inside or beside the search box.

The user should be able to speak naturally, for example:

- “Find hospitals near me”

- “Show hospitals within 5 kilometers”

- “Find emergency hospitals”

- “Show government hospitals near Vijayawada”

- “Find hospitals open now”

Convert the user's voice into text and perform the search.

Include:

- microphone icon

- listening state

- stop listening state

- clear feedback when voice recognition is active

If browser voice recognition is unavailable, show a friendly fallback message and keep normal text search available.

5. FILTERS

Provide filters for:

- Distance

- Rating

- Hospital type

- Government / Private

- Emergency services

- Open now

- Specialty

- Price range, only when reliable information exists

6. VISUAL DESIGN

Use a professional healthcare design.

Use:

- hospital/medical illustrations

- relevant hospital photos where legally/technically available from the places service

- location icons

- ambulance icons

- medical icons

- emergency icons

- star/rating icons

- navigation/distance icons

- phone icons

Use multiple colors for icons while maintaining a professional healthcare appearance.

Do not use random decorative images unrelated to hospitals.

==================================================

PAGE 2 — NEARBY HOSPITAL RESULTS

==================================================

Create a results page showing hospitals based on the user's location or searched location.

At the top show:

“Nearby Hospitals”

Show:

- User's selected/current location

- Number of hospitals found

- Search radius

- Sort options

Each hospital must appear as a professional card.

Each hospital card should contain, when available:

- Hospital photo

- Hospital name

- Rating

- Number of reviews

- Address

- Distance from user

- Estimated travel time

- Open / Closed status

- Hospital type

- Emergency availability

- Phone number

- Navigation button

- View Details button

DISTANCE:

Calculate and display the distance from the user's location to the hospital.

Examples:

- “1.2 km away”

- “4.8 km away”

TRAVEL TIME:

Show estimated travel time using available routing/map data.

Examples:

- “8 min”

- “18 min by car”

Do not invent travel times.

If routing/travel information is unavailable, display:

“Travel time unavailable”

SORTING:

Allow:

- Nearest first

- Highest rated

- Fastest travel time

- Open now

MAP:

Include an interactive map showing:

- User location

- Hospital markers

- Selected hospital marker

Clicking a hospital marker should open its hospital information.

Do NOT rely only on text.

The page should be visually attractive with cards + map.

==================================================

PAGE 3 — HOSPITAL DETAILS / EMERGENCY

==================================================

Create a detailed hospital page.

When a user selects a hospital, show:

- Hospital photo/gallery

- Hospital name

- Rating

- Address

- Distance

- Estimated travel time

- Opening hours

- Phone number

- Website, when available

- Hospital type

- Available services

- Emergency availability

- Location on map

- Get Directions button

- Call Hospital button

Add a prominent emergency section.

EMERGENCY ASSISTANCE:

Create a clearly visible emergency button:

“🚑 REQUEST AMBULANCE”

The emergency area must be visually noticeable but should not accidentally trigger an ambulance request from a normal click.

When the user chooses the ambulance option:

- Show an emergency confirmation dialog.

- Explain that emergency/ambulance services depend on the availability of real local services.

- Ask for confirmation before making a request/call.

- Provide the emergency contact/call option using the appropriate emergency number configured for India.

- If an ambulance provider/service is integrated, provide the available ambulance option.

- Never pretend that an ambulance has been dispatched unless an actual service/API confirms it.

Also provide:

“Call Emergency Services”

and:

“Get Directions to Hospital”

For urgent situations, display a clear warning:

“If this is a life-threatening emergency, contact emergency services immediately.”

Do not make medical diagnoses or give dangerous medical instructions.

==================================================

LOCATION AND PRIVACY

==================================================

The app should:

- Request location permission clearly.

- Explain why location is needed.

- Use the user's location only for finding nearby hospitals and calculating distance/travel time.

- Provide manual location entry when permission is denied.

- Never fabricate the user's location.

- Show the currently selected location on the interface.

==================================================

VOICE FEATURES

==================================================

Voice input should be available on the homepage and useful for hospital searches.

Examples of commands:

“Find hospitals near me”

“Show emergency hospitals”

“Find hospitals within 3 kilometers”

“Find the nearest hospital”

“Show government hospitals near me”

After recognizing speech:

- display the recognized text

- interpret the request

- perform the search

Use a microphone icon with clear states:

- Ready

- Listening

- Processing

- Error

==================================================

AMBULANCE / EMERGENCY AWARENESS

==================================================

Make the emergency experience very clear for users.

Include:

- Emergency/ambulance button

- Emergency phone option

- Hospital emergency availability

- Directions

- confirmation before requesting/calling

- clear safety warnings

Do not create a fake ambulance tracking system.

Do not show fake ambulance availability.

Only show real availability if connected to a real service/provider.

==================================================

THREE-PAGE NAVIGATION

==================================================

The application must contain exactly these 3 main pages:

PAGE 1:

Home / Search

PAGE 2:

Nearby Hospital Results

PAGE 3:

Hospital Details / Emergency

Use a simple navigation system between these pages.

The user flow should be:

Home

→ Allow location / enter location

→ Search using text or voice

→ View nearby hospitals

→ Select hospital

→ View hospital details

→ Call / Directions / Emergency / Ambulance options

==================================================

UI / DESIGN REQUIREMENTS

==================================================

Make the application look like a professional real-world healthcare product.

Design style:

- modern

- clean

- trustworthy

- responsive

- mobile-friendly

- desktop-friendly

- accessible

Use:

- multiple colors for medical/location/emergency icons

- professional typography

- rounded cards

- subtle shadows

- clear buttons

- hospital photographs

- map visuals

- attractive empty states

- loading indicators

- error states

Use meaningful icons for:

- Hospital

- Location

- Distance

- Navigation

- Rating

- Phone

- Emergency

- Ambulance

- Microphone

- Search

- Opening hours

Do not overload the interface with too many colors.

Keep the overall appearance professional.

==================================================

DATA AND API REQUIREMENTS

==================================================

Use real API data where possible.

Preferred integrations:

- Google Places / Google Maps APIs for hospitals, ratings, addresses, photos and places

- Google Maps / routing service for distance and travel time

- Browser Geolocation API for current location

- Browser speech recognition / Web Speech API for voice input

Keep API keys secure.

Do not expose private API keys directly in frontend code.

Use secure server-side handling/environment variables where required.

Handle:

- API errors

- no results

- location permission denied

- unavailable photos

- unavailable ratings

- unavailable travel time

- unavailable opening hours

- unavailable emergency information

Whenever information is not available:

display exactly:

“Information unavailable”

Do not invent or estimate factual hospital information.

==================================================

FINAL REQUIREMENT

==================================================

Build this as a complete, functional web application rather than a static mockup.

The important features that must actually work are:

1. Current location detection

2. Manual location search

3. Andhra Pradesh hospital search/count based on live data

4. Nearby hospital search

5. Distance calculation

6. Travel-time estimation

7. Hospital ratings

8. Hospital photos

9. Map view

10. Text search

11. Voice search

12. Hospital details

13. Calling option

14. Directions

15. Emergency assistance

16. Ambulance option with confirmation

17. Responsive design

18. Exactly 3 main pages

Before finishing, test the complete user flow from:

Location → Search → Results → Hospital Details → Directions/Emergency.

Do not use fake hospital counts, fake ratings, fake distances, fake travel times, fake photos, or fake ambulance availability.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/301a2fdb-6437-49d9-85e7-7dc63bd58f96).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
