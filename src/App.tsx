import { ChangeEvent, useEffect, useState } from "react";
import convertInfoJsonToConfigJson from "./convertToConfigJson";
import { convertToVialJson } from "./convertToVialJson";
import init, { xz_compress } from "./pkg";
import "./App.css";
import { convertToBmpVialBin } from "./convertToBmpVialBin";

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
  const [configTypeList, setConfigTypeList] = useState({});

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
        setConfigJson(JSON.stringify(configTypeList[configType]));
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
    setVialJson(JSON.stringify(vial));
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

  const handleDownloadClick = () => {
    // console.log(vialJson);
    const vialData = xz_compress(vialJson.slice());
    console.log(vialData);
    const bmpVialBin = convertToBmpVialBin(
      vialData,
      JSON.parse(configJson).config
    );
    console.log(bmpVialBin);

    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([bmpVialBin.$arrayBuffer]));
    link.setAttribute("href", url);
    link.setAttribute("download", "test.bin");
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
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
      <textarea
        rows={10}
        cols={40}
        value={infoJson}
        onChange={handleInfoTextAreaChange}
      ></textarea>
      <button onClick={handleGenerateClick}>Generate</button>
      <select value={configType} onChange={handleSelectConfigChange}>
        <option value="">選択してください</option>
        {Object.keys(configTypeList).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <textarea
        rows={10}
        cols={40}
        value={configJson}
        onChange={handleConfigTextAreaChange}
      ></textarea>
      <textarea
        rows={10}
        cols={40}
        value={vialJson}
        onChange={handleVialTextAreaChange}
      ></textarea>
      <button onClick={handleDownloadClick}>Download</button>
    </>
  );
}

export default App;
