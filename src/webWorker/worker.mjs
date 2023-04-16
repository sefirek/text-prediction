import run, {
  createLstmDataSet,
  createNewLstmNetwork,
  loadLstmNetworkFromJson,
  setHiddenLayerSize,
  setInputLayerSize,
} from './MarketPricePredictionTest.mjs';
import { Actions, Statuses } from '../Workers.js';
import { setHost } from './config.mjs';
const logFunction = (...args) =>
  postMessage({ action: Actions.LOG, value: args });
Object.assign(globalThis, { logFunction });

onmessage = function (event) {
  try {
    // logFunction('aaabbb');
    const { action, value, requestId } = event.data;
    logFunction({ action, requestId });
    switch (action) {
      case Actions.INITIALIZE: {
        setHost(value.host);
        postMessage({
          action,
          value: { status: Statuses.OK },
          requestId,
        });
        break;
      }
      case Actions.RUN: {
        logFunction('jest');
        run(event.data);
        break;
      }
      case Actions.CREATE_LSTM_DATA_SET: {
        createLstmDataSet(event.data);
        break;
      }
      case Actions.CREATE_NEW_LSTM_NETWORK: {
        createNewLstmNetwork(event.data);
        break;
      }
      case Actions.LOAD_LSTM_NETWORK_FROM_JSON: {
        loadLstmNetworkFromJson(event.data);
        break;
      }
      case Actions.SET_INPUT_LAYER_SIZE: {
        setInputLayerSize(event.data);
        break;
      }
      case Actions.SET_HIDDEN_LAYER_SIZE: {
        setHiddenLayerSize(event.data);
        break;
      }
      default: {
        logFunction('Unknown action');
      }
    }
    // postMessage('aaa');
  } catch (e) {
    postMessage({ error: e.message });
  }
};
