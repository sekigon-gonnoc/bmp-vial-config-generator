
const PIN_TABLE = {
    'D3': 1, 'D2': 2, 'D1': 5, 'D0': 6, 'D4': 7, 'C6': 8, 'D7': 9, 'E6': 10, 'B4': 11,
    'B5': 12, 'B6': 13, 'B2': 14, 'B3': 15, 'B1': 16, 'F7': 17, 'F6': 18, 'F5': 19, 'F4': 20
};

function getDiodeDir(str) {
    switch (str) {
        case "COL2ROW":
            return 0;
        case "ROW2COL":
            return 1;
        default:
            return 0;
    }
}

function overrideRightConfig(info, config_left) {
    let config_right = JSON.parse(JSON.stringify(config_left));
    config_right.config.mode = "SPLIT_SLAVE";
    config_right.config.matrix.is_left_hand = 0;

    if (info.split?.enabled && info.split?.matrix_pins?.right) {
        console.log("override matrix_pins for config_right");
        let row, col;
        if (info.split?.matrix_pins?.right.direct) {
            row = [0];
            col = info.split.matrix_pins.right.direct.flat(Infinity).map(r => (r == null) ? 0 : PIN_TABLE[r]);
            console.log(info.split.matrix_pins);
        } else {
            row = info.split.matrix_pins.right.rows.map(r => (r == null) ? 0 : PIN_TABLE[r]);
            col = info.split.matrix_pins.right.cols.map(r => (r == null) ? 0 : PIN_TABLE[r]);
        }
        config_right.config.matrix.row_pins = row;
        config_right.config.matrix.col_pins = col;
    }

    return config_right;
}

function convertInfoJsonToConfigJson(info) {
    console.log(info);

    let row, col;

    if (info.matrix_pins.direct) {
        row = [0];
        col = info.matrix_pins.direct.flat(Infinity).map(r => (r == null) ? 0 : PIN_TABLE[r]);
        console.log(info.matrix_pins);
    } else {
        row = info.matrix_pins.rows.map(r => (r == null) ? 0 : PIN_TABLE[r]);
        col = info.matrix_pins.cols.map(r => (r == null) ? 0 : PIN_TABLE[r]);
    }
    console.log(row, col);

    if (row.some(n => n == null) || col.some(n => n == null)) {
        console.log('not pro micro');
        throw Error("This keyboard may not use Pro Micro");
    }

    const matrix_rows = Object.values(info.layouts).map(l => Object.values(l.layout)).flat().reduce(
        (a, b) => Math.max(a, b.matrix[0]), 0) + 1;
    const matrix_cols = Object.values(info.layouts).map(l => Object.values(l.layout)).flat().reduce(
        (a, b) => Math.max(a, b.matrix[1]), 0) + 1;

    const diodeDir = getDiodeDir(info.diode_direction);

    const ledPin = (info.ws2812?.pin) ? PIN_TABLE[info.ws2812.pin] : 255;
    const ledNum = info.rgblight?.led_count ?? 0;
    const encoder = info.encoder?.rotary?.reduce((acc, enc) => {
        acc.pin_a.push(PIN_TABLE[enc.pin_a]);
        acc.pin_b.push(PIN_TABLE[enc.pin_b]);
        if (enc.resolution) {
            acc.resolution.push(enc.resolution);
        }
        return acc;
    }, { pin_a: [], pin_b: [], resolution: [] });

    let config_left = {
        config: {
            version: 2,
            device_info: {
                vid: info.usb.vid,
                pid: info.usb.pid, name: info.keyboard_name,
                manufacture: info.manufacturer ?? ""
            },
            matrix: {
                rows: matrix_rows,
                cols: matrix_cols,
                layer: 8,
                device_rows: row.length,
                device_cols: col.length,
                debounce: 1,
                is_left_hand: 1,
                diode_direction: diodeDir,
                row_pins: row,
                col_pins: col,
            },
            mode: "SINGLE",
            startup: 1,
            peripheral: { max_interval: 30, min_interval: 30, slave_latency: 16 },
            central: { max_interval: 30, min_interval: 30, slave_latency: 0 },
            led: { pin: ledPin, num: ledNum },
            encoder: encoder,
            reserved: [0, 0, 0, 0, 0, 0, 0, 0],
        }
    };

    if (!info.matrix_pins.direct && !info.split?.enabled && (config_left.config.matrix.device_rows < matrix_rows || config_left.config.matrix.device_cols < matrix_cols)) {
        // may be row2col2row or col2row2col
        config_left.config.matrix.diode_direction += 4;
    }

    const baseConfig = config_left;

    if (!info.split?.enabled) {
        return { single: baseConfig };
    }

    config_left.config.mode = "SPLIT_MASTER";
    const config_right = overrideRightConfig(info, config_left);

    if (config_left.config.matrix.diode_direction == 0) {
        config_left.config.matrix.rows = config_left.config.matrix.device_rows + config_right.config.matrix.device_rows;
        config_right.config.matrix.rows = config_left.config.matrix.rows;
    }
    else if (config_left.config.matrix.diode_direction == 1) {
        config_left.config.matrix.cols = config_left.config.matrix.device_cols + config_right.config.matrix.device_cols;
        config_right.config.matrix.cols = config_left.config.matrix.cols;
    }

    const masterConfig = config_left;
    const slaveConfig = config_right;

    if (config_left.config.matrix.row_pins.some(k => (k == 5 || k == 6))
        || config_left.config.matrix.col_pins.some(k => (k == 5 || k == 6))) {
        return { 'master': masterConfig, 'slave': slaveConfig };
    }

    const lpmeConfig = JSON.parse(JSON.stringify(config_left));
    lpmeConfig.config.matrix.diode_direction += 2;
    lpmeConfig.config.matrix.row_pins = [...config_left.config.matrix.row_pins, ...config_right.config.matrix.row_pins];
    lpmeConfig.config.matrix.col_pins = [...config_left.config.matrix.col_pins, ...config_right.config.matrix.col_pins];
    lpmeConfig.config.mode = "SINGLE";

    // console.log(masterConfig);
    // console.log(slaveConfig);
    // console.log(lpmeConfig);

    return { master: masterConfig, slave: slaveConfig, lpme: lpmeConfig };
}

function validateConfigJson(config) {
    if (config.config.matrix.rows > 32) {
        throw Error("config.matrix.rows > 32");
    }
    if (config.config.matrix.cols > 32) {
        throw Error("config.matrix.cols > 32");
    }
    if (config.config.matrix.device_rows > config.config.matrix.rows) {
        throw Error("config.matrix.device_rows > config.matrix.rows")
    }
    if (config.config.matrix.device_cols > config.config.matrix.cols) {
        throw Error("config.matrix.device_cols > config.matrix.cols")
    }
    if (config.config.matrix.layer > 32 || config.config.matrix.layer < 1) {
        throw Error("invalid config.matrix.layer ")
    }
}

export { convertInfoJsonToConfigJson, validateConfigJson }