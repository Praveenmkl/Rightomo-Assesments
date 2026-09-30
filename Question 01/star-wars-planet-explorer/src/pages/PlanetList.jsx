import React, { useState, useEffect } from 'react'
import { getPlanets } from "../services/planetApi.js";
import PlanetCard from "../components/PlanetCard";
import SearchBar from '../components/SearchBar.jsx';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Pagination from '../components/Pagination.jsx';
import "../styles/planet-list.css";

function PlanetList() {
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sortOrder, setSortOrder] = useState("default");

  useEffect(() => {
    const fetchPlanets = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPlanets(page, search);

        setPlanets(data.results || []);
        // SWAPI returns total count (10 items per page)
        const total = data.count ? Math.ceil(data.count / 10) : 1;
        setTotalPages(total);
      } catch (err) {
        setError("Failed to load planets.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanets();
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const sortedPlanets = [...planets].sort((a, b) => {
    const diameterA = Number(a.diameter) || 0;
    const diameterB = Number(b.diameter) || 0;

    if (sortOrder == "asc") {
      return diameterA - diameterB;
    }

    if (sortOrder == "desc") {
      return diameterB - diameterA;
    }

    return 0;
  });

  return (
    <div className="page-container">
      <header className="hero-section">
        <p className="hero-label">EXPLORE THE GALAXY</p>
        <h1>Star Wars <p className="hero-planet-name">Planet</p> Explorer</h1>
        <p className="hero-description">
          Browse, search, and inspect planets across the Star Wars universe.
        </p>
      </header>

      <div className="controls-bar">
        <SearchBar search={search} onSearchChange={handleSearchChange} />

        <select
          className="sort-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="default">Sort by Diameter</option>
          <option value="asc">Smallest First</option>
          <option value="desc">Largest First</option>
        </select>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && sortedPlanets.length === 0 && (
        <div className="empty-state">
          <p>No planets match your search criteria.</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="planet-grid">
            {sortedPlanets.map((planet) => (
              <PlanetCard key={planet.url} planet={planet} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}

export default PlanetList 


