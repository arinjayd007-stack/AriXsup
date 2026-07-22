const markerMe = document.getElementById('markerMe');
const markerHer = document.getElementById('markerHer');
const connectionLine = document.getElementById('connectionLine');
const connectionGlow = document.getElementById('connectionGlow');
const globeShell = document.getElementById('globeShell');
const distanceValue = document.getElementById('distanceValue');
const travelValue = document.getElementById('travelValue');
const closeValue = document.getElementById('closeValue');
const statusNote = document.getElementById('statusNote');
const grantLocationBtn = document.getElementById('grantLocationBtn');
const setHerBtn = document.getElementById('setHerBtn');
const setMeBtn = document.getElementById('setMeBtn');

let mePosition = null;
let herPosition = null;
let watcherId = null;
let isMe = true;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function latLonToPoint(lat, lon) {
    const x = 250 + (lon / 180) * 160;
    const y = 250 - (lat / 90) * 110;
    return { x, y };
}

function updateMarkers() {
    if (!mePosition || !herPosition) {
        markerMe.classList.toggle('hidden', !mePosition);
        markerHer.classList.toggle('hidden', !herPosition);
        connectionLine.setAttribute('d', '');
        connectionGlow.setAttribute('d', '');
        return;
    }

    const mePoint = latLonToPoint(mePosition.latitude, mePosition.longitude);
    const herPoint = latLonToPoint(herPosition.latitude, herPosition.longitude);

    markerMe.style.left = `${clamp(mePoint.x, 40, 460)}px`;
    markerMe.style.top = `${clamp(mePoint.y, 40, 460)}px`;
    markerHer.style.left = `${clamp(herPoint.x, 40, 460)}px`;
    markerHer.style.top = `${clamp(herPoint.y, 40, 460)}px`;
    markerMe.classList.remove('hidden');
    markerHer.classList.remove('hidden');

    const controlX = (mePoint.x + herPoint.x) / 2;
    const controlY = Math.min(mePoint.y, herPoint.y) - 70;
    const path = `M ${mePoint.x} ${mePoint.y} Q ${controlX} ${controlY} ${herPoint.x} ${herPoint.y}`;
    connectionLine.setAttribute('d', path);
    connectionGlow.setAttribute('d', path);
    updateSummary();
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
}

function updateSummary() {
    if (!mePosition || !herPosition) return;

    const distKm = getDistanceKm(mePosition.latitude, mePosition.longitude, herPosition.latitude, herPosition.longitude);
    const distMiles = distKm * 0.621371;
    distanceValue.textContent = `${distKm.toFixed(1)} km (${distMiles.toFixed(1)} mi)`;
    const flightHours = distKm / 850;
    const driveHours = distKm < 1200 ? distKm / 80 : null;
    travelValue.innerHTML = `✈️ Flight: ${flightHours.toFixed(1)} hr` + (driveHours ? ` <br>🚗 Drive: ${driveHours.toFixed(1)} hr` : ``);
    closeValue.textContent = `You are only ${distKm.toFixed(1)} km away, but always close to my heart ❤️`;
    statusNote.textContent = 'Live locations are active. The globe rotates to keep your markers in view.';
}

function startRotation() {
    let rotation = 0;
    window.requestAnimationFrame(function animate() {
        rotation += 0.02;
        globeShell.style.transform = `rotateY(${rotation}deg)`;
        window.requestAnimationFrame(animate);
    });
}

function setLocation(role, position) {
    if (role === 'me') {
        mePosition = position;
    } else {
        herPosition = position;
    }
    updateMarkers();
}

function handlePosition(position) {
    if (isMe) {
        setLocation('me', position.coords);
        localStorage.setItem('ourWorldMe', JSON.stringify(position.coords));
    } else {
        setLocation('her', position.coords);
        localStorage.setItem('ourWorldHer', JSON.stringify(position.coords));
    }
}

function handleError() {
    statusNote.textContent = 'Location permission denied or unavailable. Please refresh and allow access.';
}

function loadSavedPositions() {
    const storedMe = localStorage.getItem('ourWorldMe');
    const storedHer = localStorage.getItem('ourWorldHer');
    if (storedMe) {
        mePosition = JSON.parse(storedMe);
    }
    if (storedHer) {
        herPosition = JSON.parse(storedHer);
    }
    updateMarkers();
}

grantLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        statusNote.textContent = 'Geolocation is not supported by your browser.';
        return;
    }
    watcherId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
    });
});

setHerBtn.addEventListener('click', () => {
    isMe = false;
    grantLocationBtn.textContent = 'Grant Her Location';
    statusNote.textContent = 'Now the next permission belongs to her device. Open this page on her phone.';
});

setMeBtn.addEventListener('click', () => {
    isMe = true;
    grantLocationBtn.textContent = 'Grant My Location';
    statusNote.textContent = 'Now the next permission belongs to your device. Open this page on your phone.';
});

window.addEventListener('load', () => {
    loadSavedPositions();
    startRotation();
});