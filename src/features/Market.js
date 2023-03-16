import axios from 'axios';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadMarketData, selectors } from '../reducers/marketSlice.js';
import { getHost } from '../webWorker/config.mjs';
import './market.css';
import MarketDataList from './MarketDataList.js';

export default function Market() {
  const [marketName, setMarketName] = useState('');
  const [bgColor, setBgColor] = useState('white');
  const marketDataSelector = useSelector(selectors.marketDataSelector);

  const dispatch = useDispatch();

  const checkMarket = () => {
    axios
      .get(getHost() + '/isMarketExists', { params: { market: marketName } })
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
          market === marketName && tickInterval === '1h'
      )
    ) {
      dispatch(loadMarketData({ market: marketName, tickInterval: '1h' }));
    }
  };
  return (
    <div>
      <label htmlFor='market-name'>Podaj nazwę pary i zatwierdź:</label>
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
        }}
        onKeyDown={(key) => {
          console.log({ key });
          if (key.code === 'Enter') {
            checkMarket();
          }
        }}
        value={marketName}
        style={{ backgroundColor: bgColor }}
      />
      <button onClick={onClickLoadMarketData} disabled={!(bgColor === 'green')}>
        Pobierz dane
      </button>
      <MarketDataList></MarketDataList>
    </div>
  );
}
