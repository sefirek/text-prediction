function Workers() {
  this.workers = [];

  this.getNextId = () => {
    return (
      this.workers.reduce((max, worker) => {
        return Math.max(max, worker.id);
      }, -1) + 1
    );
  };

  this.createWorker = (workerId, isHidden = false) => {
    if (this.workers[workerId]) return false;
    const worker = new Worker('worker.bundle.js');
    const workerState = {
      id: workerId,
      actions: [],
      worker,
      callbacks: {},
      requestId: 0,
      state: 'stop',
      isInit: false,
      testResult: [],
      isHidden,
      trainingProgress: '',
    };
    this.workers.push(workerState);
    worker.onmessage = ({ data }) => {
      const { action, requestId, value } = data;
      const { callbacks } = workerState;
      if (callbacks[requestId]) {
        if (value.status === Statuses.OK) {
          callbacks[requestId].resolve(data);
        } else {
          callbacks[requestId].reject(data);
        }

        delete callbacks[requestId];
        return;
      }
      switch (action) {
        case Actions.TRAINING_PROGRESS: {
          workerState.trainingProgress = value;
          break;
        }
        case Actions.LOG: {
        }
        default: {
          workerState.actions.push(data);
        }
      }
    };
    this.initializeWorker(workerId)
      .then((data) => console.log('worker', workerId, 'initialized'))
      .catch((data) => console.log('worker', workerId, 'error', data));
    return true;
  };
  this.getWorker = (workerId) => {
    return this.workers.find(({ id }) => id === workerId);
  };
  this.run = (workerId) => {
    const worker = this.getWorker(workerId);
    if (worker.state === 'stop') {
      worker.state = 'start';
      return this.sendRequest(workerId, {
        action: Actions.RUN,
        value: {},
      }).then((data) => {
        if (data.value.status === Statuses.OK) {
          worker.state = 'stop';
          return data;
        }
      });
    }
  };
  this.test = (workerId) => {
    return this.sendRequest(workerId, {
      action: Actions.TEST,
      value: {},
    }).then((data) => {
      this.getWorker(workerId).testResult = data.value.testResult;
      return data.value.testResult;
    });
  };
  this.initializeWorker = (workerId) => {
    const worker = this.getWorker(workerId);
    if (worker.isInit === false) {
      worker.isInit = true;
      return this.sendRequest(workerId, {
        action: Actions.INITIALIZE,
        value: { host: window.location.origin },
      });
    }
    return Promise.resolve({
      action: Actions.INITIALIZE,
      value: { status: Statuses.OK },
    });
  };
  this.createLstmDataSet = (workerId, { marketData } = {}) => {
    console.log(marketData);
    return this.sendRequest(workerId, {
      action: Actions.CREATE_LSTM_DATA_SET,
      value: { marketData },
    });
  };
  this.getLogs = (workerId) => {
    const logs = [...(this.getWorker(workerId)?.actions || [])];
    return logs;
  };
  this.getTrainingProgress = (workerId) => {
    return this.getWorker(workerId)?.trainingProgress;
  };
  this.sendRequest = (workerId, { action, value }) => {
    const worker = this.getWorker(workerId);
    return new Promise((resolve, reject) => {
      worker.callbacks[worker.requestId] = { resolve, reject };
      worker.worker.postMessage({ action, value, requestId: worker.requestId });
      worker.requestId += 1;
    });
  };
  this.createNewLstmNetwork = (
    workerId,

    { inputSize = 11, hiddenLayerSize = 11, outputSize = 11 }
  ) => {
    return this.sendRequest(workerId, {
      action: Actions.CREATE_NEW_LSTM_NETWORK,
      value: { inputSize, hiddenLayerSize, outputSize },
    });
  };
  this.loadLstmNetworkFromJson = (workerId, networkJson) => {
    return this.sendRequest(workerId, {
      action: Actions.LOAD_LSTM_NETWORK_FROM_JSON,
      value: networkJson,
    });
  };
  this.setInputSize = (workerId, inputSize) => {
    return this.sendRequest(workerId, {
      action: Actions.SET_INPUT_LAYER_SIZE,
      value: inputSize,
    });
  };
  this.setHiddenSize = (workerId, hiddenSize) => {
    return this.sendRequest(workerId, {
      action: Actions.SET_HIDDEN_LAYER_SIZE,
      value: hiddenSize,
    });
  };
  this.terminateWorker = (workerId) => {
    const worker = this.getWorker(workerId);
    worker.worker.terminate();
    this.workers.splice(
      this.workers.findIndex((w) => w === worker),
      1
    );
  };
}

export const Actions = {
  LOG: 0,
  CREATE_LSTM_DATA_SET: 1,
  RUN: 2,
  INITIALIZE: 3,
  CREATE_NEW_LSTM_NETWORK: 4,
  LOAD_LSTM_NETWORK_FROM_JSON: 5,
  SET_INPUT_LAYER_SIZE: 6,
  SET_HIDDEN_LAYER_SIZE: 7,
  TEST: 8,
  TRAINING_PROGRESS: 9,
};

export function getActionName(actionId) {
  return Object.keys(Actions).find((key) => Actions[key] === actionId);
}

export const Statuses = {
  ERROR: 'error',
  OK: 'ok',
};

export default new Workers();
