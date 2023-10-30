import { ChangeEvent, useEffect, useState } from "react";
import convertInfoJsonToConfigJson from "./convertToConfigJson";
import { convertToVialJson } from "./convertToVialJson";
import init, { xz_compress } from "./pkg";
import "./App.css";
import { convertToBmpVialBin } from "./convertToBmpVialBin";
import * as bmpKeycodes from './bmpKeycodes.json'

const keyboardListAPI = `https://api.qmk.fm/v1/keyboards`;
const keyboardAPI = `https://keyboards.qmk.fm/v1/keyboards`;

function App() {
  const [keyboardList, setKeyboardList] = useState<Array<string>>([]);
  const [keyboardListFiltered, setKeyboardListFiltered] = useState<
    Array<string>
  >([]);
  const [selectedKb, setSelectedKb] = useState("");
  const [filterText, setFilterText] = useState("");
  const [infoJson, setInfoJson] = useState("");
  const [configJson, setConfigJson] = useState("");
  const [vialJson, setVialJson] = useState("");
  const [configType, setConfigType] = useState("");
  const [configTypeList, setConfigTypeList] = useState<{ [key: string]: any }>(
    {}
  );

  useEffect(() => {
    console.log("load wasm");
    init();
  }, []);

  useEffect(() => {
    if (keyboardList.length == 0) {
      console.log("fetch keyboard list");
      fetch(keyboardListAPI)
        .then((res) => res.json())
        .then((kb) => {
          setKeyboardList(kb);
          const filteredList = kb.filter((kb: string) =>
            kb.includes(filterText)
          );
          setKeyboardListFiltered(filteredList);

          if (filteredList.length > 0 && filteredList[0] != selectedKb) {
            setSelectedKb(filteredList[0]);
          }
        })
        .catch(() => setKeyboardList(["null"]));
    }
  }, [keyboardList, filterText]);

  useEffect(() => {
    if (selectedKb) {
      console.log("fetch keyboard info.json");
      const kbName = selectedKb;
      fetch(`${keyboardAPI}/${kbName}/info.json`)
        .then((res) => res.json())
        .then((kb) => setInfoJson(JSON.stringify(kb.keyboards[kbName])));
    } else {
      setInfoJson("");
    }
  }, [selectedKb]);

  useEffect(() => {
    if (configType !== "") {
      if (configType in configTypeList) {
        setConfigJson(JSON.stringify(configTypeList[configType], null, "\t"));
      } else {
        setConfigJson("");
      }
    }
  }, [configTypeList, configType]);

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
    const filteredList = keyboardList.filter((kb) =>
      kb.includes(event.target.value)
    );
    setKeyboardListFiltered(filteredList);
    if (filteredList.length > 0 && filteredList[0] != selectedKb) {
      setSelectedKb(filteredList[0]);
    }
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value != selectedKb) {
      setSelectedKb(event.target.value);
    }
  };

  const handleSelectConfigChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value != configType) {
      setConfigType(event.target.value);
    }
  };

  const handleInfoTextAreaChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInfoJson(event.target.value);
  };

  const handleGenerateClick = () => {
    try {
      const config = convertInfoJsonToConfigJson(JSON.parse(infoJson));
      setConfigTypeList(config);
      if (config.default) {
        setConfigType("default");
      } else if (config.master) {
        setConfigType("master");
      }
    } catch (error) {
      alert(error);
      setConfigTypeList({});
    }

    const vial = convertToVialJson(JSON.parse(infoJson));
    setVialJson(JSON.stringify(vial, null, "\t"));
  };

  const handleConfigTextAreaChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setConfigJson(event.target.value);
  };

  const handleVialTextAreaChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setVialJson(event.target.value);
  };

  const downloadData = (data: any, name: string) => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([data]));
    link.setAttribute("href", url);
    link.setAttribute("download", name);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadClick = () => {
    try {
      JSON.parse(vialJson);
    } catch (error) {
      alert("Invalid vial JSON");
      return;
    }

    try {
      JSON.parse(configJson);
    } catch (error) {
      alert("Invalid config JSON");
      return;
    }

    const vialData = xz_compress(vialJson.slice());
    const bmpVialBin = convertToBmpVialBin(
      vialData,
      JSON.parse(configJson).config
    );

    downloadData(bmpVialBin.$arrayBuffer, `${selectedKb}_${configType}.bin`);
  };

  const handleAppendBmpCustomKeycodesClick = () => {
    try {
      const json = JSON.stringify(
        {
          ...JSON.parse(vialJson),
          ...bmpKeycodes,
        },
        null,
        "\t"
      );
      setVialJson(json);
    } catch (error) {
      alert("Invalid vial JSON");
    }
  };

  const handleDownloadVialJsonClick = () => {
    try {
      JSON.parse(vialJson);
    } catch (error) {
      alert("Invalid vial JSON");
      return;
    }
    downloadData(vialJson, `${selectedKb}_vial.json`);
  };

  const handleDownloadConfigJsonClick = () => {
    try {
      JSON.parse(configJson);
    } catch (error) {
      alert("Invalid config JSON");
      return;
    }
    downloadData(configJson, `${selectedKb}_${configType}_config.json`);
  };

  return (
    <div className="grid-container">
      <div className="grid-row">
        <textarea
          value={infoJson}
          onChange={handleInfoTextAreaChange}
          placeholder="info.json"
        ></textarea>
      </div>
      <div className="grid-row-2">
        <input
          type="text"
          placeholder="絞り込みテキスト"
          value={filterText}
          onChange={handleFilterChange}
        />
        <select value={selectedKb} onChange={handleSelectChange}>
          <option value="">選択してください</option>
          {keyboardListFiltered.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button onClick={handleGenerateClick}>Generate</button>
      </div>
      <div className="grid-row">
        <textarea
          value={vialJson}
          onChange={handleVialTextAreaChange}
          placeholder="vial.json"
        ></textarea>
      </div>
      <div className="grid-row-2">
        <button onClick={handleAppendBmpCustomKeycodesClick}>
          Append BMP custom keycodes
        </button>
        <button onClick={handleDownloadVialJsonClick}>
          Download vial.json
        </button>
      </div>
      <div className="grid-row">
        <textarea
          value={configJson}
          onChange={handleConfigTextAreaChange}
          placeholder="config.json"
        ></textarea>
      </div>
      <div className="grid-row-2">
        <select value={configType} onChange={handleSelectConfigChange}>
          <option value="">選択してください</option>
          {Object.keys(configTypeList).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button onClick={handleDownloadConfigJsonClick}>
          Download config.json
        </button>
        <button onClick={handleDownloadClick}>Download BIN</button>
      </div>
    </div>
  );
}

export default App;
