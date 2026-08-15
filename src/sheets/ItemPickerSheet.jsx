import { useState } from 'react';
import { DB } from '../db';
import { money } from '../utils';
import SearchBox from './SearchBox';

export default function ItemPickerSheet({ onPick, onCreate }) {
  const [query, setQuery] = useState('');
  const items = DB.getItems().filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <SearchBox value={query} onChange={setQuery} placeholder="Search item / service..." />
      <button className="create-row-btn" type="button" onClick={onCreate}>
        <span className="plus-circle">+</span><span className="label">Create New Item / Service</span>
      </button>
      {items.length ? items.map((item) => (
        <button className="select-row" type="button" key={item.id} onClick={() => onPick(item.id)}>
          <span className="r-main">
            <span className="r-title">{item.name} <span className="pill mini-pill">{item.tax}%</span></span>
            <span className="r-sub">{item.type === 'service' ? 'Service' : 'Item'} · {money(item.price)}</span>
          </span>
          <span className="r-price">Add</span>
        </button>
      )) : <div className="hint centered-empty">No items or services yet.</div>}
      <div className="info-note">Rate and tax are filled automatically. You can edit quantity, rate, and tax after adding.</div>
    </>
  );
}
