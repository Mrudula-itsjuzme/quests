-- species_discovery_stats was created in 011 speculatively and never populated;
-- discovery-frequency is computed live from captured_cards instead (see
-- getSpeciesDiscoveryStats in api/lib/postgres-repository.js). Drop it rather
-- than leave unused, unwritten schema in place.
DROP TABLE IF EXISTS species_discovery_stats;
