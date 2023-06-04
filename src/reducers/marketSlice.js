import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import fetchMarketData from './fetchMarketData';
import RESTFavourite from './RESTFavourite';

const initialState = {
  markets: [],
  favourites:[]
};

const loadMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async ({ market, tickInterval }, thunkAPI) => {
    const data = await fetchMarketData(market, tickInterval);
    return data;
  }
);

const addFavourite = createAsyncThunk(
  'market/addFavourite',
  async ({ market }, thunkAPI) => {
    return RESTFavourite.addFavourite(market);
  }
);

const deleteFavourite = createAsyncThunk(
  'market/deleteFavourite',
  async ({ market }, thunkAPI) => {
    return RESTFavourite.deleteFavourite(market);
  }
);

const getFavourites = createAsyncThunk(
  'market/getFavourites',
  async ()=>{
    const data = await RESTFavourite.getFavourites();
    return data;
  }
)

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadMarketData.pending, (state, action) => {
        const { market, tickInterval } = action.meta.arg;
        state.markets.push({
          market,
          tickInterval,
          data: action.payload,
          state: 'pending',
        });
      })
      .addCase(loadMarketData.fulfilled, (state, action) => {
        const { market, tickInterval } = action.meta.arg;
        Object.assign(
          state.markets.find(
            (data) =>
              data.market === market && data.tickInterval === tickInterval
          ),
          { market, tickInterval, data: action.payload, state: 'fulfilled' }
        );
      })
      .addCase(getFavourites.fulfilled, (state, action)=>{
        state.favourites = action.payload;
      })
      .addCase(addFavourite.fulfilled, (state, action)=>{
        state.favourites = action.payload;
      })
      .addCase(deleteFavourite.fulfilled, (state, action)=>{
        state.favourites = action.payload;
      })
  },
});

function marketDataSelector(state) {
  return state.market.markets;
}

function favouritesSelector(state) {
  return state.market.favourites;
}

function marketDownloadingStatusSelector(state) {
  return state.market.markets.find(({ state }) => state === 'pending')
    ? 'pending'
    : 'fulfilled';
}

export { loadMarketData, getFavourites, addFavourite, deleteFavourite };
export const selectors = {
  marketDataSelector,
  marketDownloadingStatusSelector,
  favouritesSelector
};
export default marketSlice.reducer;
