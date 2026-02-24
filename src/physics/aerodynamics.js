

export function calculateAirspeed(altitude) {
    // Airspeed increases with altitude but caps at 450 KTS
    return Math.min(450, 150 + (altitude / 100));
}

export function updateDisplay(altitude, airspeed) {
    const altSpan = document.getElementById('alt');
    const spdSpan = document.getElementById('spd');
    
    if (altSpan) altSpan.innerText = altitude.toLocaleString();
    if (spdSpan) spdSpan.innerText = Math.floor(airspeed);
}