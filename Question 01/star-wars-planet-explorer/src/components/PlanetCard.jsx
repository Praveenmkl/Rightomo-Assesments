import { Link } from "react-router-dom";
import "../styles/planet-card.css";

function PlanetCard({ planet }) {
  const planetId = planet.url.split("/").filter(Boolean).pop();

  const diameter = Number(planet.diameter) || 0;
  const size = Math.min(
    Math.max(diameter / 100, 60),
    180
  );

  return (
    <Link to={`/planet/${planetId}`} className="planet-card">
      <div className="planet-circle-container">
        <div
          className="planet-circle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        ></div>
      </div>

      <div className="planet-card-header">
        <h2>{planet.name}</h2>
        <span className="planet-number">#{planetId}</span>
      </div>

      <div className="planet-info">
        <div className="info-item">
          <span>Diameter</span>
          <strong>{planet.diameter}</strong>
        </div>

        <div className="info-item">
          <span>Terrain</span>
          <strong>{planet.terrain}</strong>
        </div>

        <div className="info-item">
          <span>Population</span>
          <strong>{planet.population}</strong>
        </div>
      </div>

      <span className="details-link">
        View Details →
      </span>
    </Link>
  );
}

export default PlanetCard;