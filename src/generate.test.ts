import { convertToBmpVialBin } from "./convertToBmpVialBin";
import convertInfoJsonToConfigJson from "./convertToConfigJson.js";
import { convertToVialJson } from "./convertToVialJson.js";
// import init, { xz_compress } from "./pkg/liblzma_wasm.js";
import * as bmpKeycodes from "./bmpKeycodes.json";
import { expect, it } from "vitest";
import { keyboards as keyboard_list } from "./keyboard_list.js";
const fs = require("fs");
const mkdirp = require("mkdirp");
const getDirName = require("path").dirname;
const lzma = require("lzma-native");

const keyboardListAPI = `https://api.qmk.fm/v1/keyboards`;
const keyboardAPI = `https://keyboards.qmk.fm/v1/keyboards`;

const keyboard_name = keyboard_list.map((k) => {
  if (k.layout.length == 1 && k.layout[0].startsWith("rev")) {
    return k.name + "/" + k.layout[0];
  } else {
    return k.name;
  }
});

const keyboards = await fetch(keyboardListAPI).then((res) => res.json());

it("qmk-api", async () => {
  await convert_from_qmk_api().then();
});

it("json-to-bin", async () => {
  await convert_all_json().then();
});

async function convert_from_qmk_api() {
  // init();

  for (const k of keyboard_name) {
    const kbs = keyboards.filter((kb) => kb.includes(k));
    if (kbs.length > 0) {
      for (const kb of kbs) {
        console.log(kb);
        await generate_config_files(k, kb);
      }
    }
  }
}

async function generate_config_files(name, keyboard_path) {
  const info = await fetch(`${keyboardAPI}/${keyboard_path}/info.json`)
    .then((res) => res.json())
    .then((j) => j.keyboards[keyboard_path]);
    const dest_path = info.keyboard_folder.replaceAll('/', '_');
  try {
    const config = convertInfoJsonToConfigJson(info);
    const vialJson = {
      ...convertToVialJson(info),
      customKeycodes: bmpKeycodes.customKeycodes,
    };

    for (const e of Object.entries(config)) {
      console.log(e[0]);
      // const vialData = xz_compress(vialJson.slice());
      const vialData = await lzma.compress(JSON.stringify(vialJson), "6");
      const bmpVialBin = convertToBmpVialBin(vialData, e[1].config);
      const path = `generate/${dest_path}_${e[0]}_config.bin`;
      await mkdirp.mkdirp(getDirName(path));
      fs.writeFileSync(path, Buffer.from(bmpVialBin.$arrayBuffer));

      const config_json_path = `generate/${dest_path}_${e[0]}_config.json`;
      fs.writeFileSync(config_json_path, JSON.stringify(e[1], null, 4));
    }

    const vial_json_path = `generate/${dest_path}_vial.json`;
    fs.writeFileSync(vial_json_path, JSON.stringify(vialJson, null, 4));
  } catch (error) {
    console.log(error);
  }
}

async function convert_all_json() {
  const files = fs.readdirSync('generate')
  for (const file of files) {
    if (!file.includes('config.json')) continue;
    const dest_path = 'generate/' + file.split('_').slice(0, -2).join('_');
    const vial_path = dest_path + '_vial.json'
    const vial = JSON.parse(fs.readFileSync(vial_path));
    const config = JSON.parse(fs.readFileSync('generate/' + file));
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

    const vial_json_path = `${dest_path}_vial.json`;
    fs.writeFileSync(vial_json_path, JSON.stringify(vialJson, null, 4));
  } 