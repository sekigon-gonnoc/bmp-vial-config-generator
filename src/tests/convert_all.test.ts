
import { convertToBmpVialBin } from "../convertToBmpVialBin.js";
import convertInfoJsonToConfigJson from "../convertToConfigJson.js";
import { convertToVialJson } from "../convertToVialJson.js";
// import init, { xz_compress } from "./pkg/liblzma_wasm.js";
import * as bmpKeycodes from "../bmpKeycodes.json";
import { expect, it } from "vitest";
import { keyboards as keyboard_list } from "../keyboard_list.js";
const fs = require("fs");
const mkdirp = require("mkdirp");
const getDirName = require("path").dirname;
const lzma = require("lzma-native");

it("json-to-bin", async () => {
  await convert_all_json().then();
});

async function convert_all_json(){
    const files = fs.readdirSync("generate/json")

    for (const file of files) {
        if (!file.includes('config.json')) continue;
        const dest_path = 'generate/json/' + file.split('_').slice(0, -2).join('_');
        const vial_path = dest_path + '_vial.json'
        const vial = JSON.parse(fs.readFileSync(vial_path));
        const config = JSON.parse(fs.readFileSync('generate/json/' + file));
        const config_type = file.split('_').slice(-2)[0];

        console.log(dest_path, vial, config, config_type);
        await convert_vial_json_to_bin(dest_path, vial, config, config_type)
    }
}

async function convert_vial_json_to_bin(dest_path, vial, config, config_type) {
    const vialJson = {
        ...vial,
        customKeycodes: bmpKeycodes.customKeycodes,
    };

    const vialData = await lzma.compress(JSON.stringify(vialJson), "6");
    const bmpVialBin = convertToBmpVialBin(vialData, config.config);
    const path = `${dest_path}_${config_type}_config.bin`;
    await mkdirp.mkdirp(getDirName(path));
    fs.writeFileSync(path, Buffer.from(bmpVialBin.$arrayBuffer));
} 