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
        console.log('pending', action);
      })
      .addCase(loadMarketData.fulfilled, (state, action) => {
        console.log('fulfilled', action);
        const { market, tickInterval } = action.meta.arg;
        state.markets.push({ market, tickInterval, data: action.payload });
      });
  },
});

function marketDataSelector(state) {
  return state.market.markets;
}

export { loadMarketData };
export const selectors = { marketDataSelector };
export default marketSlice.reducer;
