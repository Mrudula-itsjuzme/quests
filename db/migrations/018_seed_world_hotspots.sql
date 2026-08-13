-- Demo world hotspots.
--
-- Every row is flagged `is_demo = TRUE`. These are real, publicly documented
-- nature locations with coordinates ordered (lat, lng) — the CHECK constraints
-- on world_hotspots reject a swapped pair for anything outside ±90 longitude.
--
-- featured_species ids are drawn from api/lib/species-catalog.js. A production
-- deployment can replace these with curated content by inserting rows with
-- is_demo = FALSE and disabling these.

INSERT INTO world_hotspots (id, name, category, description, lat, lng, region, featured_species, is_demo)
VALUES
  ('demo-cubbon-park', 'Cubbon Park', 'Parks',
   'A 300-acre green lung in the middle of the city, dense with old rain trees and resident birdlife.',
   12.976300, 77.592400, 'Bengaluru, India',
   '["sky-house-sparrow","sky-common-myna","earth-squirrel","grass-banyan-tree"]', TRUE),

  ('demo-lalbagh', 'Lalbagh Botanical Garden', 'Parks',
   'Historic botanical garden with a glass house, lake and one of the oldest rock formations on earth.',
   12.950700, 77.584800, 'Bengaluru, India',
   '["grass-lotus","grass-rose","sky-peacock","water-lake"]', TRUE),

  ('demo-hebbal-lake', 'Hebbal Lake', 'Birding',
   'Wetland margins that draw pelicans, herons and wintering waterfowl at dawn.',
   13.035600, 77.591300, 'Bengaluru, India',
   '["sky-kingfisher","sky-flamingo","water-lake","sky-indian-roller"]', TRUE),

  ('demo-ranganathittu', 'Ranganathittu Bird Sanctuary', 'Birding',
   'Riverine islets on the Kaveri where storks, ibises and spoonbills nest in season.',
   12.421500, 76.658900, 'Karnataka, India',
   '["sky-flamingo","sky-kingfisher","water-river","sky-barn-owl"]', TRUE),

  ('demo-jog-falls', 'Jog Falls', 'Waterfalls',
   'The Sharavathi drops in four distinct cascades — loudest and fullest just after the monsoon.',
   14.229500, 74.812600, 'Karnataka, India',
   '["water-waterfall","water-river","fire-rainbow"]', TRUE),

  ('demo-shivanasamudra', 'Shivanasamudra Falls', 'Waterfalls',
   'A segmented island waterfall splitting the Kaveri into the Gaganachukki and Bharachukki drops.',
   12.299700, 77.173900, 'Karnataka, India',
   '["water-waterfall","water-river","sky-kingfisher"]', TRUE),

  ('demo-nandi-hills', 'Nandi Hills', 'Hotspots',
   'An escarpment that clears the morning cloud layer — the classic sunrise vantage point.',
   13.370200, 77.683500, 'Karnataka, India',
   '["fire-sunrise","earth-mountain-vista","sky-red-whiskered-bulbul"]', TRUE),

  ('demo-bandipur', 'Bandipur National Park', 'Hotspots',
   'Dry deciduous tiger reserve on the Deccan plateau, with elephant herds along the forest roads.',
   11.665400, 76.633000, 'Karnataka, India',
   '["earth-tiger","earth-elephant","earth-deer","sky-peacock"]', TRUE),

  ('demo-silent-valley', 'Silent Valley National Park', 'Hotspots',
   'One of the last undisturbed tracts of tropical evergreen rainforest in the Western Ghats.',
   11.083300, 76.440000, 'Kerala, India',
   '["earth-elephant","sky-scarlet-macaw","grass-fern","water-river"]', TRUE),

  ('demo-athirappilly', 'Athirappilly Falls', 'Waterfalls',
   'A broad 24-metre curtain on the Chalakudy river, fringed by riverine forest.',
   10.285200, 76.569600, 'Kerala, India',
   '["water-waterfall","water-frog","grass-fern"]', TRUE),

  ('demo-thattekad', 'Thattekad Bird Sanctuary', 'Birding',
   'Lowland evergreen forest that Salim Ali called the richest birding site in peninsular India.',
   10.124400, 76.687100, 'Kerala, India',
   '["sky-indian-roller","sky-spotted-owlet","sky-red-whiskered-bulbul","sky-kingfisher"]', TRUE),

  ('demo-valley-of-flowers', 'Valley of Flowers', 'Parks',
   'A high-altitude alpine meadow that carpets over with endemic wildflowers through the monsoon.',
   30.728300, 79.605600, 'Uttarakhand, India',
   '["grass-orchid","grass-yellow-flower","grass-butterfly","earth-mountain-vista"]', TRUE)
ON CONFLICT (id) DO NOTHING;
