import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { ungzip } from "pako";

// const sio = io("https://arbi-jay.crayon92.com", {
//   transports: ["websocket"],
// });

const sio = io("https://arbi.deltaswap.in.net:8443", {
  transports: ["websocket"],
});

sio.on("connect", () => {
  console.log("connected");
});

function Sok() {
  const [data, setdata] = useState({ orderbooks: {}, symbol_json_data: {} });
  const [exchanges, setexchanges] = useState([]);
  const [symbolList, setsymbolList] = useState([]);

  const onResult = (result) => {
    const decompressedData = ungzip(result, { to: "string" });
    const jsonData = JSON.parse(decompressedData);

    setdata((prevState) => {
      const updatedDict = { ...prevState };

      jsonData["symbol_json_data"] &&
        Object.entries(jsonData["symbol_json_data"]).forEach(([k, v]) => {
          updatedDict["symbol_json_data"][k] = {
            per: v["per"],
            buy_exchange: v["buy_exchange"],
            sell_exchange: v["sell_exchange"],
            trigger: v["trigger"],
          };
        });
      updatedDict["orderbooks"] = jsonData["orderbooks"];
      updatedDict["trigger_list"] = jsonData["trigger_list"];
      updatedDict["current_symbol_list"] = jsonData["current_symbol_list"];

      Object.entries(updatedDict["symbol_json_data"]).forEach(([key]) => {
        if (!jsonData["current_symbol_list"].includes(key)) {
          delete updatedDict["symbol_json_data"][key];
        }
      });

      return updatedDict;
    });
  };

  const onExchangedata = (data) => {
    setexchanges(data);
  };

  const onDelsymbol = (symbol) => {
    symbol.forEach((item) => {
      delete data[item];
    });
    setdata({ ...data });
  };

  const onSymbollist = (symbol_list) => {
    setsymbolList(symbol_list);
  };

  useEffect(() => {
    sio.on("symbol_list", onSymbollist);
    return () => {
      sio.removeListener("symbol_list", onSymbollist);
    };
  }, []);

  useEffect(() => {
    sio.on("delsymbol", onDelsymbol);
    return () => {
      sio.removeListener("delsymbol", onDelsymbol);
    };
  });

  useEffect(() => {
    sio.on("exchange_data", onExchangedata);
    return () => {
      sio.removeListener("exchange_data", onExchangedata);
    };
  }, [exchanges]);

  useEffect(() => {
    sio.on("result", onResult);
    return () => {
      sio.removeListener("result", onResult);
    };
  }, [data]);

  return { data, sio, exchanges, symbolList };
}

export default Sok;
