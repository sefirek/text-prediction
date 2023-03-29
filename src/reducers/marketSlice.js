import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import fetchMarketData from './fetchMarketData';

const initialState = {
  markets: [],
};

const loadMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async ({ market, tickInterval }, thunkAPI) => {
    const data = await fetchMarketData(market, tickInterval);
    return data;
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadMarketData.pending, (state, action) => {
        const { market, tickInterval } = action.meta.arg;
        console.log('pending', action);
        state.markets.push({
          market,
          tickInterval,
          data: action.payload,
          state: 'pending',
        });
      })
      .addCase(loadMarketData.fulfilled, (state, action) => {
        console.log('fulfilled', action);
        const { market, tickInterval } = action.meta.arg;
        Object.assign(
          state.markets.find(
            (data) =>
              data.market === market && data.tickInterval === tickInterval
          ),
          { market, tickInterval, data: action.payload, state: 'fulfilled' }
        );
      });
  },
});

function marketDataSelector(state) {
  return state.market.markets;
}

function marketDownloadingStatusSelector(state) {
  return state.market.markets.find(({ state }) => state === 'pending')
    ? 'pending'
    : 'fulfilled';
}

export { loadMarketData };
export const selectors = {
  marketDataSelector,
  marketDownloadingStatusSelector,
};
export default marketSlice.reducer;
