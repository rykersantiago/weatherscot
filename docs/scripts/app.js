// Set up API URLs 
const flightApiUrl = 'https://api.aviationstack.com/v1/flights';
const weatherApiUrl = 'https://api.weatherapi.com/v1/current.json';
const weatherApiKey = 'afab3b113c974b65a2a03446251706';

// Fetch flight data using the flight number entered by the user
async function fetchFlightData(flightNumber) {
    // TEST MODE: Show default weather card if "TEST" is entered
    if (flightNumber.toUpperCase() === "TEST") {
        displayFlightDetails({
            departure: { iata: "AAA", scheduled: "2025-06-20T10:00:00" },
            arrival: { iata: "BBB", scheduled: "2025-06-20T12:00:00" }
        });
        displayWeatherDetails({
            current: {
                is_day: 1,
                temp_c: 22,
                condition: { text: "Partly cloudy", icon: "//cdn.weatherapi.com/weather/64x64/day/116.png" },
                humidity: 55,
                wind_kph: 10
            }
        });
        return;
    }
    try {
        // Call the Aviationstack API with the flight number
        const response = await fetch(`${flightApiUrl}?access_key=df8ab566d2b7e31ff8c46a94d2bc511d&flight_iata=${flightNumber}`);
        if (!response.ok) throw new Error('Failed to fetch flight data');
        const data = await response.json();
        // If flight data is found, display it
        if (data.data && data.data.length > 0) {
            displayFlightDetails(data.data[0]);
            console.log('Flight data:', data.data[0]); // Debug: See what data is returned
            // Get the flight's current coordinates
            const geo = data.data[0].geography;
            if (geo && geo.latitude && geo.longitude) {
                fetchWeatherDataByCoords(geo.latitude, geo.longitude); // Fetch weather for flight coordinates
            } else {
                // Fallback: Use departure airport city or code
                const dep = data.data[0].departure;
                if (dep && dep.iata) {
                    fetchWeatherData(dep.iata); // Try fetching weather by airport code
                } else if (dep && dep.airport) {
                    fetchWeatherData(dep.airport); // Try fetching weather by airport name
                } else {
                    hideWeather();
                    console.warn('No coordinates or departure info found in flight data.');
                }
            }
        } else {
            displayFlightDetails(null); // Hide flight info if not found
            hideWeather();
        }
    } catch (error) {
        displayFlightDetails(null); // Hide flight info on error
        hideWeather();
        console.error(error);
    }
}



// Fetch weather data for given latitude and longitude
async function fetchWeatherDataByCoords(lat, lon) {
    try {
        // WeatherAPI supports lat,long as the 'q' parameter
        const response = await fetch(`${weatherApiUrl}?key=${weatherApiKey}&q=${lat},${lon}&aqi=no`);
        if (!response.ok) throw new Error('Failed to fetch weather data');
        const weatherData = await response.json();
        displayWeatherDetails(weatherData); // Show weather info
    } catch (error) {
        hideWeather(); // Hide weather card on error
        console.error(error);
        console.log("Couldn't fetch coordinates");
    }
}



// Fetch weather data for a given location (city or airport)
async function fetchWeatherData(location) {
    try {
        // Call the WeatherAPI with the location
        const response = await fetch(`${weatherApiUrl}?key=${weatherApiKey}&q=${encodeURIComponent(location)}&aqi=no`);
        if (!response.ok) throw new Error('Failed to fetch weather data');
        const weatherData = await response.json();
        displayWeatherDetails(weatherData); // Show weather info
    } catch (error) {
        hideWeather(); // Hide weather card on error
        console.error(error);
    }
}



// Show flight details in the UI
function displayFlightDetails(data) {
    const routeInfo = document.querySelector('.route-info');
    if (!data) {
        routeInfo.style.display = 'none'; // Hide if no data
        return;
    }
    // Update the route and times
    document.getElementById('route-title').textContent = 
        `${data.departure.iata || '---'} to ${data.arrival.iata || '---'}`;
    document.getElementById('dep-time').textContent = 
        `dep - ${data.departure.scheduled ? data.departure.scheduled.substring(11, 16) : '--:--'}`;
    document.getElementById('arr-time').textContent = 
        `arr - ${data.arrival.scheduled ? data.arrival.scheduled.substring(11, 16) : '--:--'}`;
    routeInfo.style.display = 'flex'; // Show the route info
}

// Show weather details in the UI
function displayWeatherDetails(data) {
    const weatherCard = document.querySelector('.weather-card');
    weatherCard.classList.remove('night', 'rain');
    document.body.classList.remove('weather-night', 'weather-rain', 'weather-default');

    // Night detection
    if (data.current.is_day === 0) {
        weatherCard.classList.add('night');
        document.body.classList.add('weather-night');
    }
    // Rain detection
    else if (data.current.condition.text.toLowerCase().includes('rain')) {
        weatherCard.classList.add('rain');
        document.body.classList.add('weather-rain');
    }
    // Default (day, not raining)
    else {
        document.body.classList.add('weather-default');
    }

    // Update weather info
    document.getElementById('temperature').textContent = `${Math.round(data.current.temp_c)}°`;
    document.getElementById('weather-description').textContent = data.current.condition.text;
    document.getElementById('humidity').textContent = `${data.current.humidity}%`;
    document.getElementById('wind-speed').textContent = `${data.current.wind_kph}km/h`;
    document.getElementById('weather-icon').innerHTML = `<img src="https:${data.current.condition.icon}" alt="${data.current.condition.text}" style="height:48px;vertical-align:middle;">`;
    weatherCard.style.display = 'flex';
}

// Hide the weather card
function hideWeather() {
    document.querySelector('.weather-card').style.display = 'none';
}

// When the user submits the search form, fetch flight data
document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    document.querySelector('.title').style.display = 'none'; // Hide the title card
    const flightNumber = document.getElementById('flight-input').value.trim();
    if (flightNumber) {
        fetchFlightData(flightNumber);
    }
});

// On page load, hide both cards
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.route-info').style.display = 'none';
    document.querySelector('.weather-card').style.display = 'none';
});