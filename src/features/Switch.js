import './switch.css';

export default function Switch({ title, onChange = (boolState) => {} }) {
  return (
    <div>
      <span style={{ marginRight: '1rem' }}>{title}</span>
      <label className='switch'>
        <input
          type='checkbox'
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className='slider round'></span>
      </label>
    </div>
  );
}
