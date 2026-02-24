

export function calculateAirspeed(altitude) {
    // This is the logic isolated for clean testing
    return Math.min(450, 150 + (altitude / 100));
}

export function updateDisplay(altitude, airspeed) {
    document.getElementById('alt').innerText = altitude.toLocaleString();
    document.getElementById('spd').innerText = Math.floor(airspeed);
}