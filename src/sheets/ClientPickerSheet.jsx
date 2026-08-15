import { useState } from 'react';
import { DB } from '../db';
import SearchBox from './SearchBox';

export default function ClientPickerSheet({ selectedId, onPick, onCreate }) {
  const [query, setQuery] = useState('');
  const clients = DB.getClients().filter((client) => client.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <SearchBox value={query} onChange={setQuery} placeholder="Search client..." />
      <button className="create-row-btn" type="button" onClick={onCreate}>
        <span className="plus-circle">+</span><span className="label">Create New Client</span>
      </button>
      {clients.length ? clients.map((client) => (
        <button className="select-row" type="button" key={client.id} onClick={() => onPick(client.id)}>
          <span className="r-main"><span className="r-title">{client.name}</span><span className="r-sub">{[client.city, client.country].filter(Boolean).join(', ')}</span></span>
          <span className={`radio ${selectedId === client.id ? 'checked' : ''}`} />
        </button>
      )) : <div className="hint centered-empty">No clients found.</div>}
    </>
  );
}
