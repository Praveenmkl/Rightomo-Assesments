
import {BrowserRouter, Routes, Route} from "react-router-dom";
import PlanetList from "./pages/PlanetList";
import PlanetDetails from "./pages/PlanetDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlanetList />} />
        <Route path="/planet/:id" element={<PlanetDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;