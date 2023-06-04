import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectors, addFavourite,deleteFavourite } from '../reducers/marketSlice';
import './marketDataList.css';

export default function MarketDataList({ selectMarket = () => {} , interactive=false}) {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const favouritesSelector = useSelector(selectors.favouritesSelector);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const dispatch = useDispatch();

  const changeFavouriteChecked = (event, market)=>{
    if(event.target.checked){
      return dispatch(addFavourite({market}))
    }
    return dispatch(deleteFavourite({market}));
  }

  return (
    <div className='div-table'>
      <div className='div-table-row'>
        <div className='div-table-col'>
          <span>Market</span>
        </div>
        <div className='div-table-col'>
          <span>Interwał</span>
        </div>
        {interactive?<>
          <div className='div-table-col'>
          <span>Ulubione</span>
        </div>
        </>:''}
      </div>
      {marketDataSelector.map(({ market, tickInterval }, id) => (
        <div
          key={market}
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
          {interactive?<>
            {/* <div className='div-table-col'>{favouritesSelector.includes(market)?'a':'b'}</div> */}
            <div className='div-table-col'>
              <input type='checkbox' checked={favouritesSelector.includes(market)} onChange={(event)=>changeFavouriteChecked(event, market)}/>
            </div>
          </>:''}
        </div>
      ))}
    </div>
  );
}
