import "../../src/input.css";
import Sok from "./ap.js";
import { useEffect, useState, useRef } from "react";
import beep from "./pcr_notify.wav";

function App() {
  const { data, sio, exchanges, symbolList, trigger_list } = Sok();
  const [toggle, settoggle] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSymbol, setIsOpenSymbol] = useState(false);
  const [selectedExchanage, setselectedExchanage] = useState([]);
  const [selectedSymbols, setselectedSymbols] = useState([]);
  const dataRef = useRef(data);
  const [screenChange, setScreenChange] = useState(false);
  const [webView, setWebView] = useState(
    window.innerWidth > 981 ? true : false
  );
  const [mute_trigger_list, setmute_trigger_list] = useState([]);
  const mute_trigger_listRef = useRef(mute_trigger_list);
  const [cought, setcought] = useState("");
  const audioElementRef = useRef(new Audio(beep));

  useEffect(() => {
    const setData = () => {
      setScreenChange(!screenChange);
      if (window.innerWidth < 981) {
        setWebView(false);
      } else {
        setWebView(true);
      }
    };

    window.addEventListener("resize", setData);
    return () => {
      window.removeEventListener("resize", setData);
    };
  }, [webView, screenChange]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    // console.log("list change", mute_trigger_list);
    mute_trigger_listRef.current = mute_trigger_list;
  }, [mute_trigger_list]);

  useEffect(() => {
    console.log("in noti effect");

    let isNotificationNeeded = false;

    const Notification = () => {
      audioElementRef.current.loop = true;
      audioElementRef.current.play();
      console.log(dataRef.current.trigger_list);
      if (
        dataRef.current.trigger_list &&
        dataRef.current.trigger_list.length >
          mute_trigger_listRef.current.length
      ) {
        isNotificationNeeded = true;
      } else if (
        (dataRef.current.trigger_list &&
          dataRef.current.trigger_list.length <
            mute_trigger_listRef.current.length) ||
        (dataRef.current.trigger_list &&
          dataRef.current.trigger_list.length ===
            mute_trigger_listRef.current.length)
      ) {
        audioElementRef.current.muted = true;
        isNotificationNeeded = false;
      }
      playNotification();
    };

    const playNotification = () => {
      if (isNotificationNeeded) {
        audioElementRef.current.muted = false;
      } else if (!isNotificationNeeded) {
        audioElementRef.current.muted = true;
      }
    };

    const intervalId = setInterval(Notification, 1000);
  }, []);

  const handleOptionChange = (event) => {
    const current_option = event.target.name;
    if (selectedSymbols.includes(current_option)) {
      setselectedSymbols(
        selectedSymbols.filter((items) => items !== current_option)
      );
      sio.emit("selectedSymbolList", selectedSymbols);
    } else {
      setselectedSymbols((prvstate) => {
        sio.emit("selectedSymbolList", [...prvstate, current_option]);
        return [...prvstate, current_option];
      });
    }
  };

  const onTextsymbol = (symbol) => {
    if (!selectedSymbols.includes(symbol)) {
      setselectedSymbols((prevSymbols) => [...prevSymbols, symbol]);
    }
  };

  useEffect(() => {
    sio.on("text_symbol", onTextsymbol);
    return () => {
      sio.removeListener("text_symbol", onTextsymbol);
    };
  }, []);

  useEffect(() => {
    Object.entries(data).forEach(([k]) => {
      settoggle((prvstate) => {
        const toggle = { ...prvstate };
        toggle[k] = false;
        return toggle;
      });
    });
  }, []);

  const handleChange = (event) => {
    const toggleName = event.target.name;

    settoggle((prvstate) => {
      const updatetoggle = { ...prvstate };
      updatetoggle[toggleName] = !updatetoggle[toggleName];
      return updatetoggle;
    });
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sio.emit("clientMessage", inputValue);
    setInputValue("");
  };

  const selectedExchange = (event) => {
    const exchange_data_index = event.target.name;
    sio.emit("readyToConnect", exchange_data_index);
    setIsOpen(false);
    setselectedExchanage(exchanges[exchange_data_index]);
  };

  const delSymbol = (event) => {
    const symbol = event.target.name;
    const new_symbol = symbol.split("/")[0];
    setselectedSymbols(selectedSymbols.filter((items) => items !== new_symbol));
    sio.emit("delsymbol", [symbol]);
  };

  const symbolPair = (event) => {
    const pair = event.target.name;
    sio.emit("symbolPair", pair);
  };

  const handleVolumeChange = (event, symbol) => {
    const clone_mute_trigger_list = mute_trigger_list;

    if (!event.target.checked && !mute_trigger_list.includes(symbol)) {
      setmute_trigger_list((prvstate) => {
        const updatedList = [...prvstate, symbol];
        return updatedList;
      });
    } else if (event.target.checked && mute_trigger_list.includes(symbol)) {
      setmute_trigger_list((prevState) => {
        const updatedList = prevState.filter((existing) => existing !== symbol);

        return updatedList;
      });
    }
  };

  return (
    <div>
      <div className="container-fluid pt-2">
        <div className="row flex justify-self-center justify-between">
          <div className="col">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2">
                <div className="pl-3">
                  <input
                    type="text"
                    value={inputValue}
                    placeholder="Type here"
                    onChange={handleInputChange}
                    className="input input-bordered lg:input-sm  w-full max-w-xs"
                  />
                </div>
                <div className="pl-3">
                  <button type="submit" className="btn lg:btn-sm ">
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
          {symbolList.length !== 0 && (
            <div className="dropdown dropdown-end sy-scroll">
              <div>
                <label
                  tabIndex={0}
                  className="m-1"
                  onClick={() => setIsOpenSymbol(!isOpenSymbol)}
                >
                  <span className="btn lg:btn-sm ">Select Symbol</span>
                </label>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 sy-scroll overflow-y-scroll"
              >
                {isOpenSymbol &&
                  symbolList.map((symbol, index) => {
                    return (
                      <li key={symbol}>
                        <div className="mr-1 ">
                          <button
                            className={
                              selectedSymbols.length > 0 &&
                              selectedSymbols.includes(symbol) &&
                              "btn btn-active btn-accent btn-sm "
                            }
                            onClick={handleOptionChange}
                            name={symbol}
                          >
                            {symbol}
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
          <div className="sy-scroll">
            {selectedSymbols.length !== 0 &&
              selectedSymbols.map((symbol) => {
                return <div className="badge badge-accent">{symbol}</div>;
              })}
          </div>
          {exchanges && (
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn m-1 lg:btn-sm"
                onClick={() => setIsOpen(!isOpen)}
              >
                {selectedExchanage.length !== 0
                  ? selectedExchanage
                  : "Select Exchange"}
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                {isOpen &&
                  exchanges.map((exchange_pair, index) => {
                    return (
                      <li key={index}>
                        <button onClick={selectedExchange} name={index}>
                          {exchange_pair}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
          {webView && (
            <div className="grid grid-cols-2">
              <div>
                <button className="btn btn-sm" onClick={symbolPair} name="BTC">
                  BTC
                </button>
              </div>
              <div>
                <button className="btn btn-sm" onClick={symbolPair} name="USDT">
                  USDT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-5 mt-5 pl-5">
        {Object.keys(dataRef["current"]["orderbooks"]).length > 0 && (
          <div className="grid grid-cols-5 pb-5 font-bold text-xl">
            <div>Symbol</div>
            <div>Percentage</div>
            {Object.entries(dataRef["current"]["orderbooks"]).map(
              ([exchange_name]) => {
                return <div>{exchange_name}</div>;
              }
            )}
          </div>
        )}

        {dataRef["current"]["current_symbol_list"] &&
          dataRef["current"]["current_symbol_list"].map((k, index) => {
            const data_access = dataRef.current.symbol_json_data[k];
            let isSymbolPresent = false;

            for (const exchange in dataRef.current.orderbooks) {
              if (k in dataRef.current.orderbooks[exchange]) {
                if (data_access) {
                  isSymbolPresent = true;
                }
                break;
              }
            }

            return (
              isSymbolPresent && (
                <div
                  className="grid grid-cols-5 pt-3 pb-3  "
                  key={`sy_so${index}`}
                >
                  <div className="flex items-center">
                    <div
                      key={`sym_${index}`}
                      className="align-middle flex items-center"
                    >
                      {k}
                    </div>
                    <label className="swap ml-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        onChange={(event) => handleVolumeChange(event, k)}
                      />

                      {/* volume on icon */}
                      <svg
                        className="swap-on fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
                      </svg>

                      {/* volume off icon */}
                      <svg
                        className="swap-off fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3,9H7L12,4V20L7,15H3V9M16.59,12L14,9.41L15.41,8L18,10.59L20.59,8L22,9.41L19.41,12L22,14.59L20.59,16L18,13.41L15.41,16L14,14.59L16.59,12Z" />
                      </svg>
                    </label>
                  </div>

                  <div
                    key={`per_${index}`}
                    className={`align-middle flex items-center ${
                      data_access["trigger"] && "text-green-600 text-lg"
                    }`}
                  >
                    {data_access["per"]}
                  </div>
                  {Object.entries(dataRef["current"]["orderbooks"]).map(
                    ([exchange, exchange_data]) => {
                      // console.log(k);
                      return dataRef.current.orderbooks[
                        exchange
                      ].hasOwnProperty(k) ? (
                        <div className="grid grid-cols-2">
                          <div>
                            <div
                              className={`pb-3 align-middle flex items-center ${
                                exchange === data_access["buy_exchange"] &&
                                "text-green-600 text-lg"
                              }`}
                              key={`buy_${index}`}
                            >
                              {
                                dataRef["current"]["orderbooks"][exchange][k][
                                  "data"
                                ]["buy"]
                              }
                            </div>
                            <div
                              className={`align-middle flex items-center  ${
                                exchange === data_access["sell_exchange"] &&
                                "text-red-600 text-lg"
                              }`}
                              key={`sell_${index}`}
                            >
                              {
                                dataRef["current"]["orderbooks"][exchange][k][
                                  "data"
                                ]["sell"]
                              }
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">NOT LISTED</div>
                      );
                    }
                  )}
                </div>
              )
            );
          })}
      </div>
    </div>
  );
}

export default App;
