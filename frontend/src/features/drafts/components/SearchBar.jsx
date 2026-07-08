import { useEffect, useRef, useState } from 'react';
import './SearchBar.css';

function SearchBar({ value = '', onSearch, placeholder = 'Search drafts...' }) {
  const [term, setTerm] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    setTerm(value);
  }, [value]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function handleChange(e) {
    const next = e.target.value;
    setTerm(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(next), 300);
  }

  return (
    <div className="search-bar-wrap">
      <span className="search-bar__icon" aria-hidden="true" />
      <input
        type="text"
        className="search-bar"
        value={term}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search drafts"
      />
    </div>
  );
}

export default SearchBar;
