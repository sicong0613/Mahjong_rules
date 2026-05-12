#include <emscripten/bind.h>
#include "fan_calculator.h"
#include <string>

using namespace emscripten;
using namespace mahjong;

// JS call: calculateFan(standingTiles[], fixedPacks[], winTile, flowerCount, winFlag, prevalentWind, seatWind)
// Returns: array of {fan, count, value, name} on success, or negative error code as int
val js_calculate_fan(
    val standing_tiles_js,
    val fixed_packs_js,
    int win_tile,
    int flower_count,
    int win_flag,
    int prevalent_wind,
    int seat_wind
) {
    calculate_param_t param = {};

    int tile_count = standing_tiles_js["length"].as<int>();
    param.hand_tiles.tile_count = tile_count;
    for (int i = 0; i < tile_count && i < 13; i++) {
        param.hand_tiles.standing_tiles[i] = (tile_t)standing_tiles_js[i].as<int>();
    }

    int pack_count = fixed_packs_js["length"].as<int>();
    param.hand_tiles.pack_count = pack_count;
    for (int i = 0; i < pack_count && i < 5; i++) {
        param.hand_tiles.fixed_packs[i] = (pack_t)fixed_packs_js[i].as<int>();
    }

    param.win_tile        = (tile_t)win_tile;
    param.flower_count    = (uint8_t)flower_count;
    param.win_flag        = (win_flag_t)win_flag;
    param.prevalent_wind  = (wind_t)prevalent_wind;
    param.seat_wind       = (wind_t)seat_wind;

    fan_table_t fan_table = {};
    int result = calculate_fan(&param, &fan_table);

    if (result < 0) {
        return val(result);
    }

    val arr = val::array();
    int idx = 0;
    for (int i = 1; i < FAN_TABLE_SIZE; i++) {
        if (fan_table[i] > 0) {
            val item = val::object();
            item.set("fan",   i);
            item.set("count", (int)fan_table[i]);
            item.set("value", (int)fan_value<>::table[i]);
            item.set("name",  std::string(fan_name<>::text[i]));
            arr.set(idx++, item);
        }
    }
    return arr;
}

// Encode a tile: suit 1=万 2=条 3=饼 4=字, rank 1-9 (honors: 1=E 2=S 3=W 4=N 5=中 6=发 7=白)
int js_make_tile(int suit, int rank) {
    return (int)make_tile((suit_t)suit, (rank_t)rank);
}

// Encode a melded pack: offer 1/2/3=上/对/下家, type 1=顺 2=刻 3=杠, tile=代表牌(顺子为中间那张)
int js_make_pack(int offer, int type, int tile) {
    return (int)make_pack((uint8_t)offer, (uint8_t)type, (tile_t)tile);
}

std::string js_get_fan_name(int fan_id) {
    if (fan_id <= 0 || fan_id >= FAN_TABLE_SIZE) return "";
    return std::string(fan_name<>::text[fan_id]);
}

int js_get_fan_value(int fan_id) {
    if (fan_id <= 0 || fan_id >= FAN_TABLE_SIZE) return 0;
    return (int)fan_value<>::table[fan_id];
}

EMSCRIPTEN_BINDINGS(mahjong_calculator) {
    function("calculateFan",  &js_calculate_fan);
    function("makeTile",      &js_make_tile);
    function("makePack",      &js_make_pack);
    function("getFanName",    &js_get_fan_name);
    function("getFanValue",   &js_get_fan_value);

    // win_flag constants
    constant("WIN_FLAG_DISCARD",       (int)WIN_FLAG_DISCARD);
    constant("WIN_FLAG_SELF_DRAWN",    (int)WIN_FLAG_SELF_DRAWN);
    constant("WIN_FLAG_LAST_TILE",     (int)WIN_FLAG_LAST_TILE);
    constant("WIN_FLAG_KONG_INVOLVED", (int)WIN_FLAG_KONG_INVOLVED);
    constant("WIN_FLAG_WALL_LAST",     (int)WIN_FLAG_WALL_LAST);

    // error codes
    constant("ERROR_WRONG_TILES_COUNT", (int)ERROR_WRONG_TILES_COUNT);
    constant("ERROR_TILE_MORE_THAN_4",  (int)ERROR_TILE_MORE_THAN_4);
    constant("ERROR_NOT_WIN",           (int)ERROR_NOT_WIN);

    // table size (iterate 1..FAN_TABLE_SIZE-1 to enumerate all fans)
    constant("FAN_TABLE_SIZE", (int)FAN_TABLE_SIZE);
}
