import 'package:shared_preferences/shared_preferences.dart';

class CosmeticPreferences {
  const CosmeticPreferences({
    this.title = 'Wayfarer',
    this.banner = 'Compass',
    this.gear = 'Forest Cloak',
    this.appearance = 'Wayfarer',
    this.outfit = 'Ranger',
    this.mount = 'None',
    this.companion = 'Nyx',
  });

  final String title;
  final String banner;
  final String gear;
  final String appearance;
  final String outfit;
  final String mount;
  final String companion;

  static const options = {
    'title': ['Wayfarer', 'Scholar', 'Pathfinder', 'Relentless'],
    'banner': ['Compass', 'Oak', 'Ember', 'Moon'],
    'gear': [
      'Forest Cloak',
      'Leather Cuirass',
      'Silver Blade',
      'Compass Amulet',
      'Signet Ring'
    ],
    'appearance': ['Wayfarer', 'Scholar', 'Vanguard'],
    'outfit': ['Ranger', 'Archivist', 'Guardian'],
    'mount': ['None', 'Ash Mare', 'Dawn Elk'],
    'companion': ['Nyx', 'Ember Fox', 'Stone Owl'],
  };

  static Future<CosmeticPreferences> load() async {
    final prefs = await SharedPreferences.getInstance();
    return CosmeticPreferences(
      title: prefs.getString('cosmetic_title') ?? 'Wayfarer',
      banner: prefs.getString('cosmetic_banner') ?? 'Compass',
      gear: prefs.getString('cosmetic_gear') ?? 'Forest Cloak',
      appearance: prefs.getString('cosmetic_appearance') ?? 'Wayfarer',
      outfit: prefs.getString('cosmetic_outfit') ?? 'Ranger',
      mount: prefs.getString('cosmetic_mount') ?? 'None',
      companion: prefs.getString('cosmetic_companion') ?? 'Nyx',
    );
  }

  Future<CosmeticPreferences> select(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cosmetic_$key', value);
    return CosmeticPreferences(
      title: key == 'title' ? value : title,
      banner: key == 'banner' ? value : banner,
      gear: key == 'gear' ? value : gear,
      appearance: key == 'appearance' ? value : appearance,
      outfit: key == 'outfit' ? value : outfit,
      mount: key == 'mount' ? value : mount,
      companion: key == 'companion' ? value : companion,
    );
  }
}
