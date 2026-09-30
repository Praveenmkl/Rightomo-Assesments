import axios from "axios";

const API_URL = "https://swapi.dev/api/planets";

export const getPlanets = async (page = 1, search = "") => {
  const response = await axios.get(API_URL, {
    params: {
      page,
      search,
    },
  });

  return response.data;
};

export const getPlanetById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};
