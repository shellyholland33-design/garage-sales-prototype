// Simple postcode to approximate lat lng mapping for Australia
// Only a few examples to support radius filtering without external services
// Add more as needed
const AUS_POSTCODE_TO_LL = {
  "4000": { lat: -27.4698, lng: 153.0251 }, // Brisbane CBD
  "4067": { lat: -27.4980, lng: 152.9800 }, // St Lucia
  "4350": { lat: -27.5606, lng: 151.9539 }, // Toowoomba
  "4490": { lat: -28.0670, lng: 145.6836 }, // Cunnamulla
  "4481": { lat: -27.3300, lng: 144.7167 }, // Wyandra
  "4491": { lat: -28.1500, lng: 145.7333 }, // Eulo
  "4492": { lat: -27.9167, lng: 144.5500 }, // Yowah
};

// Sample data to get you started
// Replace by uploading a CSV in the sidebar
window.SAMPLE_SALES = [
  {
    id: "ex1",
    title: "Shed clear out",
    address: "12 John Street",
    suburb: "Cunnamulla",
    postcode: "4490",
    date: "2025-09-06",
    start_time: "08:00",
    end_time: "13:00",
    description: "Tools, camp gear, kids bikes",
    lat: -28.066, lng: 145.684,
    url: "https://maps.google.com/?q=12 John Street Cunnamulla 4490"
  },
  {
    id: "ex2",
    title: "Moving sale",
    address: "2 Warrego Lane",
    suburb: "Wyandra",
    postcode: "4481",
    date: "2025-09-07",
    start_time: "09:00",
    end_time: "12:00",
    description: "Furniture, kitchen bits, books",
    lat: -27.286, lng: 145.113,
    url: "https://maps.google.com/?q=2 Warrego Lane Wyandra 4481"
  },
  {
    id: "ex3",
    title: "Community markets",
    address: "Main Street",
    suburb: "Eulo",
    postcode: "4491",
    date: "2025-09-13",
    start_time: "07:00",
    end_time: "11:00",
    description: "Stalls, opals, garden plants",
    lat: -28.100, lng: 145.052,
    url: "https://maps.google.com/?q=Main Street Eulo 4491"
  }
];

