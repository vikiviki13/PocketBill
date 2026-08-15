import { useState } from 'react';
import { DB } from '../db';
import SearchBox from './SearchBox';

export default function CodePickerSheet({ kind, onPick, onCreate }) {
  const [query, setQuery] = useState('');
  const source = kind === 'sac' ? DB.getSAC() : DB.getHSN();
  const codes = source.filter((entry) => (
    entry.code.includes(query)
    || (entry.description || '').toLowerCase().includes(query.toLowerCase())
  ));

  return (
    <>
      <SearchBox value={query} onChange={setQuery} placeholder={`Search ${kind.toUpperCase()} / Description`} />
      <button className="create-row-btn" type="button" onClick={onCreate}>
        <span className="plus-circle">+</span><span className="label">Create New {kind.toUpperCase()}</span>
      </button>
      {codes.length ? codes.map((entry) => (
        <button className="select-row align-start" type="button" key={entry.id} onClick={() => onPick(entry)}>
          <span className="r-main">
            <span className="r-title">{entry.code} <span className="pill mini-pill">{entry.tax}%</span></span>
            <span className="r-sub">{entry.description}</span>
          </span>
        </button>
      )) : <div className="hint centered-empty">No codes found.</div>}
    </>
  );
}
