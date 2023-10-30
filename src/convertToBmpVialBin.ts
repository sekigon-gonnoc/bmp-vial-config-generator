import { crc16 } from "crc";
import * as struct from "node-c-struct";

export interface BmpConfigProperty {
  version: number;
  device_info: { pid: number; vid: number; name: string; manufacture: string };
  matrix: {
    rows: number;
    cols: number;
    device_rows: number;
    device_cols: number;
    layer: number;
    debounce: number;
    is_left_hand: boolean;
    diode_direction: number;
    row_pins: number[];
    col_pins: number[];
  };
  mode: number;
  startup: number;
  param_peripheral: {
    max_interval: number;
    min_interval: number;
    slave_latency: number;
  };
  param_central: {
    max_interval: number;
    min_interval: number;
    slave_latency: number;
  };
  led: {
    pin: number;
    num: number;
  };
  encoder: {
    pin_a: number[];
    pin_b: number[];
    resolution: number[];
  };
  reserved: number[];
}

interface BmpVialBinProperty {
  magic: number;
  vial_config_length: number;
  vial_config: number[];
  vial_uid: number[];
  bmp_config: BmpConfigProperty;
  vial_reserved: number[];
  crc: number;
}

class DeviceInfo extends struct.struct<object> {
  static get fields() {
    return [
      ["pid", struct.uint16_t],
      ["vid", struct.uint16_t],
      ["name", struct.char.times(32)],
      ["manufacture", struct.char.times(32)],
    ];
  }
}

class Matrix extends struct.struct<object> {
  static get fields() {
    return [
      ["rows", struct.uint8_t],
      ["cols", struct.uint8_t],
      ["device_rows", struct.uint8_t],
      ["device_cols", struct.uint8_t],
      ["layer", struct.uint8_t],
      ["debounce", struct.uint8_t],
      ["is_left_hand", struct.uint8_t],
      ["diode_direction", struct.uint8_t],
      ["row_pins", struct.uint8_t.times(32)],
      ["col_pins", struct.uint8_t.times(32)],
    ]
  }
}

class ConnectionParam extends struct.struct<object> {
  static get fields() {
    return [
      ["max_interval", struct.uint16_t],
      ["min_interval", struct.uint16_t],
      ["slave_latency", struct.uint16_t],
    ];
  }
}

class Led extends struct.struct<object> {
  static get fields() {
    return [
      ["pin", struct.uint8_t],
      ["num", struct.uint8_t],
    ]
  }
}

class Encoder extends struct.struct<object> {
  static get fields() {
    return [
      ["pin_a", struct.uint8_t.times(8)],
      ["pin_b", struct.uint8_t.times(8)],
      ["resolution", struct.uint8_t.times(8)],
    ]
  }
}

export class CBmpConfigBin extends struct.struct<BmpConfigProperty> {
  static get fields() {
    return [
      ["version", struct.uint32_t],
      ["device_info", DeviceInfo],
      ["matrix", Matrix],
      ["mode", struct.uint8_t],
      ["startup", struct.uint8_t],
      ["peripheral", ConnectionParam],
      ["central", ConnectionParam],
      ["led", Led],
      ["encoder", Encoder],
      ["reserved", struct.uint8_t.times(8)],
    ];
  }
}

export class CBmpVialBin extends struct.struct<BmpVialBinProperty> {
  static get fields() {
    return [
      ["magic", struct.uint32_t],
      ["vial_config_length", struct.uint32_t],
      ["vial_config", struct.uint8_t.times(4096 - 276)],
      ["vial_uid", struct.uint8_t.times(8)],
      ["bmp_config", CBmpConfigBin],
      ["reserved", struct.uint8_t.times(64)],
      ["crc", struct.uint32_t],
    ];
  }
}

export function convertToBmpVialBin(vial_config: Uint8Array, bmp_config: any)
{
    const cBin = new CBmpVialBin({
      magic: 0xb05afaae,
      vial_config_length: vial_config.length,
      vial_config: Array.from(vial_config),
      vial_uid: [0x05, 0xe4, 0xa1, 0x7f, 0xdc, 0x87, 0xcb, 0x2a],
      bmp_config: {
        ...bmp_config,
        version: 3,
        device_info: {
          vid: parseInt(bmp_config.device_info.vid, 16),
          pid: parseInt(bmp_config.device_info.pid, 16),
          name: (bmp_config.device_info.name as string)
            .split("")
            .map((c) => c.charCodeAt(0)),
          manufacture: (bmp_config.device_info.manufacture as string)
            .split("")
            .map((c) => c.charCodeAt(0)),
        },
        mode:
          bmp_config.mode === "SPLIT_MASTER"
            ? 1
            : bmp_config.mode === "SPLIT_SLAVE"
            ? 2
            : 0,
      },
      vial_reserved: [],
      crc: 0,
    });

    console.log(CBmpVialBin.alignedSize);
    const crc = crc16(cBin.$arrayBuffer.slice(0, 4096 - 4));
    (cBin as any).crc.$value = crc;

    return cBin;
}
