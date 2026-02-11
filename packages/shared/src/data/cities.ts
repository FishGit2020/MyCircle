export interface StaticCity {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export const MAJOR_CITIES: StaticCity[] = [
  // ============================================================
  // NORTH AMERICA (~120)
  // ============================================================

  // --- United States ---
  // Alabama
  { name: "Birmingham", country: "US", state: "Alabama", lat: 33.52, lon: -86.81 },
  { name: "Montgomery", country: "US", state: "Alabama", lat: 32.38, lon: -86.30 },
  // Alaska
  { name: "Anchorage", country: "US", state: "Alaska", lat: 61.22, lon: -149.90 },
  { name: "Juneau", country: "US", state: "Alaska", lat: 58.30, lon: -134.42 },
  // Arizona
  { name: "Phoenix", country: "US", state: "Arizona", lat: 33.45, lon: -112.07 },
  { name: "Tucson", country: "US", state: "Arizona", lat: 32.22, lon: -110.97 },
  // Arkansas
  { name: "Little Rock", country: "US", state: "Arkansas", lat: 34.75, lon: -92.29 },
  // California
  { name: "Los Angeles", country: "US", state: "California", lat: 34.05, lon: -118.24 },
  { name: "San Francisco", country: "US", state: "California", lat: 37.77, lon: -122.42 },
  { name: "San Diego", country: "US", state: "California", lat: 32.72, lon: -117.16 },
  { name: "San Jose", country: "US", state: "California", lat: 37.34, lon: -121.89 },
  { name: "Sacramento", country: "US", state: "California", lat: 38.58, lon: -121.49 },
  { name: "Fresno", country: "US", state: "California", lat: 36.74, lon: -119.77 },
  { name: "Long Beach", country: "US", state: "California", lat: 33.77, lon: -118.19 },
  { name: "Oakland", country: "US", state: "California", lat: 37.80, lon: -122.27 },
  { name: "Bakersfield", country: "US", state: "California", lat: 35.37, lon: -119.02 },
  { name: "Anaheim", country: "US", state: "California", lat: 33.84, lon: -117.91 },
  // Colorado
  { name: "Denver", country: "US", state: "Colorado", lat: 39.74, lon: -104.99 },
  { name: "Colorado Springs", country: "US", state: "Colorado", lat: 38.83, lon: -104.82 },
  // Connecticut
  { name: "Hartford", country: "US", state: "Connecticut", lat: 41.76, lon: -72.68 },
  { name: "New Haven", country: "US", state: "Connecticut", lat: 41.31, lon: -72.92 },
  // Delaware
  { name: "Dover", country: "US", state: "Delaware", lat: 39.16, lon: -75.52 },
  { name: "Wilmington", country: "US", state: "Delaware", lat: 39.74, lon: -75.55 },
  // Florida
  { name: "Miami", country: "US", state: "Florida", lat: 25.76, lon: -80.19 },
  { name: "Orlando", country: "US", state: "Florida", lat: 28.54, lon: -81.38 },
  { name: "Tampa", country: "US", state: "Florida", lat: 27.95, lon: -82.46 },
  { name: "Jacksonville", country: "US", state: "Florida", lat: 30.33, lon: -81.66 },
  { name: "Tallahassee", country: "US", state: "Florida", lat: 30.44, lon: -84.28 },
  // Georgia
  { name: "Atlanta", country: "US", state: "Georgia", lat: 33.75, lon: -84.39 },
  { name: "Savannah", country: "US", state: "Georgia", lat: 32.08, lon: -81.09 },
  // Hawaii
  { name: "Honolulu", country: "US", state: "Hawaii", lat: 21.31, lon: -157.86 },
  // Idaho
  { name: "Boise", country: "US", state: "Idaho", lat: 43.62, lon: -116.20 },
  // Illinois
  { name: "Chicago", country: "US", state: "Illinois", lat: 41.88, lon: -87.63 },
  { name: "Springfield", country: "US", state: "Illinois", lat: 39.78, lon: -89.65 },
  // Indiana
  { name: "Indianapolis", country: "US", state: "Indiana", lat: 39.77, lon: -86.16 },
  // Iowa
  { name: "Des Moines", country: "US", state: "Iowa", lat: 41.59, lon: -93.62 },
  // Kansas
  { name: "Topeka", country: "US", state: "Kansas", lat: 39.05, lon: -95.68 },
  { name: "Wichita", country: "US", state: "Kansas", lat: 37.69, lon: -97.34 },
  // Kentucky
  { name: "Frankfort", country: "US", state: "Kentucky", lat: 38.20, lon: -84.87 },
  { name: "Louisville", country: "US", state: "Kentucky", lat: 38.25, lon: -85.76 },
  { name: "Lexington", country: "US", state: "Kentucky", lat: 38.04, lon: -84.50 },
  // Louisiana
  { name: "Baton Rouge", country: "US", state: "Louisiana", lat: 30.45, lon: -91.19 },
  { name: "New Orleans", country: "US", state: "Louisiana", lat: 29.95, lon: -90.07 },
  // Maine
  { name: "Augusta", country: "US", state: "Maine", lat: 44.31, lon: -69.78 },
  { name: "Portland", country: "US", state: "Maine", lat: 43.66, lon: -70.26 },
  // Maryland
  { name: "Annapolis", country: "US", state: "Maryland", lat: 38.97, lon: -76.49 },
  { name: "Baltimore", country: "US", state: "Maryland", lat: 39.29, lon: -76.61 },
  // Massachusetts
  { name: "Boston", country: "US", state: "Massachusetts", lat: 42.36, lon: -71.06 },
  // Michigan
  { name: "Lansing", country: "US", state: "Michigan", lat: 42.73, lon: -84.56 },
  { name: "Detroit", country: "US", state: "Michigan", lat: 42.33, lon: -83.05 },
  // Minnesota
  { name: "Saint Paul", country: "US", state: "Minnesota", lat: 44.94, lon: -93.09 },
  { name: "Minneapolis", country: "US", state: "Minnesota", lat: 44.98, lon: -93.27 },
  // Mississippi
  { name: "Jackson", country: "US", state: "Mississippi", lat: 32.30, lon: -90.18 },
  // Missouri
  { name: "Jefferson City", country: "US", state: "Missouri", lat: 38.58, lon: -92.17 },
  { name: "Kansas City", country: "US", state: "Missouri", lat: 39.10, lon: -94.58 },
  { name: "St. Louis", country: "US", state: "Missouri", lat: 38.63, lon: -90.20 },
  // Montana
  { name: "Helena", country: "US", state: "Montana", lat: 46.60, lon: -112.04 },
  // Nebraska
  { name: "Lincoln", country: "US", state: "Nebraska", lat: 40.81, lon: -96.70 },
  { name: "Omaha", country: "US", state: "Nebraska", lat: 41.26, lon: -95.94 },
  // Nevada
  { name: "Carson City", country: "US", state: "Nevada", lat: 39.16, lon: -119.77 },
  { name: "Las Vegas", country: "US", state: "Nevada", lat: 36.17, lon: -115.14 },
  { name: "Reno", country: "US", state: "Nevada", lat: 39.53, lon: -119.81 },
  // New Hampshire
  { name: "Concord", country: "US", state: "New Hampshire", lat: 43.21, lon: -71.54 },
  // New Jersey
  { name: "Trenton", country: "US", state: "New Jersey", lat: 40.22, lon: -74.76 },
  { name: "Newark", country: "US", state: "New Jersey", lat: 40.74, lon: -74.17 },
  // New Mexico
  { name: "Santa Fe", country: "US", state: "New Mexico", lat: 35.69, lon: -105.94 },
  { name: "Albuquerque", country: "US", state: "New Mexico", lat: 35.08, lon: -106.65 },
  // New York
  { name: "New York", country: "US", state: "New York", lat: 40.71, lon: -74.01 },
  { name: "Albany", country: "US", state: "New York", lat: 42.65, lon: -73.76 },
  { name: "Buffalo", country: "US", state: "New York", lat: 42.89, lon: -78.88 },
  // North Carolina
  { name: "Raleigh", country: "US", state: "North Carolina", lat: 35.78, lon: -78.64 },
  { name: "Charlotte", country: "US", state: "North Carolina", lat: 35.23, lon: -80.84 },
  // North Dakota
  { name: "Bismarck", country: "US", state: "North Dakota", lat: 46.81, lon: -100.78 },
  // Ohio
  { name: "Columbus", country: "US", state: "Ohio", lat: 39.96, lon: -83.00 },
  { name: "Cleveland", country: "US", state: "Ohio", lat: 41.50, lon: -81.69 },
  { name: "Cincinnati", country: "US", state: "Ohio", lat: 39.10, lon: -84.51 },
  // Oklahoma
  { name: "Oklahoma City", country: "US", state: "Oklahoma", lat: 35.47, lon: -97.52 },
  { name: "Tulsa", country: "US", state: "Oklahoma", lat: 36.15, lon: -95.99 },
  // Oregon
  { name: "Salem", country: "US", state: "Oregon", lat: 44.94, lon: -123.04 },
  { name: "Portland", country: "US", state: "Oregon", lat: 45.52, lon: -122.68 },
  // Pennsylvania
  { name: "Harrisburg", country: "US", state: "Pennsylvania", lat: 40.27, lon: -76.88 },
  { name: "Philadelphia", country: "US", state: "Pennsylvania", lat: 39.95, lon: -75.17 },
  { name: "Pittsburgh", country: "US", state: "Pennsylvania", lat: 40.44, lon: -79.99 },
  // Rhode Island
  { name: "Providence", country: "US", state: "Rhode Island", lat: 41.82, lon: -71.41 },
  // South Carolina
  { name: "Columbia", country: "US", state: "South Carolina", lat: 34.00, lon: -81.03 },
  { name: "Charleston", country: "US", state: "South Carolina", lat: 32.78, lon: -79.93 },
  // South Dakota
  { name: "Pierre", country: "US", state: "South Dakota", lat: 44.37, lon: -100.35 },
  // Tennessee
  { name: "Nashville", country: "US", state: "Tennessee", lat: 36.16, lon: -86.78 },
  { name: "Memphis", country: "US", state: "Tennessee", lat: 35.15, lon: -90.05 },
  { name: "Knoxville", country: "US", state: "Tennessee", lat: 35.96, lon: -83.92 },
  // Texas
  { name: "Austin", country: "US", state: "Texas", lat: 30.27, lon: -97.74 },
  { name: "Houston", country: "US", state: "Texas", lat: 29.76, lon: -95.37 },
  { name: "Dallas", country: "US", state: "Texas", lat: 32.78, lon: -96.80 },
  { name: "San Antonio", country: "US", state: "Texas", lat: 29.42, lon: -98.49 },
  { name: "Fort Worth", country: "US", state: "Texas", lat: 32.76, lon: -97.33 },
  { name: "El Paso", country: "US", state: "Texas", lat: 31.76, lon: -106.49 },
  { name: "Corpus Christi", country: "US", state: "Texas", lat: 27.80, lon: -97.40 },
  { name: "Lubbock", country: "US", state: "Texas", lat: 33.57, lon: -101.85 },
  // Utah
  { name: "Salt Lake City", country: "US", state: "Utah", lat: 40.76, lon: -111.89 },
  // Vermont
  { name: "Montpelier", country: "US", state: "Vermont", lat: 44.26, lon: -72.58 },
  // Virginia
  { name: "Richmond", country: "US", state: "Virginia", lat: 37.54, lon: -77.44 },
  { name: "Virginia Beach", country: "US", state: "Virginia", lat: 36.85, lon: -75.98 },
  // Washington
  { name: "Olympia", country: "US", state: "Washington", lat: 47.04, lon: -122.90 },
  { name: "Seattle", country: "US", state: "Washington", lat: 47.61, lon: -122.33 },
  // West Virginia
  { name: "Charleston", country: "US", state: "West Virginia", lat: 38.35, lon: -81.63 },
  // Wisconsin
  { name: "Madison", country: "US", state: "Wisconsin", lat: 43.07, lon: -89.40 },
  { name: "Milwaukee", country: "US", state: "Wisconsin", lat: 43.04, lon: -87.91 },
  // Wyoming
  { name: "Cheyenne", country: "US", state: "Wyoming", lat: 41.14, lon: -104.82 },
  // Washington D.C.
  { name: "Washington", country: "US", state: "District of Columbia", lat: 38.91, lon: -77.04 },

  // --- Canada ---
  { name: "Toronto", country: "CA", state: "Ontario", lat: 43.65, lon: -79.38 },
  { name: "Montreal", country: "CA", state: "Quebec", lat: 45.50, lon: -73.57 },
  { name: "Vancouver", country: "CA", state: "British Columbia", lat: 49.28, lon: -123.12 },
  { name: "Ottawa", country: "CA", state: "Ontario", lat: 45.42, lon: -75.70 },
  { name: "Calgary", country: "CA", state: "Alberta", lat: 51.05, lon: -114.07 },
  { name: "Edmonton", country: "CA", state: "Alberta", lat: 53.55, lon: -113.49 },
  { name: "Winnipeg", country: "CA", state: "Manitoba", lat: 49.90, lon: -97.14 },
  { name: "Quebec City", country: "CA", state: "Quebec", lat: 46.81, lon: -71.21 },
  { name: "Halifax", country: "CA", state: "Nova Scotia", lat: 44.65, lon: -63.57 },
  { name: "Victoria", country: "CA", state: "British Columbia", lat: 48.43, lon: -123.37 },

  // --- Mexico ---
  { name: "México City", country: "MX", lat: 19.43, lon: -99.13 },
  { name: "Guadalajara", country: "MX", state: "Jalisco", lat: 20.67, lon: -103.35 },
  { name: "Monterrey", country: "MX", state: "Nuevo León", lat: 25.67, lon: -100.31 },
  { name: "Cancún", country: "MX", state: "Quintana Roo", lat: 21.16, lon: -86.85 },
  { name: "Tijuana", country: "MX", state: "Baja California", lat: 32.51, lon: -117.04 },
  { name: "Puebla", country: "MX", state: "Puebla", lat: 19.04, lon: -98.21 },

  // --- Central America & Caribbean ---
  { name: "Guatemala City", country: "GT", lat: 14.63, lon: -90.51 },
  { name: "San Salvador", country: "SV", lat: 13.69, lon: -89.22 },
  { name: "Tegucigalpa", country: "HN", lat: 14.07, lon: -87.21 },
  { name: "Managua", country: "NI", lat: 12.11, lon: -86.27 },
  { name: "San José", country: "CR", lat: 9.93, lon: -84.08 },
  { name: "Panama City", country: "PA", lat: 8.98, lon: -79.52 },
  { name: "Havana", country: "CU", lat: 23.11, lon: -82.37 },
  { name: "Kingston", country: "JM", lat: 18.00, lon: -76.79 },
  { name: "Santo Domingo", country: "DO", lat: 18.47, lon: -69.90 },
  { name: "Port-au-Prince", country: "HT", lat: 18.54, lon: -72.34 },
  { name: "Nassau", country: "BS", lat: 25.06, lon: -77.35 },
  { name: "San Juan", country: "PR", lat: 18.47, lon: -66.11 },

  // ============================================================
  // SOUTH AMERICA (~40)
  // ============================================================
  { name: "São Paulo", country: "BR", state: "São Paulo", lat: -23.55, lon: -46.63 },
  { name: "Rio de Janeiro", country: "BR", state: "Rio de Janeiro", lat: -22.91, lon: -43.17 },
  { name: "Brasília", country: "BR", state: "Distrito Federal", lat: -15.79, lon: -47.88 },
  { name: "Salvador", country: "BR", state: "Bahia", lat: -12.97, lon: -38.51 },
  { name: "Fortaleza", country: "BR", state: "Ceará", lat: -3.72, lon: -38.52 },
  { name: "Belo Horizonte", country: "BR", state: "Minas Gerais", lat: -19.92, lon: -43.94 },
  { name: "Manaus", country: "BR", state: "Amazonas", lat: -3.12, lon: -60.02 },
  { name: "Curitiba", country: "BR", state: "Paraná", lat: -25.43, lon: -49.27 },
  { name: "Recife", country: "BR", state: "Pernambuco", lat: -8.05, lon: -34.87 },
  { name: "Porto Alegre", country: "BR", state: "Rio Grande do Sul", lat: -30.03, lon: -51.23 },
  { name: "Buenos Aires", country: "AR", lat: -34.60, lon: -58.38 },
  { name: "Córdoba", country: "AR", state: "Córdoba", lat: -31.42, lon: -64.18 },
  { name: "Rosario", country: "AR", state: "Santa Fe", lat: -32.95, lon: -60.65 },
  { name: "Mendoza", country: "AR", state: "Mendoza", lat: -32.89, lon: -68.83 },
  { name: "Santiago", country: "CL", lat: -33.45, lon: -70.67 },
  { name: "Valparaíso", country: "CL", lat: -33.05, lon: -71.62 },
  { name: "Lima", country: "PE", lat: -12.05, lon: -77.04 },
  { name: "Cusco", country: "PE", lat: -13.52, lon: -71.97 },
  { name: "Arequipa", country: "PE", lat: -16.41, lon: -71.54 },
  { name: "Bogotá", country: "CO", lat: 4.71, lon: -74.07 },
  { name: "Medellín", country: "CO", state: "Antioquia", lat: 6.25, lon: -75.56 },
  { name: "Cali", country: "CO", state: "Valle del Cauca", lat: 3.45, lon: -76.53 },
  { name: "Cartagena", country: "CO", state: "Bolívar", lat: 10.39, lon: -75.51 },
  { name: "Quito", country: "EC", lat: -0.18, lon: -78.47 },
  { name: "Guayaquil", country: "EC", lat: -2.19, lon: -79.89 },
  { name: "Caracas", country: "VE", lat: 10.48, lon: -66.90 },
  { name: "Montevideo", country: "UY", lat: -34.88, lon: -56.16 },
  { name: "Asunción", country: "PY", lat: -25.26, lon: -57.58 },
  { name: "La Paz", country: "BO", lat: -16.50, lon: -68.15 },
  { name: "Sucre", country: "BO", lat: -19.04, lon: -65.26 },
  { name: "Santa Cruz de la Sierra", country: "BO", lat: -17.78, lon: -63.18 },
  { name: "Georgetown", country: "GY", lat: 6.80, lon: -58.16 },
  { name: "Paramaribo", country: "SR", lat: 5.85, lon: -55.17 },
  { name: "Cayenne", country: "GF", lat: 4.94, lon: -52.33 },
  { name: "Bariloche", country: "AR", state: "Río Negro", lat: -41.13, lon: -71.31 },
  { name: "Concepción", country: "CL", lat: -36.83, lon: -73.05 },
  { name: "Barranquilla", country: "CO", state: "Atlántico", lat: 10.96, lon: -74.78 },
  { name: "Belém", country: "BR", state: "Pará", lat: -1.46, lon: -48.50 },
  { name: "Florianópolis", country: "BR", state: "Santa Catarina", lat: -27.59, lon: -48.55 },
  { name: "Natal", country: "BR", state: "Rio Grande do Norte", lat: -5.79, lon: -35.21 },

  // ============================================================
  // EUROPE (~120)
  // ============================================================
  // United Kingdom
  { name: "London", country: "GB", state: "England", lat: 51.51, lon: -0.13 },
  { name: "Manchester", country: "GB", state: "England", lat: 53.48, lon: -2.24 },
  { name: "Birmingham", country: "GB", state: "England", lat: 52.49, lon: -1.90 },
  { name: "Liverpool", country: "GB", state: "England", lat: 53.41, lon: -2.98 },
  { name: "Edinburgh", country: "GB", state: "Scotland", lat: 55.95, lon: -3.19 },
  { name: "Glasgow", country: "GB", state: "Scotland", lat: 55.86, lon: -4.25 },
  { name: "Cardiff", country: "GB", state: "Wales", lat: 51.48, lon: -3.18 },
  { name: "Belfast", country: "GB", state: "Northern Ireland", lat: 54.60, lon: -5.93 },
  { name: "Bristol", country: "GB", state: "England", lat: 51.45, lon: -2.59 },
  { name: "Leeds", country: "GB", state: "England", lat: 53.80, lon: -1.55 },

  // France
  { name: "Paris", country: "FR", lat: 48.86, lon: 2.35 },
  { name: "Marseille", country: "FR", lat: 43.30, lon: 5.37 },
  { name: "Lyon", country: "FR", lat: 45.76, lon: 4.84 },
  { name: "Toulouse", country: "FR", lat: 43.60, lon: 1.44 },
  { name: "Nice", country: "FR", lat: 43.71, lon: 7.26 },
  { name: "Bordeaux", country: "FR", lat: 44.84, lon: -0.58 },
  { name: "Strasbourg", country: "FR", lat: 48.57, lon: 7.75 },

  // Germany
  { name: "Berlin", country: "DE", lat: 52.52, lon: 13.41 },
  { name: "Munich", country: "DE", state: "Bavaria", lat: 48.14, lon: 11.58 },
  { name: "Frankfurt", country: "DE", state: "Hesse", lat: 50.11, lon: 8.68 },
  { name: "Hamburg", country: "DE", lat: 53.55, lon: 9.99 },
  { name: "Cologne", country: "DE", state: "North Rhine-Westphalia", lat: 50.94, lon: 6.96 },
  { name: "Stuttgart", country: "DE", state: "Baden-Württemberg", lat: 48.78, lon: 9.18 },
  { name: "Düsseldorf", country: "DE", state: "North Rhine-Westphalia", lat: 51.23, lon: 6.78 },

  // Italy
  { name: "Rome", country: "IT", lat: 41.90, lon: 12.50 },
  { name: "Milan", country: "IT", state: "Lombardy", lat: 45.46, lon: 9.19 },
  { name: "Naples", country: "IT", state: "Campania", lat: 40.85, lon: 14.27 },
  { name: "Florence", country: "IT", state: "Tuscany", lat: 43.77, lon: 11.25 },
  { name: "Venice", country: "IT", state: "Veneto", lat: 45.44, lon: 12.32 },
  { name: "Turin", country: "IT", state: "Piedmont", lat: 45.07, lon: 7.69 },
  { name: "Bologna", country: "IT", state: "Emilia-Romagna", lat: 44.49, lon: 11.34 },

  // Spain
  { name: "Madrid", country: "ES", lat: 40.42, lon: -3.70 },
  { name: "Barcelona", country: "ES", state: "Catalonia", lat: 41.39, lon: 2.17 },
  { name: "Seville", country: "ES", state: "Andalusia", lat: 37.39, lon: -5.98 },
  { name: "Valencia", country: "ES", lat: 39.47, lon: -0.38 },
  { name: "Bilbao", country: "ES", state: "Basque Country", lat: 43.26, lon: -2.93 },
  { name: "Málaga", country: "ES", state: "Andalusia", lat: 36.72, lon: -4.42 },

  // Portugal
  { name: "Lisbon", country: "PT", lat: 38.72, lon: -9.14 },
  { name: "Porto", country: "PT", lat: 41.15, lon: -8.61 },

  // Netherlands
  { name: "Amsterdam", country: "NL", lat: 52.37, lon: 4.90 },
  { name: "Rotterdam", country: "NL", lat: 51.92, lon: 4.48 },
  { name: "The Hague", country: "NL", lat: 52.08, lon: 4.30 },

  // Belgium
  { name: "Brussels", country: "BE", lat: 50.85, lon: 4.35 },
  { name: "Antwerp", country: "BE", lat: 51.22, lon: 4.40 },

  // Switzerland
  { name: "Zürich", country: "CH", lat: 47.38, lon: 8.54 },
  { name: "Geneva", country: "CH", lat: 46.20, lon: 6.15 },
  { name: "Bern", country: "CH", lat: 46.95, lon: 7.45 },

  // Austria
  { name: "Vienna", country: "AT", lat: 48.21, lon: 16.37 },
  { name: "Salzburg", country: "AT", lat: 47.80, lon: 13.04 },
  { name: "Innsbruck", country: "AT", lat: 47.26, lon: 11.39 },

  // Scandinavia
  { name: "Stockholm", country: "SE", lat: 59.33, lon: 18.07 },
  { name: "Gothenburg", country: "SE", lat: 57.71, lon: 11.97 },
  { name: "Copenhagen", country: "DK", lat: 55.68, lon: 12.57 },
  { name: "Oslo", country: "NO", lat: 59.91, lon: 10.75 },
  { name: "Bergen", country: "NO", lat: 60.39, lon: 5.32 },
  { name: "Helsinki", country: "FI", lat: 60.17, lon: 24.94 },
  { name: "Reykjavik", country: "IS", lat: 64.15, lon: -21.94 },

  // Eastern Europe
  { name: "Warsaw", country: "PL", lat: 52.23, lon: 21.01 },
  { name: "Kraków", country: "PL", lat: 50.06, lon: 19.94 },
  { name: "Gdańsk", country: "PL", lat: 54.35, lon: 18.65 },
  { name: "Prague", country: "CZ", lat: 50.08, lon: 14.44 },
  { name: "Brno", country: "CZ", lat: 49.20, lon: 16.61 },
  { name: "Budapest", country: "HU", lat: 47.50, lon: 19.04 },
  { name: "Bucharest", country: "RO", lat: 44.43, lon: 26.10 },
  { name: "Cluj-Napoca", country: "RO", lat: 46.77, lon: 23.60 },
  { name: "Sofia", country: "BG", lat: 42.70, lon: 23.32 },
  { name: "Belgrade", country: "RS", lat: 44.82, lon: 20.46 },
  { name: "Zagreb", country: "HR", lat: 45.81, lon: 15.98 },
  { name: "Dubrovnik", country: "HR", lat: 42.65, lon: 18.09 },
  { name: "Ljubljana", country: "SI", lat: 46.06, lon: 14.51 },
  { name: "Bratislava", country: "SK", lat: 48.15, lon: 17.11 },
  { name: "Tallinn", country: "EE", lat: 59.44, lon: 24.75 },
  { name: "Riga", country: "LV", lat: 56.95, lon: 24.11 },
  { name: "Vilnius", country: "LT", lat: 54.69, lon: 25.28 },

  // Greece & Cyprus
  { name: "Athens", country: "GR", lat: 37.98, lon: 23.73 },
  { name: "Thessaloniki", country: "GR", lat: 40.64, lon: 22.94 },
  { name: "Nicosia", country: "CY", lat: 35.19, lon: 33.38 },

  // Turkey (European part)
  { name: "Istanbul", country: "TR", lat: 41.01, lon: 28.98 },

  // Other
  { name: "Dublin", country: "IE", lat: 53.35, lon: -6.26 },
  { name: "Cork", country: "IE", lat: 51.90, lon: -8.47 },
  { name: "Luxembourg City", country: "LU", lat: 49.61, lon: 6.13 },
  { name: "Monaco", country: "MC", lat: 43.74, lon: 7.43 },
  { name: "Valletta", country: "MT", lat: 35.90, lon: 14.51 },
  { name: "Andorra la Vella", country: "AD", lat: 42.51, lon: 1.52 },
  { name: "Podgorica", country: "ME", lat: 42.44, lon: 19.26 },
  { name: "Sarajevo", country: "BA", lat: 43.86, lon: 18.41 },
  { name: "Skopje", country: "MK", lat: 42.00, lon: 21.43 },
  { name: "Tirana", country: "AL", lat: 41.33, lon: 19.82 },
  { name: "Chișinău", country: "MD", lat: 47.01, lon: 28.86 },
  { name: "Kyiv", country: "UA", lat: 50.45, lon: 30.52 },
  { name: "Lviv", country: "UA", lat: 49.84, lon: 24.03 },
  { name: "Minsk", country: "BY", lat: 53.90, lon: 27.57 },
  { name: "Moscow", country: "RU", lat: 55.76, lon: 37.62 },
  { name: "Saint Petersburg", country: "RU", lat: 59.93, lon: 30.32 },
  { name: "Novosibirsk", country: "RU", lat: 55.03, lon: 82.92 },
  { name: "Vladivostok", country: "RU", lat: 43.12, lon: 131.89 },

  // Additional Europe
  { name: "Palma de Mallorca", country: "ES", lat: 39.57, lon: 2.65 },
  { name: "Granada", country: "ES", state: "Andalusia", lat: 37.18, lon: -3.60 },
  { name: "Hanover", country: "DE", state: "Lower Saxony", lat: 52.37, lon: 9.74 },
  { name: "Leipzig", country: "DE", state: "Saxony", lat: 51.34, lon: 12.37 },
  { name: "Dresden", country: "DE", state: "Saxony", lat: 51.05, lon: 13.74 },
  { name: "Nantes", country: "FR", lat: 47.22, lon: -1.55 },
  { name: "Montpellier", country: "FR", lat: 43.61, lon: 3.88 },
  { name: "Lille", country: "FR", lat: 50.63, lon: 3.06 },
  { name: "Genoa", country: "IT", state: "Liguria", lat: 44.41, lon: 8.93 },
  { name: "Palermo", country: "IT", state: "Sicily", lat: 38.12, lon: 13.36 },
  { name: "Catania", country: "IT", state: "Sicily", lat: 37.50, lon: 15.09 },
  { name: "Malmö", country: "SE", lat: 55.61, lon: 13.00 },
  { name: "Tampere", country: "FI", lat: 61.50, lon: 23.79 },
  { name: "Wrocław", country: "PL", lat: 51.11, lon: 17.04 },
  { name: "Poznań", country: "PL", lat: 52.41, lon: 16.93 },
  { name: "Odesa", country: "UA", lat: 46.48, lon: 30.74 },
  { name: "Constanța", country: "RO", lat: 44.18, lon: 28.63 },
  { name: "Split", country: "HR", lat: 43.51, lon: 16.44 },
  { name: "Santorini", country: "GR", lat: 36.39, lon: 25.46 },
  { name: "Mykonos", country: "GR", lat: 37.45, lon: 25.33 },

  // ============================================================
  // ASIA (~130)
  // ============================================================

  // China
  { name: "Beijing", country: "CN", lat: 39.90, lon: 116.40 },
  { name: "Shanghai", country: "CN", lat: 31.23, lon: 121.47 },
  { name: "Guangzhou", country: "CN", state: "Guangdong", lat: 23.13, lon: 113.26 },
  { name: "Shenzhen", country: "CN", state: "Guangdong", lat: 22.54, lon: 114.06 },
  { name: "Chengdu", country: "CN", state: "Sichuan", lat: 30.57, lon: 104.07 },
  { name: "Chongqing", country: "CN", lat: 29.56, lon: 106.55 },
  { name: "Wuhan", country: "CN", state: "Hubei", lat: 30.59, lon: 114.31 },
  { name: "Xi'an", country: "CN", state: "Shaanxi", lat: 34.26, lon: 108.94 },
  { name: "Hangzhou", country: "CN", state: "Zhejiang", lat: 30.27, lon: 120.15 },
  { name: "Nanjing", country: "CN", state: "Jiangsu", lat: 32.06, lon: 118.80 },
  { name: "Tianjin", country: "CN", lat: 39.13, lon: 117.20 },
  { name: "Harbin", country: "CN", state: "Heilongjiang", lat: 45.75, lon: 126.65 },
  { name: "Kunming", country: "CN", state: "Yunnan", lat: 25.04, lon: 102.68 },
  { name: "Dalian", country: "CN", state: "Liaoning", lat: 38.91, lon: 121.60 },
  { name: "Qingdao", country: "CN", state: "Shandong", lat: 36.07, lon: 120.38 },

  // Japan
  { name: "Tokyo", country: "JP", lat: 35.68, lon: 139.69 },
  { name: "Osaka", country: "JP", lat: 34.69, lon: 135.50 },
  { name: "Kyoto", country: "JP", lat: 35.01, lon: 135.77 },
  { name: "Yokohama", country: "JP", lat: 35.44, lon: 139.64 },
  { name: "Nagoya", country: "JP", lat: 35.18, lon: 136.91 },
  { name: "Sapporo", country: "JP", lat: 43.06, lon: 141.35 },
  { name: "Fukuoka", country: "JP", lat: 33.59, lon: 130.40 },
  { name: "Hiroshima", country: "JP", lat: 34.39, lon: 132.46 },
  { name: "Kobe", country: "JP", lat: 34.69, lon: 135.20 },

  // South Korea
  { name: "Seoul", country: "KR", lat: 37.57, lon: 126.98 },
  { name: "Busan", country: "KR", lat: 35.18, lon: 129.08 },
  { name: "Incheon", country: "KR", lat: 37.46, lon: 126.71 },
  { name: "Daegu", country: "KR", lat: 35.87, lon: 128.60 },
  { name: "Jeju", country: "KR", lat: 33.50, lon: 126.53 },

  // Taiwan
  { name: "Taipei", country: "TW", lat: 25.03, lon: 121.57 },
  { name: "Kaohsiung", country: "TW", lat: 22.63, lon: 120.30 },

  // Hong Kong & Macau
  { name: "Hong Kong", country: "HK", lat: 22.32, lon: 114.17 },
  { name: "Macau", country: "MO", lat: 22.20, lon: 113.55 },

  // Mongolia
  { name: "Ulaanbaatar", country: "MN", lat: 47.91, lon: 106.91 },

  // India
  { name: "New Delhi", country: "IN", state: "Delhi", lat: 28.61, lon: 77.21 },
  { name: "Mumbai", country: "IN", state: "Maharashtra", lat: 19.08, lon: 72.88 },
  { name: "Bangalore", country: "IN", state: "Karnataka", lat: 12.97, lon: 77.59 },
  { name: "Chennai", country: "IN", state: "Tamil Nadu", lat: 13.08, lon: 80.27 },
  { name: "Kolkata", country: "IN", state: "West Bengal", lat: 22.57, lon: 88.36 },
  { name: "Hyderabad", country: "IN", state: "Telangana", lat: 17.39, lon: 78.49 },
  { name: "Ahmedabad", country: "IN", state: "Gujarat", lat: 23.02, lon: 72.57 },
  { name: "Pune", country: "IN", state: "Maharashtra", lat: 18.52, lon: 73.86 },
  { name: "Jaipur", country: "IN", state: "Rajasthan", lat: 26.91, lon: 75.79 },
  { name: "Lucknow", country: "IN", state: "Uttar Pradesh", lat: 26.85, lon: 80.95 },
  { name: "Varanasi", country: "IN", state: "Uttar Pradesh", lat: 25.32, lon: 83.01 },
  { name: "Goa", country: "IN", state: "Goa", lat: 15.50, lon: 73.83 },
  { name: "Amritsar", country: "IN", state: "Punjab", lat: 31.63, lon: 74.87 },
  { name: "Kochi", country: "IN", state: "Kerala", lat: 9.93, lon: 76.27 },

  // Pakistan
  { name: "Islamabad", country: "PK", lat: 33.69, lon: 73.04 },
  { name: "Karachi", country: "PK", state: "Sindh", lat: 24.86, lon: 67.01 },
  { name: "Lahore", country: "PK", state: "Punjab", lat: 31.55, lon: 74.35 },

  // Bangladesh
  { name: "Dhaka", country: "BD", lat: 23.81, lon: 90.41 },
  { name: "Chittagong", country: "BD", lat: 22.36, lon: 91.78 },

  // Sri Lanka
  { name: "Colombo", country: "LK", lat: 6.93, lon: 79.85 },

  // Nepal
  { name: "Kathmandu", country: "NP", lat: 27.72, lon: 85.32 },

  // Southeast Asia
  { name: "Bangkok", country: "TH", lat: 13.76, lon: 100.50 },
  { name: "Chiang Mai", country: "TH", lat: 18.79, lon: 98.98 },
  { name: "Phuket", country: "TH", lat: 7.88, lon: 98.39 },
  { name: "Ho Chi Minh City", country: "VN", lat: 10.82, lon: 106.63 },
  { name: "Hanoi", country: "VN", lat: 21.03, lon: 105.85 },
  { name: "Da Nang", country: "VN", lat: 16.05, lon: 108.22 },
  { name: "Singapore", country: "SG", lat: 1.35, lon: 103.82 },
  { name: "Kuala Lumpur", country: "MY", lat: 3.14, lon: 101.69 },
  { name: "George Town", country: "MY", state: "Penang", lat: 5.41, lon: 100.34 },
  { name: "Jakarta", country: "ID", lat: -6.21, lon: 106.85 },
  { name: "Bali", country: "ID", lat: -8.34, lon: 115.09 },
  { name: "Surabaya", country: "ID", lat: -7.25, lon: 112.75 },
  { name: "Yogyakarta", country: "ID", lat: -7.80, lon: 110.36 },
  { name: "Manila", country: "PH", lat: 14.60, lon: 120.98 },
  { name: "Cebu", country: "PH", lat: 10.31, lon: 123.89 },
  { name: "Phnom Penh", country: "KH", lat: 11.56, lon: 104.92 },
  { name: "Siem Reap", country: "KH", lat: 13.36, lon: 103.86 },
  { name: "Vientiane", country: "LA", lat: 17.97, lon: 102.63 },
  { name: "Yangon", country: "MM", lat: 16.87, lon: 96.20 },
  { name: "Naypyidaw", country: "MM", lat: 19.76, lon: 96.07 },
  { name: "Bandar Seri Begawan", country: "BN", lat: 4.94, lon: 114.95 },
  { name: "Dili", country: "TL", lat: -8.56, lon: 125.57 },

  // Central Asia
  { name: "Almaty", country: "KZ", lat: 43.24, lon: 76.95 },
  { name: "Astana", country: "KZ", lat: 51.17, lon: 71.43 },
  { name: "Tashkent", country: "UZ", lat: 41.30, lon: 69.28 },
  { name: "Samarkand", country: "UZ", lat: 39.65, lon: 66.96 },
  { name: "Bishkek", country: "KG", lat: 42.87, lon: 74.59 },
  { name: "Dushanbe", country: "TJ", lat: 38.56, lon: 68.77 },
  { name: "Ashgabat", country: "TM", lat: 37.96, lon: 58.33 },
  { name: "Kabul", country: "AF", lat: 34.53, lon: 69.17 },

  // Additional Southeast Asia
  { name: "Luang Prabang", country: "LA", lat: 19.89, lon: 102.14 },
  { name: "Malé", country: "MV", lat: 4.18, lon: 73.51 },

  // Additional China
  { name: "Suzhou", country: "CN", state: "Jiangsu", lat: 31.30, lon: 120.59 },
  { name: "Xiamen", country: "CN", state: "Fujian", lat: 24.48, lon: 118.09 },
  { name: "Guilin", country: "CN", state: "Guangxi", lat: 25.27, lon: 110.29 },
  { name: "Lhasa", country: "CN", state: "Tibet", lat: 29.65, lon: 91.17 },
  { name: "Ürümqi", country: "CN", state: "Xinjiang", lat: 43.83, lon: 87.62 },
  { name: "Shenyang", country: "CN", state: "Liaoning", lat: 41.80, lon: 123.43 },
  { name: "Zhengzhou", country: "CN", state: "Henan", lat: 34.75, lon: 113.65 },
  { name: "Changsha", country: "CN", state: "Hunan", lat: 28.23, lon: 112.94 },

  // Additional India
  { name: "Chandigarh", country: "IN", state: "Chandigarh", lat: 30.73, lon: 76.78 },
  { name: "Agra", country: "IN", state: "Uttar Pradesh", lat: 27.18, lon: 78.02 },
  { name: "Udaipur", country: "IN", state: "Rajasthan", lat: 24.59, lon: 73.69 },
  { name: "Srinagar", country: "IN", state: "Jammu and Kashmir", lat: 34.08, lon: 74.80 },

  // Additional Japan
  { name: "Nara", country: "JP", lat: 34.69, lon: 135.80 },
  { name: "Okinawa", country: "JP", lat: 26.33, lon: 127.80 },
  { name: "Sendai", country: "JP", lat: 38.27, lon: 140.87 },

  // Other Asia
  { name: "Tbilisi", country: "GE", lat: 41.72, lon: 44.78 },
  { name: "Yerevan", country: "AM", lat: 40.18, lon: 44.51 },
  { name: "Baku", country: "AZ", lat: 40.41, lon: 49.87 },

  // ============================================================
  // MIDDLE EAST (~30)
  // ============================================================
  { name: "Dubai", country: "AE", state: "Dubai", lat: 25.20, lon: 55.27 },
  { name: "Abu Dhabi", country: "AE", state: "Abu Dhabi", lat: 24.45, lon: 54.65 },
  { name: "Sharjah", country: "AE", state: "Sharjah", lat: 25.34, lon: 55.41 },
  { name: "Riyadh", country: "SA", lat: 24.69, lon: 46.72 },
  { name: "Jeddah", country: "SA", lat: 21.49, lon: 39.19 },
  { name: "Mecca", country: "SA", lat: 21.39, lon: 39.86 },
  { name: "Medina", country: "SA", lat: 24.47, lon: 39.61 },
  { name: "Doha", country: "QA", lat: 25.29, lon: 51.53 },
  { name: "Kuwait City", country: "KW", lat: 29.38, lon: 47.99 },
  { name: "Manama", country: "BH", lat: 26.23, lon: 50.59 },
  { name: "Muscat", country: "OM", lat: 23.61, lon: 58.54 },
  { name: "Sana'a", country: "YE", lat: 15.35, lon: 44.21 },
  { name: "Tehran", country: "IR", lat: 35.69, lon: 51.39 },
  { name: "Isfahan", country: "IR", lat: 32.65, lon: 51.68 },
  { name: "Shiraz", country: "IR", lat: 29.59, lon: 52.58 },
  { name: "Baghdad", country: "IQ", lat: 33.31, lon: 44.37 },
  { name: "Erbil", country: "IQ", lat: 36.19, lon: 44.01 },
  { name: "Ankara", country: "TR", lat: 39.93, lon: 32.85 },
  { name: "Antalya", country: "TR", lat: 36.90, lon: 30.69 },
  { name: "Izmir", country: "TR", lat: 38.42, lon: 27.14 },
  { name: "Jerusalem", country: "IL", lat: 31.77, lon: 35.23 },
  { name: "Tel Aviv", country: "IL", lat: 32.09, lon: 34.78 },
  { name: "Haifa", country: "IL", lat: 32.79, lon: 34.99 },
  { name: "Amman", country: "JO", lat: 31.95, lon: 35.93 },
  { name: "Beirut", country: "LB", lat: 33.89, lon: 35.50 },
  { name: "Damascus", country: "SY", lat: 33.51, lon: 36.29 },
  { name: "Aleppo", country: "SY", lat: 36.20, lon: 37.15 },
  { name: "Petra", country: "JO", lat: 30.33, lon: 35.44 },
  { name: "Aqaba", country: "JO", lat: 29.53, lon: 35.01 },
  { name: "Tabriz", country: "IR", lat: 38.08, lon: 46.29 },
  { name: "Salalah", country: "OM", lat: 17.02, lon: 54.09 },
  { name: "Dammam", country: "SA", lat: 26.43, lon: 50.10 },
  { name: "NEOM", country: "SA", lat: 27.95, lon: 35.15 },

  // ============================================================
  // AFRICA (~40)
  // ============================================================

  // North Africa
  { name: "Cairo", country: "EG", lat: 30.04, lon: 31.24 },
  { name: "Alexandria", country: "EG", lat: 31.20, lon: 29.92 },
  { name: "Luxor", country: "EG", lat: 25.69, lon: 32.64 },
  { name: "Casablanca", country: "MA", lat: 33.57, lon: -7.59 },
  { name: "Marrakech", country: "MA", lat: 31.63, lon: -8.01 },
  { name: "Rabat", country: "MA", lat: 34.02, lon: -6.84 },
  { name: "Fez", country: "MA", lat: 34.03, lon: -5.00 },
  { name: "Tunis", country: "TN", lat: 36.81, lon: 10.18 },
  { name: "Algiers", country: "DZ", lat: 36.74, lon: 3.06 },
  { name: "Tripoli", country: "LY", lat: 32.90, lon: 13.18 },

  // West Africa
  { name: "Lagos", country: "NG", lat: 6.52, lon: 3.38 },
  { name: "Abuja", country: "NG", lat: 9.06, lon: 7.49 },
  { name: "Accra", country: "GH", lat: 5.56, lon: -0.19 },
  { name: "Dakar", country: "SN", lat: 14.69, lon: -17.44 },
  { name: "Bamako", country: "ML", lat: 12.64, lon: -8.00 },
  { name: "Ouagadougou", country: "BF", lat: 12.37, lon: -1.52 },
  { name: "Abidjan", country: "CI", lat: 5.36, lon: -4.01 },
  { name: "Lomé", country: "TG", lat: 6.17, lon: 1.23 },
  { name: "Cotonou", country: "BJ", lat: 6.37, lon: 2.39 },
  { name: "Conakry", country: "GN", lat: 9.64, lon: -13.58 },
  { name: "Freetown", country: "SL", lat: 8.48, lon: -13.23 },

  // East Africa
  { name: "Nairobi", country: "KE", lat: -1.29, lon: 36.82 },
  { name: "Mombasa", country: "KE", lat: -4.05, lon: 39.67 },
  { name: "Addis Ababa", country: "ET", lat: 9.02, lon: 38.75 },
  { name: "Dar es Salaam", country: "TZ", lat: -6.79, lon: 39.28 },
  { name: "Zanzibar City", country: "TZ", lat: -6.16, lon: 39.19 },
  { name: "Kampala", country: "UG", lat: 0.31, lon: 32.58 },
  { name: "Kigali", country: "RW", lat: -1.94, lon: 29.87 },
  { name: "Mogadishu", country: "SO", lat: 2.05, lon: 45.32 },
  { name: "Djibouti", country: "DJ", lat: 11.59, lon: 43.15 },
  { name: "Antananarivo", country: "MG", lat: -18.91, lon: 47.52 },

  // Southern Africa
  { name: "Johannesburg", country: "ZA", state: "Gauteng", lat: -26.20, lon: 28.05 },
  { name: "Cape Town", country: "ZA", state: "Western Cape", lat: -33.93, lon: 18.42 },
  { name: "Durban", country: "ZA", state: "KwaZulu-Natal", lat: -29.86, lon: 31.02 },
  { name: "Pretoria", country: "ZA", state: "Gauteng", lat: -25.75, lon: 28.19 },
  { name: "Windhoek", country: "NA", lat: -22.56, lon: 17.08 },
  { name: "Gaborone", country: "BW", lat: -24.65, lon: 25.91 },
  { name: "Harare", country: "ZW", lat: -17.83, lon: 31.05 },
  { name: "Lusaka", country: "ZM", lat: -15.39, lon: 28.32 },
  { name: "Maputo", country: "MZ", lat: -25.97, lon: 32.57 },
  { name: "Lilongwe", country: "MW", lat: -13.96, lon: 33.79 },

  // Central Africa
  { name: "Kinshasa", country: "CD", lat: -4.32, lon: 15.31 },
  { name: "Brazzaville", country: "CG", lat: -4.27, lon: 15.28 },
  { name: "Luanda", country: "AO", lat: -8.84, lon: 13.23 },
  { name: "Yaoundé", country: "CM", lat: 3.87, lon: 11.52 },
  { name: "Douala", country: "CM", lat: 4.05, lon: 9.77 },
  { name: "Libreville", country: "GA", lat: 0.39, lon: 9.45 },

  // Island nations
  { name: "Port Louis", country: "MU", lat: -20.16, lon: 57.50 },

  // ============================================================
  // OCEANIA (~20)
  // ============================================================

  // Australia
  { name: "Sydney", country: "AU", state: "New South Wales", lat: -33.87, lon: 151.21 },
  { name: "Melbourne", country: "AU", state: "Victoria", lat: -37.81, lon: 144.96 },
  { name: "Brisbane", country: "AU", state: "Queensland", lat: -27.47, lon: 153.03 },
  { name: "Perth", country: "AU", state: "Western Australia", lat: -31.95, lon: 115.86 },
  { name: "Adelaide", country: "AU", state: "South Australia", lat: -34.93, lon: 138.60 },
  { name: "Canberra", country: "AU", state: "Australian Capital Territory", lat: -35.28, lon: 149.13 },
  { name: "Hobart", country: "AU", state: "Tasmania", lat: -42.88, lon: 147.33 },
  { name: "Darwin", country: "AU", state: "Northern Territory", lat: -12.46, lon: 130.84 },
  { name: "Gold Coast", country: "AU", state: "Queensland", lat: -28.00, lon: 153.43 },
  { name: "Cairns", country: "AU", state: "Queensland", lat: -16.92, lon: 145.77 },

  // New Zealand
  { name: "Auckland", country: "NZ", lat: -36.85, lon: 174.76 },
  { name: "Wellington", country: "NZ", lat: -41.29, lon: 174.78 },
  { name: "Christchurch", country: "NZ", lat: -43.53, lon: 172.64 },
  { name: "Queenstown", country: "NZ", lat: -45.03, lon: 168.66 },

  // Pacific Islands
  { name: "Suva", country: "FJ", lat: -18.14, lon: 178.44 },
  { name: "Port Moresby", country: "PG", lat: -6.21, lon: 155.97 },
  { name: "Apia", country: "WS", lat: -13.83, lon: -171.76 },
  { name: "Nuku'alofa", country: "TO", lat: -21.21, lon: -175.20 },
  { name: "Noumea", country: "NC", lat: -22.28, lon: 166.46 },
  { name: "Papeete", country: "PF", lat: -17.53, lon: -149.57 },
  { name: "Port Vila", country: "VU", lat: -17.73, lon: 168.32 },
];
