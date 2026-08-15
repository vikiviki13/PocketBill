import { Icon } from '../components';

export default function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search-input">
      <span className="ico"><Icon name="search" size={17} /></span>
      <input className="input" type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoFocus />
    </div>
  );
}
