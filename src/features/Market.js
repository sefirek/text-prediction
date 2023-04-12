import axios from 'axios';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadMarketData, selectors } from '../reducers/marketSlice.js';
import { getHost } from '../webWorker/config.mjs';
import Intervals from './Intervals.js';
// import MarketDataList from './MarketDataList.js';
import SelectInterval from './SelectInterval.js';

export default function Market() {
  const [marketName, setMarketName] = useState('');
  const [marketTickInterval, setMarketTickInterval] = useState(Intervals[0]);
  const [bgColor, setBgColor] = useState('white');
  const marketDataSelector = useSelector(selectors.marketDataSelector);

  const dispatch = useDispatch();

  const checkMarket = (market) => {
    axios
      .get(getHost() + '/isMarketExists', {
        params: { market: market || marketName },
      })
      .then((res) => {
        if (res.data) {
          return setBgColor('green');
        }
        return setBgColor('red');
      });
  };
  const onClickLoadMarketData = () => {
    if (
      !marketDataSelector.find(
        ({ market, tickInterval }) =>
          market === marketName && tickInterval === marketTickInterval
      )
    ) {
      dispatch(
        loadMarketData({ market: marketName, tickInterval: marketTickInterval })
      );
    }
  };
  return (
    <div>
      <label htmlFor='market-name' style={{ marginRight: '1rem' }}>
        Podaj nazwę pary:
      </label>
      <input
        id='market-name'
        name='market-name'
        type='text'
        onChange={(event) => {
          let evSelectionStart = event.target.selectionStart;
          const capitalizedValue = event.target.value.toUpperCase();
          const newValue = capitalizedValue.replace(/[^A-Z]/, '');
          if (newValue !== capitalizedValue) {
            evSelectionStart -= 1;
            setMarketName(newValue);
          } else {
            setMarketName(capitalizedValue);
          }

          setTimeout(() => {
            event.target.setSelectionRange(evSelectionStart, evSelectionStart);
          }, 1);
          setBgColor('white');
          if (capitalizedValue.length >= 6) {
            checkMarket(capitalizedValue);
          }
        }}
        onKeyDown={(key) => {
          console.log({ key });
          if (key.code === 'Enter') {
            checkMarket();
          }
        }}
        value={marketName}
        style={{
          backgroundColor: bgColor,
          width: '5rem',
          marginRight: '0.3rem',
        }}
      />
      {bgColor === 'green' ? (
        <>
          <SelectInterval
            onChangeInterval={setMarketTickInterval}
          ></SelectInterval>
          <button
            onClick={onClickLoadMarketData}
            style={{ marginLeft: '0.3rem' }}
          >
            Pobierz dane
          </button>
        </>
      ) : null}

      {/* <MarketDataList selectMarket={({market, tickInterval})=>{

      }}></MarketDataList> */}
    </div>
  );
}
