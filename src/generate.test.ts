import { convertToBmpVialBin } from "./convertToBmpVialBin";
import convertInfoJsonToConfigJson from "./convertToConfigJson.js";
import { convertToVialJson } from "./convertToVialJson.js";
// import init, { xz_compress } from "./pkg/liblzma_wasm.js";
import * as bmpKeycodes from './bmpKeycodes.json'
import { expect, it } from 'vitest';
const fs = require('fs')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const lzma = require('lzma-native')

const keyboardListAPI = `https://api.qmk.fm/v1/keyboards`;
const keyboardAPI = `https://keyboards.qmk.fm/v1/keyboards`;

const keyboard_name = ["7skb", "owl8"];

const keyboards = await fetch(keyboardListAPI).then((res) => res.json())

it("main", async () => {
 await main().then();
});

async function main() {
    // init();

    for (const k of keyboard_name) {
        const kbs = keyboards.filter((kb) => kb.includes(k));
        if (kbs.length > 0) {
            for (const kb of kbs) {
                console.log(kb);
                await generate_config_files(kb);
            }

        }
    }
}

async function generate_config_files(keyboard) {
  const info = await fetch(`${keyboardAPI}/${keyboard}/info.json`)
    .then((res) => res.json())
    .then((j) => j.keyboards[keyboard]);
  const config = convertInfoJsonToConfigJson(info);
  const vialJson = { ...convertToVialJson(info), ...bmpKeycodes };

  for (const e of Object.entries(config)) {
    console.log(e[0]);
    // const vialData = xz_compress(vialJson.slice());
    const vialData = await lzma.compress(JSON.stringify(vialJson), '6');
    const bmpVialBin = convertToBmpVialBin(vialData, e[1].config);
    const path = `generate/${keyboard}_${e[0]}_config.bin`;
    mkdirp.mkdirp(getDirName(path));
    fs.writeFileSync(path, Buffer.from(bmpVialBin.$arrayBuffer));
  }
}