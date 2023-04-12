import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectors } from '../reducers/marketSlice';
import './marketDataList.css';

export default function MarketDataList({ selectMarket = () => {} }) {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const [selectedMarket, setSelectedMarket] = useState(null);
  return (
    <div className='div-table'>
      <div className='div-table-row'>
        <div className='div-table-col'>
          <span>Market</span>
        </div>
        <div className='div-table-col'>
          <span>Interwał</span>
        </div>
      </div>
      {marketDataSelector.map(({ market, tickInterval }, id) => (
        <div
          key={id}
          className={`div-table-row ${
            selectedMarket === id ? 'market-selected' : ''
          }`}
          onClick={() => {
            selectMarket({ market, tickInterval });
            setSelectedMarket(id);
          }}
        >
          <div className='div-table-col'>{market}</div>
          <div className='div-table-col'>{tickInterval}</div>
        </div>
      ))}
    </div>
  );
}
