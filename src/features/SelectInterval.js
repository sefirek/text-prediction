import Intervals from './Intervals';

export default function SelectInterval({
  disabled,
  onChangeInterval = () => {},
}) {
  return (
    <select onChange={(event) => onChangeInterval(event.target.value)}>
      {Intervals.map((interval, id) => (
        <option key={id}>{interval}</option>
      ))}
    </select>
  );
}
