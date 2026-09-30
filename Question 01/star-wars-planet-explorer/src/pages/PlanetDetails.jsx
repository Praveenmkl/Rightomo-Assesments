import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlanetById } from "../services/planetApi";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import "../styles/planet-details.css";

function PlanetDetails() {
  const { id } = useParams();

  const [planet, setPlanet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlanet = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPlanetById(id);
        setPlanet(data);
      } catch (err) {
        setError("Failed to load planet details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanet();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="planet-details-container">
        <Link to="/" className="back-link">← Back to Planets</Link>
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (!planet) {
    return (
      <div className="planet-details-container">
        <Link to="/" className="back-link">← Back to Planets</Link>
        <p>No planet information found.</p>
      </div>
    );
  }

  const formatNumber = (val) => {
    if (!val || val === "unknown") return "Unknown";
    const num = Number(val);
    return isNaN(num) ? val : num.toLocaleString();
  };

  const diameter = Number(planet.diameter) || 0;
  const size = Math.min(
    Math.max(diameter / 100, 60),
    160
  );

  return (
    <div className="planet-details-container">
      <Link to="/" className="back-link">
        ← Back to Planets
      </Link>

      <div className="planet-details-card">
        <div className="planet-details-header">
          <div className="planet-title-group">
            <h1>{planet.name}</h1>
            <span className="planet-id-tag">Planet #{id}</span>
          </div>
          <span className="planet-badge">{planet.climate}</span>
        </div>

        <div className="planet-details-visual">
          <div
            className="planet-details-circle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        </div>

        <div className="planet-details-grid">
          <div className="detail-item">
            <span className="detail-label">Diameter</span>
            <span className="detail-value">{formatNumber(planet.diameter)} km</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Terrain</span>
            <span className="detail-value">{planet.terrain}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Climate</span>
            <span className="detail-value">{planet.climate}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Population</span>
            <span className="detail-value">{formatNumber(planet.population)}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Gravity</span>
            <span className="detail-value">{planet.gravity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanetDetails;