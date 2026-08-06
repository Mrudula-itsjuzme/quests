function species(id, commonName, scientificName, element, category, baseRarity, { nocturnal = false, sensitive = false, seasonalityMonths = [], encyclopedia = '' } = {}) {
  return Object.freeze({ id, commonName, scientificName, element, category, baseRarity, nocturnal, sensitive, seasonalityMonths, encyclopedia, enabled: true });
}

export const speciesCatalog = Object.freeze([
  species('sky-house-sparrow', 'House Sparrow', 'Passer domesticus', 'Sky', 'Fauna', 0.05, { encyclopedia: 'One of the most familiar birds worldwide, thriving alongside humans in cities and villages.' }),
  species('sky-rock-pigeon', 'Rock Pigeon', 'Columba livia', 'Sky', 'Fauna', 0.04),
  species('sky-common-myna', 'Common Myna', 'Acridotheres tristis', 'Sky', 'Fauna', 0.08),
  species('sky-red-whiskered-bulbul', 'Red-whiskered Bulbul', 'Pycnonotus jocosus', 'Sky', 'Fauna', 0.18),
  species('sky-indian-roller', 'Indian Roller', 'Coracias benghalensis', 'Sky', 'Fauna', 0.35, { encyclopedia: 'Known for its brilliant blue flight feathers, revealed dramatically in flight.' }),
  species('sky-kingfisher', 'Common Kingfisher', 'Alcedo atthis', 'Water', 'Fauna', 0.42),
  species('sky-blue-billed-cuckoo', 'Blue-billed Cuckoo', 'Cuculus inflexus', 'Water', 'Fauna', 0.78, { encyclopedia: 'A rare cuckoo found in dense forests. Its call is a musical reminder of nature’s harmony.' }),
  species('sky-barn-owl', 'Barn Owl', 'Tyto alba', 'Sky', 'Fauna', 0.55, { nocturnal: true }),
  species('sky-spotted-owlet', 'Spotted Owlet', 'Athene brama', 'Sky', 'Fauna', 0.48, { nocturnal: true }),
  species('sky-peacock', 'Indian Peafowl', 'Pavo cristatus', 'Sky', 'Fauna', 0.30, { encyclopedia: 'India’s national bird, famous for the male’s iridescent train of feathers.' }),
  species('sky-flamingo', 'Greater Flamingo', 'Phoenicopterus roseus', 'Water', 'Fauna', 0.68, { seasonalityMonths: [11, 12, 1, 2, 3] }),
  species('sky-bald-eagle', 'Bald Eagle', 'Haliaeetus leucocephalus', 'Sky', 'Fauna', 0.72),
  species('sky-scarlet-macaw', 'Scarlet Macaw', 'Ara macao', 'Sky', 'Fauna', 0.82, { sensitive: true }),
  species('sky-african-grey-parrot', 'African Grey Parrot', 'Psittacus erithacus', 'Sky', 'Fauna', 0.88, { sensitive: true, encyclopedia: 'Highly intelligent and social parrots native to the forests of West and Central Africa. Known for their remarkable mimicry and problem solving abilities.' }),

  species('earth-red-fox', 'Red Fox', 'Vulpes vulpes', 'Earth', 'Fauna', 0.45, { nocturnal: true }),
  species('earth-golden-retriever', 'Golden Retriever', 'Canis lupus familiaris', 'Earth', 'Fauna', 0.03),
  species('earth-domestic-cat', 'Domestic Cat', 'Felis catus', 'Earth', 'Fauna', 0.02),
  species('earth-orange-tabby-cat', 'Orange Tabby Cat', 'Felis catus', 'Earth', 'Fauna', 0.12, { encyclopedia: 'A beloved coat pattern caused by a sex-linked orange gene.' }),
  species('earth-squirrel', 'Indian Palm Squirrel', 'Funambulus palmarum', 'Earth', 'Fauna', 0.06),
  species('earth-mongoose', 'Indian Grey Mongoose', 'Herpestes edwardsii', 'Earth', 'Fauna', 0.32),
  species('earth-snow-leopard', 'Snow Leopard', 'Panthera uncia', 'Earth', 'Fauna', 0.94, { sensitive: true, nocturnal: true, encyclopedia: 'An elusive high-altitude big cat, one of the rarest sightings on Earth.' }),
  species('earth-tiger', 'Bengal Tiger', 'Panthera tigris tigris', 'Earth', 'Fauna', 0.92, { sensitive: true }),
  species('earth-elephant', 'Asian Elephant', 'Elephas maximus', 'Earth', 'Fauna', 0.70, { sensitive: true }),
  species('earth-deer', 'Spotted Deer', 'Axis axis', 'Earth', 'Fauna', 0.28),
  species('earth-hedgehog', 'European Hedgehog', 'Erinaceus europaeus', 'Earth', 'Fauna', 0.5, { nocturnal: true }),
  species('earth-rabbit', 'European Rabbit', 'Oryctolagus cuniculus', 'Earth', 'Fauna', 0.15),

  species('water-koi', 'Koi Carp', 'Cyprinus rubrofuscus', 'Water', 'Fauna', 0.20),
  species('water-dolphin', 'Bottlenose Dolphin', 'Tursiops truncatus', 'Water', 'Fauna', 0.75, { sensitive: true }),
  species('water-sea-turtle', 'Green Sea Turtle', 'Chelonia mydas', 'Water', 'Fauna', 0.80, { sensitive: true }),
  species('water-frog', 'Common Frog', 'Rana temporaria', 'Water', 'Fauna', 0.18, { nocturnal: true }),
  species('water-waterfall', 'Forest Waterfall', null, 'Water', 'Landscape', 0.55, { encyclopedia: 'A cascading freshwater feature carved into rock over centuries.' }),
  species('water-river', 'River Bend', null, 'Water', 'Landscape', 0.30),
  species('water-lake', 'Still Lake', null, 'Water', 'Landscape', 0.25),
  species('water-tide-pool', 'Coastal Tide Pool', null, 'Water', 'Landscape', 0.40),

  species('grass-yellow-flower', 'Yellow Wildflower', null, 'Grass', 'Flora', 0.08),
  species('grass-rose', 'Garden Rose', 'Rosa', 'Grass', 'Flora', 0.05),
  species('grass-sunflower', 'Sunflower', 'Helianthus annuus', 'Grass', 'Flora', 0.10),
  species('grass-lotus', 'Sacred Lotus', 'Nelumbo nucifera', 'Grass', 'Flora', 0.22),
  species('grass-orchid', 'Wild Orchid', 'Orchidaceae', 'Grass', 'Flora', 0.62, { sensitive: true }),
  species('grass-banyan-tree', 'Banyan Tree', 'Ficus benghalensis', 'Grass', 'Flora', 0.34, { encyclopedia: 'A sprawling fig tree whose aerial roots form new trunks over centuries.' }),
  species('grass-oak-tree', 'English Oak', 'Quercus robur', 'Grass', 'Flora', 0.15),
  species('grass-bamboo', 'Bamboo Grove', 'Bambusoideae', 'Grass', 'Flora', 0.12),
  species('grass-fern', 'Fiddlehead Fern', 'Polypodiopsida', 'Grass', 'Flora', 0.20),
  species('grass-cactus-bloom', 'Blooming Cactus', 'Cactaceae', 'Grass', 'Flora', 0.45),
  species('grass-butterfly', 'Monarch Butterfly', 'Danaus plexippus', 'Grass', 'Fauna', 0.38, { seasonalityMonths: [8, 9, 10] }),
  species('grass-honeybee', 'Western Honeybee', 'Apis mellifera', 'Grass', 'Fauna', 0.10),
  species('grass-ladybird', 'Seven-spot Ladybird', 'Coccinella septempunctata', 'Grass', 'Fauna', 0.06),

  species('fire-sunrise', 'Sunrise', null, 'Fire', 'Landscape', 0.32),
  species('fire-sunset', 'Sunset', null, 'Fire', 'Landscape', 0.28),
  species('fire-rainbow', 'Rainbow', null, 'Fire', 'Landscape', 0.90, { encyclopedia: 'A fleeting optical phenomenon formed by light refracting through rain droplets.' }),
  species('fire-lightning', 'Lightning Strike', null, 'Fire', 'Landscape', 0.85),
  species('fire-volcano', 'Volcanic Vent', null, 'Fire', 'Landscape', 0.96, { sensitive: true }),
  species('fire-campfire', 'Campfire', null, 'Fire', 'Landscape', 0.10),
  species('fire-autumn-leaves', 'Autumn Foliage', null, 'Fire', 'Landscape', 0.22, { seasonalityMonths: [9, 10, 11] }),

  species('earth-mountain-vista', 'Mountain Vista', null, 'Earth', 'Landscape', 0.50),
  species('earth-canyon', 'Desert Canyon', null, 'Earth', 'Landscape', 0.60),
  species('earth-cave', 'Limestone Cave', null, 'Earth', 'Landscape', 0.58),
  species('sky-aurora', 'Aurora Borealis', null, 'Sky', 'Landscape', 0.97, { encyclopedia: 'The northern lights — charged solar particles colliding with the atmosphere.' }),
  species('sky-milky-way', 'Milky Way', null, 'Sky', 'Landscape', 0.93),

  species('grass-old-library', 'Historic Library', null, 'Grass', 'Heritage', 0.35),
  species('earth-stone-bridge', 'Stone Bridge', null, 'Earth', 'Heritage', 0.25),
  species('earth-ancient-ruin', 'Ancient Ruin', null, 'Earth', 'Heritage', 0.65, { sensitive: true }),
]);

export function findSpeciesById(id) {
  return speciesCatalog.find((entry) => entry.id === id) || null;
}

export function findSpeciesByCommonName(name) {
  const normalized = String(name || '').trim().toLowerCase();
  return speciesCatalog.find((entry) => entry.commonName.toLowerCase() === normalized) || null;
}
