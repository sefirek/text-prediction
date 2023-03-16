import { useSelector } from 'react-redux';
import { selectors } from '../reducers/marketSlice';

export default function MarketDataList() {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  return (
    <div className='div-table'>
      {marketDataSelector.map(({ market, tickInterval }, id) => (
        <div key={id} className='div-table-row'>
          <div className='div-table-col'>{market}</div>
          <div className='div-table-col'>{tickInterval}</div>
        </div>
      ))}
    </div>
  );
}
