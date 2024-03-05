
const getWeatherBtn = document.getElementById('get-weather-btn');
const inputCity = document.getElementById('city');
const weatherInfoDiv = document.getElementById('weather-info');
const metric = document.getElementById('unit')
const getForecastBtn = document.getElementById('get-forecast-btn');
const locationDetail = document.getElementById("location-detail");
const leftDetail = document.querySelector('.left-detail')
const rightDetail = document.querySelector('.right-detail');
const forecastDetail = document.getElementById('forecast')
const currentWeather = document.getElementById('current-weather')
const avgTemp = document.getElementById('avg-temp')

const fetchCurrentLocationWeather = async (position) => {
    if (!position) {
        console.error('Position object is undefined.');
        return;
    }
    const currentLatitude = position.coords.latitude;
    const currentLongitude = position.coords.longitude;

    console.log("Fetching weather for Latitude: " + currentLatitude + ", Longitude: " + currentLongitude);

    try {
        const response = await fetch(`http://localhost:3000/getweather/${currentLatitude}/${currentLongitude}`);
        const data = await response.json();
        console.log(data);
        locationDetail.innerText = `${data.name}, ${data.sys.country}`
        const temperature = data.main.temp;
        const humidity = data.main.humidity;
        const weatherMain = data.weather[0].main;
        const weatherDescription = data.weather[0].description;
        const weatherIconUrl = `${weatherIconBaseUrl}${data.weather[0].icon}@2x.png`;
        const windSpeed = data.wind.speed;
        const date = formatUnixTimestamp(data.dt);

        const leftHTML = `
            <h1 class="temperature">${temperature}°</h1>
            <div class="weather-icon-div">
            <p>${weatherMain}</p>
            <img src=${weatherIconUrl} />
            </div>
            <p>${date}</p>
        `

        const rightHTML = `
        <p>Humidity:${humidity}%</p>
        <p>Description:${weatherDescription}</p>
        <p>Wind Speed:${windSpeed}m/s</p>
        <p>Visibilty:${data.visibility / 1000}km</p>
        `
        leftDetail.innerHTML = leftHTML;
        rightDetail.innerHTML = rightHTML;
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}


function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}


function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchCurrentLocationWeather, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

getLocation();


const formatUnixTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);

    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };

    return date.toLocaleDateString(undefined, options);
};


const weatherIconBaseUrl = 'https://openweathermap.org/img/wn/';
getWeatherBtn.addEventListener('click', async () => {
    if (!inputCity.value) {
        alert("Enter the city name to get weather details");
        return;
    }

    forecastDetail.style.display = 'none';
    currentWeather.style.display = 'block';


    try {
        const response = await fetch(`http://localhost:3000/current/${inputCity.value}/${unit.value}`);
        const data = await response.json();
        console.log(data)
        const weatherIconUrl = `${weatherIconBaseUrl}${data.weather[0].icon}@2x.png`;
        const date = formatUnixTimestamp(data.dt);
        locationDetail.innerText = `${data.name}, ${data.sys.country}`

        const leftHTML = `
        <h1 class="temperature">${data.main.temp}°</h1>
        <div class="weather-icon-div">
        <p>${data.weather[0].main}</p>
        <img src=${weatherIconUrl} />
        </div>
        <p>${date}</p>
        `
        var speedunit;
        if (metric.value === 'imperial') {
            speedunit = 'miles/hr'
        }
        else {
            speedunit = 'm/s'
        }
        const rightHTML = `
        <p>Humidity:${data.main.humidity}%</p>
        <p>Description:${data.weather[0].description}</p>
        <p>Wind Speed:${data.wind.speed} ${speedunit}</p>
        <p>Visibilty:${data.visibility / 1000}km</p>
        `
        leftDetail.innerHTML = leftHTML;
        rightDetail.innerHTML = rightHTML;
    } catch (error) {
        alert("Enter a proper city name")
        console.error('Error fetching weather data:', error);
    }
})

getForecastBtn.addEventListener('click', async () => {

    currentWeather.style.display = 'none';
    forecastDetail.style.display = 'flex';
    if (!inputCity.value) {
        alert("Enter the city name to get forecast details");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/forecast/${inputCity.value}/${unit.value}`);
        const data = await response.json();
        locationDetail.innerText = `${data.city.name}, ${data.city.country}`
        if (data.list && data.list.length > 0) {
            const dailyForecast = filterDailyForecast(data.list);
            const averageTemperature = calculateAverageTemperature(dailyForecast);
            const forecastHTML = dailyForecast.map(item => {
                const date = formatUnixTimestamp(item.dt);
                const weatherIconUrl = `${weatherIconBaseUrl}${item.weather[0].icon}@2x.png`;
                return `
                    <div class='forecast-item'>
                        <p>${date}</p>
                        <h1 class="forecast-temp">${item.main.temp}°</h1>
                        <div>
                        <p>${item.weather[0].main}</p>
                        <img src=${weatherIconUrl} />
                        </div>
                    </div>
                `;
            }).join('');  // Join the HTML strings into a single string
            const avgTempHTML = `Average Temperature ${averageTemperature}°`
            avgTemp.innerText = avgTempHTML
            forecastDetail.innerHTML = forecastHTML;
        } else {
            console.error('Invalid forecast data format');
        }
    } catch (error) {
        alert("Enter a proper city name")
        console.error('Error fetching forecast data:', error);
    }
});

function filterDailyForecast(forecastList) {
    const dailyForecast = [];
    const uniqueDates = new Set();

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US');
        if (!uniqueDates.has(date)) {
            uniqueDates.add(date);
            dailyForecast.push(item);
        }
    });

    return dailyForecast;
}

const calculateAverageTemperature = (forecastList) => {
    const totalTemperature = forecastList.reduce((sum, item) => sum + item.main.temp, 0);
    const averageTemperature = totalTemperature / forecastList.length;
    return averageTemperature.toFixed(2);
};

