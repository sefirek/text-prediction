import axios from 'axios';
import { useEffect, useState } from 'react';
import { getHost, setHost } from '../webWorker/config.mjs';
import './networkSelect.css';

setHost(window.location.origin);

export default function NetworkSelect({ onSelect = () => {} }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [networkList, setNetworkList] = useState([]);
  const onChangeItem = (event) => {
    const networkFileName = event.target.value;
    setSelectedItem(networkFileName);
    if (networkList.includes(networkFileName)) {
      axios.get(getHost() + '/network/' + networkFileName).then((res) => {
        if (typeof onSelect === 'function') {
          onSelect(res.data);
        }
      });
    }
  };
  useEffect(() => {
    axios.get(getHost() + '/network/list').then((res) => {
      setNetworkList(res.data);
    });
  }, []);
  return (
    <div className='select-editable'>
      <datalist onChange={onChangeItem} id='network-list'>
        <option value=''></option>
        {networkList.map((fileName, id) => (
          <option key={id} value={fileName}>
            {fileName}
          </option>
        ))}
      </datalist>
      <input
        type='text'
        name='format'
        value={selectedItem}
        onChange={onChangeItem}
        list='network-list'
      />
    </div>
  );
}
