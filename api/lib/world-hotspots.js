/**
 * Demo world hotspots for the in-memory repository.
 *
 * Mirrors db/migrations/018_seed_world_hotspots.sql so that development and
 * test runs without a database serve the same Explore content as a migrated
 * deployment. Postgres remains the source of truth when DATABASE_URL is set;
 * this is the fallback for the memory repository only.
 *
 * Keep in step with the migration if either changes.
 */
function hotspot(id, name, category, description, lat, lng, region, featuredSpecies) {
  return Object.freeze({
    id,
    name,
    category,
    description,
    gps: { lat, lng },
    region,
    featuredSpecies,
    isDemo: true,
    enabled: true,
  });
}

export const demoWorldHotspots = Object.freeze([
  hotspot('demo-cubbon-park', 'Cubbon Park', 'Parks',
    'A 300-acre green lung in the middle of the city, dense with old rain trees and resident birdlife.',
    12.9763, 77.5924, 'Bengaluru, India',
    ['sky-house-sparrow', 'sky-common-myna', 'earth-squirrel', 'grass-banyan-tree']),

  hotspot('demo-lalbagh', 'Lalbagh Botanical Garden', 'Parks',
    'Historic botanical garden with a glass house, lake and one of the oldest rock formations on earth.',
    12.9507, 77.5848, 'Bengaluru, India',
    ['grass-lotus', 'grass-rose', 'sky-peacock', 'water-lake']),

  hotspot('demo-hebbal-lake', 'Hebbal Lake', 'Birding',
    'Wetland margins that draw pelicans, herons and wintering waterfowl at dawn.',
    13.0356, 77.5913, 'Bengaluru, India',
    ['sky-kingfisher', 'sky-flamingo', 'water-lake', 'sky-indian-roller']),

  hotspot('demo-ranganathittu', 'Ranganathittu Bird Sanctuary', 'Birding',
    'Riverine islets on the Kaveri where storks, ibises and spoonbills nest in season.',
    12.4215, 76.6589, 'Karnataka, India',
    ['sky-flamingo', 'sky-kingfisher', 'water-river', 'sky-barn-owl']),

  hotspot('demo-jog-falls', 'Jog Falls', 'Waterfalls',
    'The Sharavathi drops in four distinct cascades — loudest and fullest just after the monsoon.',
    14.2295, 74.8126, 'Karnataka, India',
    ['water-waterfall', 'water-river', 'fire-rainbow']),

  hotspot('demo-shivanasamudra', 'Shivanasamudra Falls', 'Waterfalls',
    'A segmented island waterfall splitting the Kaveri into the Gaganachukki and Bharachukki drops.',
    12.2997, 77.1739, 'Karnataka, India',
    ['water-waterfall', 'water-river', 'sky-kingfisher']),

  hotspot('demo-nandi-hills', 'Nandi Hills', 'Hotspots',
    'An escarpment that clears the morning cloud layer — the classic sunrise vantage point.',
    13.3702, 77.6835, 'Karnataka, India',
    ['fire-sunrise', 'earth-mountain-vista', 'sky-red-whiskered-bulbul']),

  hotspot('demo-bandipur', 'Bandipur National Park', 'Hotspots',
    'Dry deciduous tiger reserve on the Deccan plateau, with elephant herds along the forest roads.',
    11.6654, 76.6330, 'Karnataka, India',
    ['earth-tiger', 'earth-elephant', 'earth-deer', 'sky-peacock']),

  hotspot('demo-silent-valley', 'Silent Valley National Park', 'Hotspots',
    'One of the last undisturbed tracts of tropical evergreen rainforest in the Western Ghats.',
    11.0833, 76.4400, 'Kerala, India',
    ['earth-elephant', 'sky-scarlet-macaw', 'grass-fern', 'water-river']),

  hotspot('demo-athirappilly', 'Athirappilly Falls', 'Waterfalls',
    'A broad 24-metre curtain on the Chalakudy river, fringed by riverine forest.',
    10.2852, 76.5696, 'Kerala, India',
    ['water-waterfall', 'water-frog', 'grass-fern']),

  hotspot('demo-thattekad', 'Thattekad Bird Sanctuary', 'Birding',
    'Lowland evergreen forest that Salim Ali called the richest birding site in peninsular India.',
    10.1244, 76.6871, 'Kerala, India',
    ['sky-indian-roller', 'sky-spotted-owlet', 'sky-red-whiskered-bulbul', 'sky-kingfisher']),

  hotspot('demo-valley-of-flowers', 'Valley of Flowers', 'Parks',
    'A high-altitude alpine meadow that carpets over with endemic wildflowers through the monsoon.',
    30.7283, 79.6056, 'Uttarakhand, India',
    ['grass-orchid', 'grass-yellow-flower', 'grass-butterfly', 'earth-mountain-vista']),
]);
