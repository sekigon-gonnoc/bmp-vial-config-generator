
export function convertToVialJson(info)
{
    const vial_config = {
        name: info.keyboard_name,
        vendorId: info.usb.vid,
        productId: info.usb.pid,
        matrix: {
            rows: Object.values(info.layouts).map(l => Object.values(l.layout)).flat().reduce(
                (a, b) => Math.max(a, b.matrix[0]), 0) + 1,
            cols: Object.values(info.layouts).map(l => Object.values(l.layout)).flat().reduce(
                (a, b) => Math.max(a, b.matrix[1]), 0) + 1,
        }, layouts: { labels: [], keymap: [] }
    };
    let layout_index = 0;
    vial_config.layouts.labels = [["Layout"].concat(Object.keys(info.layouts))];
    vial_config.layouts.keymap = Object.values(info.layouts).map(
        (layout) => {
            const vial_layout = layout.layout.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y).reduce((vial_matrix, key) => {
                let x_diff = Math.round(key.x - vial_matrix.prev_w - vial_matrix.prev_x, 2);
                let y_diff = Math.round(key.y - vial_matrix.prev_y, 2);
                const col = key.y - vial_matrix.prev_y == 0 ? vial_matrix.col + 1 : 0;


                if (col == 0) {
                    vial_matrix.layout.keymap.push([]);
                    y_diff -= 1;
                    x_diff = key.x;
                }

                const option = {};

                if (x_diff != 0) {
                    option.x = x_diff;
                }

                if (y_diff != 0) {
                    option.y = y_diff;
                }

                if (key.h !== undefined && key.h != 1) {
                    option.h = key.h;
                }

                if (key.w !== undefined && key.h != 1) {
                    option.w = key.w;
                }

                if (key.w == 1.25 && key.h == 2) {
                    // probably ISO enter
                    option.w2 = 1;
                    option.h2 = 1;
                    option.x2 = -0.25;
                }

                if (Object.entries(option).length > 0) {
                    vial_matrix.layout.keymap[vial_matrix.layout.keymap.length - 1].push(option);
                }

                vial_matrix.layout.keymap[vial_matrix.layout.keymap.length - 1].push(`${key.matrix[0]},${key.matrix[1]}\n\n\n0,${layout_index}`);

                return {
                    layout: vial_matrix.layout,
                    prev_x: key.x,
                    prev_y: key.y,
                    prev_w: key.w ?? 1,
                    col: col
                };
            }
                , { layout: { keymap: [] }, prev_x: -1, prev_y: -1, prev_w: 1, col: 0 });
            layout_index += 1;
            vial_layout.layout.keymap.push([]);

            return vial_layout.layout.keymap;
        }
    ).flat();

    if (info.encoder?.rotary?.length > 0) {
        vial_config.layouts.keymap[0] = vial_config.layouts.keymap[0].concat([{ x: 1 }]);
        for (let idx = 0; idx < info.encoder.rotary.length; idx++) {
            vial_config.layouts.keymap[0] = vial_config.layouts.keymap[0].concat([`${idx},0\n\n\n\n\n\n\n\n\ne`,
            `${idx},1\n\n\n\n\n\n\n\n\ne`]);
        }
    }

    return vial_config;
}