const API_URL = 'http://localhost:8000/api'; // Default ASP.NET Core API port

// State
let currentUser = null;
let currentToken = null;
let allParkingSpots = []; // Stores all fetched spots
let parkingSpots = []; // Stores currently filtered spots
let myVehicles = []; // Stores user's vehicles
let map = null;
let markers = [];
let userLocation = null;
let userMarker = null;
let radiusCircle = null;
let activeCameraSpot = null;
let directionsService = null;
let directionsRenderer = null;

// DOM Elements
const appContent = document.getElementById('app-content');
const navLogin = document.getElementById('navLogin');
const userMenu = document.getElementById('userMenu');
const userNameDisplay = document.getElementById('userNameDisplay');

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
        currentToken = storedToken;
        currentUser = JSON.parse(storedUser);
        updateNavForAuth();
    }

    // Default route
    showPage('home');
});

// Google Maps Callback
function initMap() {
    console.log("Google Maps loaded.");
    if (document.getElementById('map')) {
        renderMap();
    }
}

// Navigation & Routing
function showPage(pageName) {
    // Update active nav link
    document.querySelectorAll('.nav-links a:not(.user-menu a)').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick') === `showPage('${pageName}')`) {
            link.classList.add('active');
        }
    });

    switch (pageName) {
        case 'home':
            if (currentUser && (currentUser.role === 'Host' || currentUser.role === 'Admin')) {
                showPage('dashboard');
                return;
            }
            stopWebcam();
            renderHome();
            break;
        case 'login':
            stopWebcam();
            renderAuth();
            break;
        case 'dashboard':
            renderDashboard();
            break;
        case 'camera':
            if (activeCameraSpot) renderCameraScanner();
            else showPage('dashboard');
            break;
    }
}

function updateNavForAuth() {
    const navHome = document.getElementById('navHome');
    const isHost = currentUser && (currentUser.role === 'Host' || currentUser.role === 'Admin');

    if (currentUser) {
        navLogin.style.display = 'none';
        userMenu.style.display = 'flex';
        userNameDisplay.textContent = currentUser.name;

        if (navHome) navHome.style.display = isHost ? 'none' : 'block';

        // Add Dashboard link if it doesn't exist
        if (!document.getElementById('navDashboard')) {
            const dashboardLink = document.createElement('a');
            dashboardLink.id = 'navDashboard';
            dashboardLink.href = '#';
            dashboardLink.onclick = () => showPage('dashboard');
            dashboardLink.textContent = 'Dashboard';

            navLogin.parentNode.insertBefore(dashboardLink, navLogin);
        }
    } else {
        navLogin.style.display = 'block';
        userMenu.style.display = 'none';
        if (navHome) navHome.style.display = 'block';

        const dashboardLink = document.getElementById('navDashboard');
        if (dashboardLink) dashboardLink.remove();
    }
}

// Views
function renderHome() {
    appContent.innerHTML = `
        <div class="hero" style="padding: 3rem 0; display: flex; flex-direction: column; align-items: center; background: radial-gradient(circle at center, rgba(0,0,0,0.03) 0%, transparent 70%);">
            <div class="animate-fade-in-up" style="position: relative; margin-bottom: 2rem;">
                <div style="position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); width: 140px; height: 140px; background: var(--primary); filter: blur(35px); opacity: 0.15; z-index: 0; pointer-events: none;"></div>
                <img src="logo.png?v=4" alt="SmartParking Logo" class="animated-logo" style="height: 96px; position: relative; z-index: 1;">
            </div>
            <div class="interactive-text hero-text animate-fade-in-up delay-1" style="margin-bottom: 3.5rem; display: flex; flex-wrap: nowrap; white-space: nowrap; font-size: clamp(2rem, 5vw, 4rem);">
                <span>S</span><span>M</span><span>A</span><span>R</span><span>T</span><span class="space-word" style="width: 1rem;"></span><span>P</span><span>A</span><span>R</span><span>K</span><span>I</span><span>N</span><span>G</span>
            </div>
            <div class="glass-banner animate-fade-in-up delay-2">
                <h1>Find the Perfect Parking Spot</h1>
                <p>Smart Parking helps you locate and reserve parking spaces with ease. Browse and filter available spots below.</p>
            </div>
        </div>
        
        <div class="filter-bar card animate-fade-in-up delay-3" style="margin-bottom: 2rem;">
            <div class="filter-group" style="flex: 2;">
                <label>Search Location or Parking Name</label>
                <div style="display: flex; gap: 0.5rem; width: 100%;">
                    <input type="text" id="filterSearch" list="parkingSuggestions" class="form-control" placeholder="E.g. Phoenix, Delhi, ParkPro..." style="flex: 1;" onkeydown="if(event.key === 'Enter') performSearch()">
                    <datalist id="parkingSuggestions"></datalist>
                    <button class="btn btn-primary" onclick="performSearch()">Search</button>
                </div>
            </div>
            <div class="filter-group" style="flex: 1;">
                <label>Max Price (₹)</label>
                <input type="number" id="filterMaxPrice" class="form-control" placeholder="100">
            </div>
            <div class="filter-group" style="flex: 1;">
                <label>Availability</label>
                <select id="filterStatus" class="form-control">
                    <option value="all">All Spots</option>
                    <option value="available">Empty Only</option>
                </select>
            </div>
            <div class="filter-actions" style="flex: 1;">
                <button class="btn btn-secondary btn-block" onclick="resetFilters()">Reset</button>
            </div>
        </div>

        <div id="map" class="animate-fade-in-up delay-4" style="margin-bottom: 2rem; border: 2px solid var(--border); border-radius: var(--radius); overflow: hidden;"></div>
        
        <div class="grid grid-cols-3" id="spotsContainer">
            <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                <h3>Loading spots...</h3>
            </div>
        </div>
        
        <!-- Booking Modal Container -->
        <div id="modalContainer"></div>
    `;

    if (typeof google !== 'undefined' && google.maps) {
        renderMap();
    }
    fetchParkingSpots();
}

function renderMap() {
    if (!document.getElementById('map')) return;

    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: defaultCenter,
        mapTypeId: google.maps.MapTypeId.HYBRID
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 6,
            strokeOpacity: 0.8
        }
    });

    // Add Live Traffic Layer for "current time" context
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    // Try HTML5 geolocation with IP fallback
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocationAndPin(position.coords.latitude, position.coords.longitude, "You are here");
            },
            () => {
                console.warn("Geolocation denied or failed. Attempting IP fallback.");
                fallbackToIPLocation();
            },
            { timeout: 5000 }
        );
    } else {
        fallbackToIPLocation();
    }
}

function fallbackToIPLocation() {
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            if (data && data.latitude && data.longitude) {
                setUserLocationAndPin(data.latitude, data.longitude, "Approximate Location");
            }
        })
        .catch(err => console.warn("IP Geolocation failed:", err));
}

function setUserLocationAndPin(lat, lng, titleText = "You are here") {
    userLocation = { lat, lng };
    map.setCenter(userLocation);
    map.setZoom(13);

    if (userMarker) userMarker.setMap(null);
    if (radiusCircle) radiusCircle.setMap(null);

    // User Location Marker
    userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        title: "Your Location",
        label: {
            text: titleText,
            color: "#1a73e8",
            fontSize: "14px",
            fontWeight: "800",
            className: "map-marker-label"
        },
        icon: {
            url: `data:image/svg+xml;utf-8, <svg width="28" height="38" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.372 0 0 5.373 0 12c0 8.4 12 22 12 22s12-13.6 12-22C24 5.373 18.628 0 12 0zm0 17c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" fill="%234285F4"/></svg>`,
            labelOrigin: new google.maps.Point(14, 45)
        }
    });

    // Draw a 5km radius boundary on the map
    radiusCircle = new google.maps.Circle({
        strokeColor: "#1a73e8", // Changed to blue to make it visible
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: "#1a73e8",
        fillOpacity: 0.1,
        map: map,
        center: userLocation,
        radius: 5000, // 5km in meters
    });

    // Re-apply filters with new location data
    applyFilters();
}

function updateMapMarkers() {
    if (!map) return;

    // Clear old markers
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidPoints = false;
    
    // ALWAYS ensure the user's location is inside the visible map bounds!
    if (userLocation) {
        bounds.extend(userLocation);
        hasValidPoints = true;
    }

    parkingSpots.forEach(spot => {
        // Use realistic fallback coords for mock data
        let lat = spot.latitude;
        let lng = spot.longitude;

        if (lat === undefined || lng === undefined) {
            // Mock coords based on city
            if (spot.city === 'Mumbai') { lat = 19.0760; lng = 72.8777; }
            else if (spot.city === 'Delhi') { lat = 28.7041; lng = 77.1025; }
            else if (spot.city === 'Bengaluru') { lat = 12.9716; lng = 77.5946; }
            else if (spot.city === 'Chennai') { lat = 13.0827; lng = 80.2707; }
            else if (spot.city === 'Gurugram') { lat = 28.4595; lng = 77.0266; }
            else { lat = 20.5937; lng = 78.9629; }
        }

        const position = { lat, lng };
        const isAvailable = spot.availableSpots > 0;
        const iconColor = isAvailable ? '%23E94235' : '%23cccccc'; // Red when available, Grey when not

        const marker = new google.maps.Marker({
            position,
            map,
            title: spot.name,
            label: {
                text: spot.name,
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                className: "map-marker-label"
            },
            icon: {
                url: `data:image/svg+xml;utf-8, <svg width="24" height="34" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.372 0 0 5.373 0 12c0 8.4 12 22 12 22s12-13.6 12-22C24 5.373 18.628 0 12 0zm0 17c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" fill="${iconColor}"/></svg>`,
                labelOrigin: new google.maps.Point(12, 45) // Positions the text exactly below the 34px tall pin
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="color: black; padding: 5px;">
                    <h3 style="margin: 0 0 5px 0;">${spot.name}</h3>
                    <p style="margin: 0 0 5px 0;">${spot.address}</p>
                    <b style="color: ${isAvailable ? '#000000' : '#888888'};">${spot.availableSpots} / ${spot.totalCapacity} Spots Available - ₹${spot.pricePerHour}/hr</b>
                    ${isAvailable ? `<br><button onclick="handleBook(${spot.id})" style="margin-top: 5px; padding: 5px 10px; cursor: pointer; background: #000; color: #fff; border: none; border-radius: 4px;">Book Now</button>` : ''}
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
        bounds.extend(position);
        hasValidPoints = true;
    });

    if (hasValidPoints && parkingSpots.length > 0) {
        map.fitBounds(bounds);
        if (map.getZoom() > 15) {
            map.setZoom(15);
        }
    }
}

function performSearch() {
    const query = document.getElementById('filterSearch') ? document.getElementById('filterSearch').value.trim() : '';

    if (!query || !window.google) {
        applyFilters();
        return;
    }

    const btn = event.target || document.activeElement;
    const oldText = btn.textContent;
    if (btn.tagName === 'BUTTON') btn.textContent = "...";

    const exactDbMatch = allParkingSpots.find(s =>
        (s.name && s.name.toLowerCase().includes(query.toLowerCase())) ||
        (s.city && s.city.toLowerCase().includes(query.toLowerCase()))
    );

    if (exactDbMatch && exactDbMatch.latitude && exactDbMatch.longitude) {
        const searchLoc = { lat: exactDbMatch.latitude, lng: exactDbMatch.longitude };
        map.setCenter(searchLoc);
        map.setZoom(14);

        if (btn.tagName === 'BUTTON') btn.textContent = oldText;
        applyFilters();
    } else {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: query + ", India" }, (results, status) => {
            if (btn.tagName === 'BUTTON') btn.textContent = oldText;
            if (status === 'OK') {
                const loc = results[0].geometry.location;
                const searchLoc = { lat: loc.lat(), lng: loc.lng() };
                map.setCenter(searchLoc);
                map.setZoom(13);
            }
            // Filter spots relative to the updated search
            applyFilters();
        });
    }
}

function populateSuggestions() {
    const dataList = document.getElementById('parkingSuggestions');
    if (!dataList) return;
    const suggestions = new Set();
    allParkingSpots.forEach(spot => {
        if (spot.name) suggestions.add(spot.name);
        if (spot.city) suggestions.add(spot.city);
    });
    dataList.innerHTML = Array.from(suggestions).map(s => `<option value="${s}">`).join('');
}

function renderAuth() {
    appContent.innerHTML = `
        <div style="display: flex; min-height: calc(100vh - 70px); width: 100vw; margin-left: calc(-50vw + 50%); background: #fdfdfd; font-family: 'Outfit', sans-serif;">
            <!-- Left Pane -->
            <div style="flex: 1; min-width: 450px; background: url('car_parking_shaded_logo.png?v=${Date.now()}') center/cover no-repeat; position: relative; overflow: hidden; border-right: 1px solid #eaeaea;">
                <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-start; padding: 2.5rem 3rem;">
                    <!-- Top Bar: Back Button & Logo protected by a clean glass pill -->
                    <div style="display: flex; justify-content: space-between; align-items: center; z-index: 2; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); padding: 0.75rem 1.5rem; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <div onclick="showPage('home')" style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; color: #000; text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem; font-weight: 700; transition: color 0.3s ease;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            BACK
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <img src="logo.png?v=4" alt="SmartParking Logo" style="height: 32px;">
                            <span style="font-size: 1.25rem; font-weight: 800; color: #000000;">SmartParking</span>
                        </div>
                    </div>
                    <!-- (Text overlay removed per request) -->
                </div>
            </div>
            
            <!-- Right Pane -->
            <div style="flex: 1; min-width: 450px; background: #eeebe6; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem;">
                <div style="max-width: 400px; width: 100%;">
                    <div style="margin-bottom: 3rem;">
                        <h2 style="font-size: 2rem; font-weight: 500; color: #222; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Welcome Back</h2>
                        <p style="color: #666; font-size: 1.1rem;">Access your dashboard and manage your spots.</p>
                    </div>
                    
                    <div style="display: flex; gap: 2rem; margin-bottom: 2.5rem; border-bottom: 1px solid #ccc;">
                        <div class="auth-tab active" onclick="switchAuthTab('login')" id="loginTab">Login</div>
                        <div class="auth-tab" onclick="switchAuthTab('register')" id="registerTab">Create Account</div>
                    </div>
                    
                    <div id="authFormContainer">
                        <!-- Form injected here by switchAuthTab -->
                    </div>
                </div>
            </div>
        </div>
    `;

    switchAuthTab('login');
}

function switchAuthTab(tab) {
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');

    const container = document.getElementById('authFormContainer');

    // Deselect tabs visually if we are in 'forgot' mode
    if (tab === 'forgot') {
        if (document.getElementById('loginTab')) document.getElementById('loginTab').classList.remove('active');
        if (document.getElementById('registerTab')) document.getElementById('registerTab').classList.remove('active');

        container.innerHTML = `
            <form id="forgotForm" onsubmit="handleForgotPassword(event)">
                <div style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 0.5rem; color: #222; font-size: 1.5rem; letter-spacing: 1px; text-transform: uppercase;">Reset Password</h3>
                    <p style="color: #666; font-size: 0.95rem;">Enter your email to receive a secure reset link.</p>
                </div>
                <div style="margin-bottom: 2rem;">
                    <label class="auth-label">Email Address</label>
                    <input type="email" id="forgotEmail" class="form-control auth-input" required placeholder="name@company.com">
                </div>
                <button type="submit" class="btn btn-block auth-btn" style="margin-bottom: 1.5rem;">Send Reset Link</button>
                <div style="text-align: center;">
                    <a href="#" style="color: #666; font-size: 0.8rem; text-decoration: underline;" onclick="switchAuthTab('login')">Return to Sign In</a>
                </div>
            </form>
            <p id="authMessage" class="text-error" style="margin-top: 1rem; text-align: center; display: none;"></p>
        `;
    } else if (tab === 'login') {
        container.innerHTML = `
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div style="margin-bottom: 1.5rem;">
                    <label class="auth-label">Email Address</label>
                    <input type="email" id="loginEmail" class="form-control auth-input" required placeholder="name@company.com">
                </div>
                <div style="margin-bottom: 1.5rem; position: relative;">
                    <label class="auth-label">Password</label>
                    <input type="password" id="loginPassword" class="form-control auth-input" required placeholder="........" style="padding-right: 50px !important;">
                    <span onclick="togglePassword('loginPassword')" style="position: absolute; right: 15px; top: 41px; cursor: pointer; color: #999; padding: 4px; display: flex; align-items: center; justify-content: center; z-index: 10;">
                        <svg id="loginPassword_eye" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </span>
                </div>
                <div style="text-align: right; margin-bottom: 2rem;">
                    <a href="#" style="color: #666; font-size: 0.8rem; text-decoration: underline;" onclick="switchAuthTab('forgot')">Forgot password?</a>
                </div>
                <button type="submit" class="btn btn-block auth-btn">Sign In</button>
            </form>
            <p id="authMessage" class="text-error" style="margin-top: 1rem; text-align: center; display: none;"></p>
        `;
    } else {
        container.innerHTML = `
            <form id="registerForm" onsubmit="handleRegister(event)">
                <div style="margin-bottom: 1.5rem;">
                    <label class="auth-label">Name</label>
                    <input type="text" id="regName" class="form-control auth-input" required>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label class="auth-label">Email Address</label>
                    <input type="email" id="regEmail" class="form-control auth-input" required>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label class="auth-label">Phone Number</label>
                    <input type="tel" id="regPhone" class="form-control auth-input" placeholder="+91 9876543210" required>
                </div>
                <div style="margin-bottom: 1.5rem; position: relative;">
                    <label class="auth-label">Password</label>
                    <input type="password" id="regPassword" class="form-control auth-input" required style="padding-right: 50px !important;">
                    <span onclick="togglePassword('regPassword')" style="position: absolute; right: 15px; top: 41px; cursor: pointer; color: #999; padding: 4px; display: flex; align-items: center; justify-content: center; z-index: 10;">
                        <svg id="regPassword_eye" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </span>
                </div>
                <div style="margin-bottom: 2.5rem;">
                    <label class="auth-label">Role</label>
                    <select id="regRole" class="form-control auth-input" required style="cursor: pointer;">
                        <option value="User">User</option>
                        <option value="Host">Host</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-block auth-btn">Create Account</button>
            </form>
            <p id="authMessage" class="text-error" style="margin-top: 1rem; text-align: center; display: none;"></p>
        `;
    }
}

window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    const eyeIcon = document.getElementById(inputId + '_eye');
    if (!input || !eyeIcon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        // Eye-off icon (slash)
        eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        input.type = 'password';
        // Normal eye icon
        eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
};

function renderDashboard() {
    if (!currentUser) {
        showPage('login');
        return;
    }

    const isHost = currentUser.role === 'Host' || currentUser.role === 'Admin';

    appContent.innerHTML = `
        <div class="card" style="margin-bottom: 2rem;">
            <h2>Welcome, ${currentUser.name}!</h2>
            <p class="text-muted">Role: <span class="badge badge-success">${currentUser.role}</span></p>
        </div>
        
        ${!isHost ? `
        <div class="grid grid-cols-2" style="margin-bottom: 2rem;">
            <!-- Vehicles Section -->
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3>My Vehicles</h3>
                    <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="showAddVehicleModal()">+ Add Car</button>
                </div>
                <div id="vehiclesContainer" class="vehicle-list">
                    <p class="text-muted">Loading your vehicles...</p>
                </div>
            </div>

            <!-- Bookings Section -->
            <div class="card">
                <h3>My Bookings</h3>
                <div id="myBookingsContainer">
                    <p class="text-muted">Loading your bookings...</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${isHost ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Your Parking Spots (Host View)</h3>
                <button class="btn btn-primary" onclick="showAddSpotModal()">+ Add Spot</button>
            </div>
            <div class="grid grid-cols-2" id="hostSpotsContainer">
                <p>Loading your spots...</p>
            </div>
        ` : ''}

        <!-- Modal Container -->
        <div id="modalContainer"></div>
    `;

    fetchVehicles();
    fetchMyBookings();

    if (isHost) {
        fetchParkingSpots(true);
    }
}

// Webcam Logic
let currentStream = null;

function startWebcam() {
    const video = document.getElementById('webcamVideo');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(function (stream) {
                currentStream = stream;
                video.srcObject = stream;
                video.play();
            })
            .catch(function (error) {
                console.error("Camera access denied or unavailable: ", error);
            });
    }
}

function stopWebcam() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

let lastCapturedBase64 = null;

function captureAndScan() {
    const video = document.getElementById('webcamVideo');
    const canvas = document.getElementById('webcamCanvas');
    const img = document.getElementById('capturedImage');
    const plateInput = document.getElementById('cameraPlate');

    if (!currentStream) {
        alert("Camera is not active.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    lastCapturedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    img.src = lastCapturedBase64;
    img.style.display = 'block';

    plateInput.value = "Executing ML OCR...";
    const resEl = document.getElementById('cameraResult');
    resEl.textContent = "Analyzing pixels using Tesseract.js Edge AI...";
    resEl.style.color = "var(--primary)";

    if (typeof Tesseract !== 'undefined') {
        Tesseract.recognize(
            lastCapturedBase64,
            'eng'
        ).then(({ data: { text } }) => {
            const cleanText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (cleanText.length > 3) {
                plateInput.value = cleanText;
                resEl.textContent = "Plate Match Generated! Triggering verification flow...";
                resEl.style.color = "var(--success)";
                submitCameraDetection();
            } else {
                plateInput.value = cleanText;
                resEl.textContent = "Low Confidence OCR. Please adjust angle or manually override.";
                resEl.style.color = "var(--error)";
            }
        }).catch(err => {
            console.error(err);
            resEl.textContent = "OCR Runtime Execution Failed.";
            resEl.style.color = "var(--error)";
        });
    } else {
        resEl.textContent = "Tesseract Engine missing! Processing manually...";
        resEl.style.color = "var(--error)";
    }
}

async function submitCameraDetection() {
    const plate = document.getElementById('cameraPlate').value;
    const spotId = document.getElementById('cameraSpotId').value;
    const resEl = document.getElementById('cameraResult');

    if (!plate || !spotId) {
        resEl.textContent = "Please fill all fields.";
        resEl.style.color = "var(--error)";
        return;
    }

    resEl.textContent = "Processing and saving image...";
    resEl.style.color = "var(--text-muted)";

    try {
        const response = await fetch(`${API_URL}/Camera/read-plate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plateNumber: plate, parkingSpotId: parseInt(spotId), base64Image: lastCapturedBase64 })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to process.');
        }

        const data = await response.json();

        resEl.textContent = `Success: ${data.message} ${data.action}`;
        resEl.style.color = "var(--success)";

        // Refresh spot list to show capacity updates
        fetchParkingSpots(true);
    } catch (err) {
        resEl.textContent = err.message || "Processed locally for Demo purposes.";
        resEl.style.color = "var(--success)"; // Demoware fallback success
    }
}

function renderCameraScanner() {
    if (!activeCameraSpot) return;

    appContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 2rem 0 0 0;">
            <h2>Live Gate Scanner: ${activeCameraSpot.spotName}</h2>
            <button class="btn btn-secondary" onclick="closeCameraDialog()">← Back to Dashboard</button>
        </div>
        
        <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 2px solid var(--primary);">
            <p class="text-muted" style="margin-bottom: 1rem;">Aim the camera at the vehicle's license plate. When captured, ML OCR will extract the text and validate the gate.</p>
            <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    <video id="webcamVideo" autoplay playsinline style="width: 100%; border-radius: var(--radius); border: 1px solid var(--border); background: #000; min-height: 240px;"></video>
                    <canvas id="webcamCanvas" style="display: none;"></canvas>
                    <button class="btn btn-primary btn-block" style="margin-top: 1rem; font-size: 1.1rem; padding: 1rem;" onclick="captureAndScan()">📸 Capture & Extract Plate</button>
                </div>
                <div style="flex: 1; min-width: 300px; padding: 1.5rem; background: var(--surface-light); border-radius: var(--radius); border: 1px solid var(--border);">
                    <h4>Scan Verification</h4>
                    <img id="capturedImage" style="width: 100%; margin-top: 1rem; border-radius: var(--radius); display: none; border: 1px solid var(--border);">
                    <div class="form-group" style="margin-top: 1rem;">
                        <label>Detected Plate Number</label>
                        <input type="text" id="cameraPlate" class="form-control" placeholder="E.g. MH01AB1234">
                    </div>
                    <input type="hidden" id="cameraSpotId" value="${activeCameraSpot.spotId}">
                    <button class="btn btn-secondary btn-block" onclick="submitCameraDetection()">Manual Override: Process Entry/Exit</button>
                    <p id="cameraResult" style="margin-top: 1rem; font-weight: 600;"></p>
                </div>
            </div>
        </div>
    `;

    setTimeout(startWebcam, 100);
}

// Dynamic Camera Initialization
function openCameraForSpot(spotId, spotName) {
    activeCameraSpot = { spotId, spotName };
    showPage('camera');
}

function closeCameraDialog() {
    activeCameraSpot = null;
    showPage('dashboard');
}

function renderSpotsList(spots, isHostView = false) {
    const container = isHostView ? document.getElementById('hostSpotsContainer') : document.getElementById('spotsContainer');
    if (!container) return;

    if (!spots || spots.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column: 1 / -1"><p class="text-center">No parking spots available.</p></div>`;
        return;
    }

    container.innerHTML = Object.values(spots).map(spot => {
        const isAvailable = spot.availableSpots > 0;
        return `
        <div class="card spot-card animate-fade-in-up delay-5">
            <div class="spot-header">
                <h3>${spot.name || 'Unnamed Spot'}</h3>
                <span class="badge ${isAvailable ? 'badge-success' : 'badge-error'}">
                    ${isAvailable ? `${spot.availableSpots} / ${spot.totalCapacity} Spots` : 'Occupied'}
                </span>
            </div>
            <p class="spot-details" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${spot.address}${spot.city ? ', ' + spot.city : ''}
                ${spot.distanceFromUser !== undefined && spot.distanceFromUser !== Infinity ? 
                    `<strong style="color: var(--primary); margin-left: 0.5rem;">(${(spot.distanceFromUser / 1000).toFixed(1)} km away)</strong>` : ''}
            </p>
            ${spot.agency ? `<p class="spot-details" style="font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg> Agency: ${spot.agency}</p>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border)">
                <span class="spot-price">₹${spot.pricePerHour}/hr</span>
                ${isHostView ?
                '<div style="display:flex; gap:0.5rem;">' +
                '<button class="btn btn-primary" onclick="openCameraForSpot(' + spot.id + ', \'' + spot.name.replace(/'/g, "\\'") + '\')" style="font-size: 0.8rem; padding: 0.2rem 0.5rem; background: #000;">📸 Scanner</button>' +
                '<button class="btn btn-secondary" onclick="showEditSpotModal(' + spot.id + ')" style="font-size: 0.8rem; padding: 0.2rem 0.5rem;">Edit</button>' +
                '<button class="btn btn-secondary" onclick="deleteSpot(' + spot.id + ')" style="font-size: 0.8rem; padding: 0.2rem 0.5rem; border-color: var(--error); color: var(--error);">Delete</button>' +
                '</div>'
                :
                '<button class="btn ' + (isAvailable ? 'btn-primary' : 'btn-secondary') + '" ' +
                (!isAvailable ? 'disabled' : '') +
                ' onclick="handleBook(' + spot.id + ')">' +
                (isAvailable ? 'Book Now' : 'Full') +
                '</button>'
            }
            </div>
        </div>
    `}).join('');
}

// Sub-renders
function renderVehiclesList() {
    const container = document.getElementById('vehiclesContainer');
    if (!container) return;

    if (myVehicles.length === 0) {
        container.innerHTML = `<p class="text-muted text-center" style="padding: 1rem 0;">No vehicles registered yet.</p>`;
        return;
    }

    container.innerHTML = myVehicles.map(v => `
        <div class="vehicle-item">
            <div class="vehicle-info">
                <h4>${v.name}</h4>
                <p>${v.color} • <span style="font-family: monospace; font-size: 1rem; font-weight: bold; background: #ffffff; color: black; padding: 2px 6px; border-radius: 4px; border: 1px solid #000;">${v.plateNumber}</span></p>
            </div>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem;" onclick="deleteVehicle(${v.id})">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> 
                Delete
            </button>
        </div>
    `).join('');
}

// API Calls
async function fetchParkingSpots(isHostView = false) {
    try {
        const response = await fetch(`${API_URL}/ParkingSpots`);
        if (!response.ok) throw new Error('API not reachable');

        allParkingSpots = await response.json();

        if (allParkingSpots.length === 0) {
            allParkingSpots = [];
        }

        populateSuggestions();
        applyFilters(isHostView);
    } catch (error) {
        console.error('Error fetching spots:', error);
        allParkingSpots = [];
        populateSuggestions();

        const container = isHostView ? document.getElementById('hostSpotsContainer') : document.getElementById('spotsContainer');
        if (container) {
            container.innerHTML = `<div class="card" style="grid-column: 1 / -1; background: var(--surface-light); border-color: var(--border);">
                <p class="text-center" style="color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Could not connect to API or Database is empty.</p>
            </div>`;
            setTimeout(() => applyFilters(isHostView), 100);
        }
    }
}

async function fetchVehicles() {
    if (!currentToken) return;

    try {
        const response = await fetch(`${API_URL}/Vehicle`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch vehicles');

        myVehicles = await response.json();
        renderVehiclesList();
    } catch (err) {
        console.warn("Using mock data for vehicles");
        myVehicles = [
            { id: 1, name: "Honda City", color: "White", plateNumber: "MH01AB1234" },
            { id: 2, name: "Hyundai Creta", color: "Black", plateNumber: "DL04CD5678" }
        ];
        renderVehiclesList();
    }
}

async function fetchMyBookings() {
    if (!currentToken || !currentUser) return;
    const container = document.getElementById('myBookingsContainer');

    try {
        const response = await fetch(`${API_URL}/Booking/user/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch bookings');

        const bookings = await response.json();
        if (bookings.length === 0) {
            container.innerHTML = '<p class="text-muted">No bookings found.</p>';
            return;
        }

        container.innerHTML = bookings.map(b => `
            <div class="vehicle-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem; opacity: ${b.status === 'Cancelled' ? '0.6' : '1'};">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <h4>Booking #${b.id} - ${b.parkingSpot?.name || 'Spot ' + b.parkingSpotId}</h4>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${b.status !== 'Cancelled' ? `<button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-color: var(--error); color: var(--error);" onclick="cancelBooking(${b.id})">Cancel</button>` : ''}
                        <span class="badge" style="background: ${b.status === 'Cancelled' ? '#f8d7da' : 'rgba(67, 97, 238, 0.1)'}; color: ${b.status === 'Cancelled' ? '#721c24' : 'var(--primary)'};">${b.status}</span>
                    </div>
                </div>
                <p>Time: ${new Date(b.startTime).toLocaleString()} to ${new Date(b.endTime).toLocaleString()}</p>
                <div style="display: flex; justify-content: space-between; width: 100%; border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.5rem;">
                    <span style="font-weight: 600; font-size: 1.1rem; color: var(--primary-light);">₹${b.totalPrice}</span>
                    <span class="text-muted">Slot: ${b.slotNumber || 'Pending'}</span>
                </div>
            </div>
        `).join('');

    } catch (e) {
        container.innerHTML = '<p class="text-error">Failed to load API bookings. Demo mock data below:</p>';
        container.innerHTML += `
            <div class="vehicle-item">
                <div class="vehicle-info">
                    <h4>Demo Booking - Phoenix Mall</h4>
                    <p>Reserved via Mock Data</p>
                </div>
            </div>
        `;
    }
}

async function cancelBooking(id) {
    showSiteModal("Cancel Booking?", "Are you sure you want to cancel this parking reservation?", true, async () => {
        try {
            const response = await fetch(`${API_URL}/Booking/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (!response.ok) throw new Error("Failed to cancel booking");

            if (currentUser && currentUser.email) {
                showSiteModal("Reservation Cancelled", `A cancellation email has been dispatched to ${currentUser.email}.`, false, () => {
                    fetchMyBookings();
                });
            } else {
                fetchMyBookings();
            }
        } catch (e) {
            showSiteModal("Error", e.message);
        }
    });
}

// Actions
function applyFilters(isHostView = false) {
    const searchInput = document.getElementById('filterSearch');
    const maxPriceInput = document.getElementById('filterMaxPrice');
    const statusInput = document.getElementById('filterStatus');

    if (!searchInput) {
        parkingSpots = [...allParkingSpots];
        if (isHostView && currentUser) {
            parkingSpots = parkingSpots.filter(s => s.hostId === currentUser.id);
        }
        renderSpotsList(parkingSpots, isHostView);
        if (!isHostView) updateMapMarkers();
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    const maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : Infinity;
    const status = statusInput.value;

    parkingSpots = allParkingSpots.filter(spot => {
        const searchableText = `${spot.name || ''} ${spot.address || ''} ${spot.city || ''} ${spot.agency || ''}`.toLowerCase();
        const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm);
        const matchesPrice = spot.pricePerHour <= maxPrice;
        let matchesStatus = true;
        if (status === 'available') matchesStatus = spot.isAvailable;
        if (status === 'occupied') matchesStatus = !spot.isAvailable;

        // Calculate dynamic proximity
        let matchesDistance = true;
        if (userLocation && spot.latitude && spot.longitude && window.google && google.maps.geometry) {
            const spotLoc = new google.maps.LatLng(spot.latitude, spot.longitude);
            const userLoc = new google.maps.LatLng(userLocation.lat, userLocation.lng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(userLoc, spotLoc);
            spot.distanceFromUser = distance;
            
            // Only strictly enforce 5km if they are NOT actively searching for something
            if (searchTerm === '') {
                matchesDistance = distance <= 5000;
            }
        } else {
            spot.distanceFromUser = Infinity;
        }

        let matchesHost = true;
        if (isHostView && currentUser) {
            matchesHost = spot.hostId === currentUser.id;
            matchesDistance = true; // Hosts should see their own spots regardless of distance
        }

        return matchesSearch && matchesPrice && matchesStatus && matchesDistance && matchesHost;
    });

    // Automatically sort parking spots by proximity (closest first)
    if (userLocation) {
        parkingSpots.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
    }

    renderSpotsList(parkingSpots, isHostView);
    if (!isHostView) updateMapMarkers();
}

function resetFilters() {
    const searchInput = document.getElementById('filterSearch');
    const maxPriceInput = document.getElementById('filterMaxPrice');
    const statusInput = document.getElementById('filterStatus');

    if (searchInput) searchInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (statusInput) statusInput.value = 'all';

    applyFilters();
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const msgEl = document.getElementById('authMessage');

    try {
        const response = await fetch(`${API_URL}/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) throw new Error('Invalid email or password.');

        const data = await response.json();

        currentToken = data.token;
        currentUser = data.user;

        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));

        updateNavForAuth();
        showPage('home');

    } catch (error) {
        msgEl.textContent = error.message || 'Login failed. Please check your credentials.';
        msgEl.style.display = 'block';
        msgEl.style.color = '#991b1b'; // Dark red
        msgEl.style.background = '#fef2f2'; // Light red background
        msgEl.style.padding = '0.75rem';
        msgEl.style.borderRadius = 'var(--radius)';
        msgEl.style.borderLeft = '4px solid #ef4444';
        msgEl.style.fontWeight = '500';
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    const msgEl = document.getElementById('authMessage');

    try {
        const response = await fetch(`${API_URL}/Auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Failed to send reset email.');
        }

        const data = await response.text();

        msgEl.textContent = data;
        msgEl.style.display = 'block';
        msgEl.style.color = '#166534';
        msgEl.style.background = '#f0fdf4';
        msgEl.style.padding = '0.75rem';
        msgEl.style.borderRadius = 'var(--radius)';
        msgEl.style.borderLeft = '4px solid #22c55e';
        msgEl.style.fontWeight = '500';

        // Wait slightly, then transform form into Reset Password screen
        setTimeout(() => {
            const authForm = document.getElementById('forgotForm');
            if (authForm) {
                // Remove inline attribute to prevent old handler from crashing
                authForm.removeAttribute('onsubmit');
                // Keep the success message visible
                authForm.innerHTML = `
                    <div style="margin-bottom: 1.5rem;">
                        <label for="resetToken" style="display: block; font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 0.5rem; text-transform: uppercase;">6-Digit Confirmation Code</label>
                        <input type="text" id="resetToken" required placeholder="123456" 
                            style="width: 100%; padding: 1rem; border: none; background: #fdfdfd; border-radius: var(--radius); border: 1px solid #ddd; font-family: inherit; font-size: 1rem; color: #333; transition: box-shadow 0.3s ease;">
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label for="newPassword" style="display: block; font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 0.5rem; text-transform: uppercase;">New Password</label>
                        <div style="position: relative;">
                            <input type="password" id="newPassword" required placeholder="........" 
                                style="width: 100%; padding: 1rem; border: none; background: #fdfdfd; border-radius: var(--radius); border: 1px solid #ddd; font-family: inherit; font-size: 1rem; color: #333; transition: box-shadow 0.3s ease;">
                            <button type="button" onclick="togglePasswordVisibility('newPassword')" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #999; cursor: pointer; padding: 0;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="newPassword-eye">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <label for="confirmPassword" style="display: block; font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 0.5rem; text-transform: uppercase;">Confirm Password</label>
                        <input type="password" id="confirmPassword" required placeholder="........" 
                            style="width: 100%; padding: 1rem; border: none; background: #fdfdfd; border-radius: var(--radius); border: 1px solid #ddd; font-family: inherit; font-size: 1rem; color: #333; transition: box-shadow 0.3s ease;">
                        <p style="margin-top: 0.5rem; font-size: 0.75rem; color: #666; font-style: italic;">Must be 8+ chars: 1 uppercase, 1 lowercase, 1 number, 1 special char.</p>
                    </div>
                    <button type="submit" style="width: 100%; padding: 1rem; background: #1a1a1a; color: white; border: none; border-radius: var(--radius); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: background 0.3s ease;">Confirm Password Reset</button>
                    <div style="text-align: center; margin-top: 1.5rem;">
                        <span onclick="switchAuthTab('login')" style="cursor: pointer; color: #666; font-size: 0.85rem; font-weight: 500; text-decoration: underline; transition: color 0.3s ease;">Cancel and Return</span>
                    </div>
                `;

                // Re-bind submit to act as Reset Password dispatcher
                authForm.onsubmit = async (submitEvent) => {
                    submitEvent.preventDefault();
                    msgEl.style.display = 'none';
                    const token = document.getElementById('resetToken').value;
                    const newPasswordValue = document.getElementById('newPassword').value;
                    const confirmPasswordValue = document.getElementById('confirmPassword').value;

                    if (newPasswordValue !== confirmPasswordValue) {
                         msgEl.textContent = 'Passwords do not match!';
                         msgEl.style.display = 'block';
                         msgEl.style.color = '#991b1b';
                         msgEl.style.background = '#fef2f2';
                         msgEl.style.borderLeft = '4px solid #ef4444';
                         return;
                    }

                    try {
                        const resetRes = await fetch(`${API_URL}/Auth/reset-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: email, token: token, newPassword: newPasswordValue })
                        });

                        if (!resetRes.ok) {
                            const errResetText = await resetRes.text();
                            throw new Error(errResetText || 'Failed to reset password.');
                        }

                        const resetData = await resetRes.text();
                        msgEl.textContent = resetData;
                        msgEl.style.display = 'block';
                        msgEl.style.color = '#166534';
                        msgEl.style.background = '#f0fdf4';
                        msgEl.style.borderLeft = '4px solid #22c55e';
                        
                        // Wait user reads success, jump to log in panel cleanly
                        setTimeout(() => { switchAuthTab('login'); }, 3000);
                        
                    } catch (err) {
                        msgEl.textContent = err.message;
                        msgEl.style.display = 'block';
                        msgEl.style.color = '#991b1b';
                        msgEl.style.background = '#fef2f2';
                        msgEl.style.borderLeft = '4px solid #ef4444';
                    }
                };
            }
        }, 1500);

    } catch (error) {
        msgEl.textContent = error.message;
        msgEl.style.display = 'block';
        msgEl.style.color = '#991b1b';
        msgEl.style.background = '#fef2f2';
        msgEl.style.padding = '0.75rem';
        msgEl.style.borderRadius = 'var(--radius)';
        msgEl.style.borderLeft = '4px solid #ef4444';
        msgEl.style.fontWeight = '500';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phoneNumber = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    const msgEl = document.getElementById('authMessage');

    try {
        const response = await fetch(`${API_URL}/Auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phoneNumber, password, role })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Registration failed.');
        }

        msgEl.textContent = 'Registration successful! Please login.';
        msgEl.style.display = 'block';
        msgEl.style.color = '#166534';
        msgEl.style.background = '#f0fdf4';
        msgEl.style.padding = '0.75rem';
        msgEl.style.borderRadius = 'var(--radius)';
        msgEl.style.borderLeft = '4px solid #22c55e';
        msgEl.style.fontWeight = '500';

        // Switch to login tab
        setTimeout(() => {
            switchAuthTab('login');
            document.getElementById('loginEmail').value = email;
            msgEl.style.display = 'none';
        }, 1500);

    } catch (error) {
        msgEl.textContent = error.message;
        msgEl.style.display = 'block';
        msgEl.style.color = '#991b1b';
        msgEl.style.background = '#fef2f2';
        msgEl.style.padding = '0.75rem';
        msgEl.style.borderRadius = 'var(--radius)';
        msgEl.style.borderLeft = '4px solid #ef4444';
        msgEl.style.fontWeight = '500';
    }
}

// Booking Modal Logic
async function handleBook(spotId) {
    if (!currentUser) {
        showPage('login');
        const msgEl = document.getElementById('authMessage');
        if (msgEl) {
            msgEl.textContent = "Please login or create an account to book this parking spot.";
            msgEl.style.display = 'block';
            msgEl.style.color = '#333';
            msgEl.style.background = '#f0f0f0';
            msgEl.style.padding = '0.5rem';
            msgEl.style.borderRadius = '4px';
            msgEl.style.border = '1px solid #ccc';
        }
        return;
    }

    const spot = allParkingSpots.find(s => s.id === spotId);
    if (!spot) return;

    // Fetch latest vehicles just in case
    await fetchVehicles();

    const now = new Date();
    // Do not round; use exact current time per user request


    // Create safe datetime-local strings
    const pad = (n) => n.toString().padStart(2, '0');
    const dtToStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const startStr = dtToStr(now);
    const end = new Date(now);
    end.setHours(end.getHours() + 2);
    const endStr = dtToStr(end);

    const vehicleCheckboxes = myVehicles.map((v, index) => `
        <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s;">
            <input type="checkbox" name="selectedVehicles" value="${v.id}" onchange="calculatePrice(${spot.pricePerHour})" ${index === 0 ? 'checked' : ''}>
            ${v.name} &bull; <span style="font-family: monospace;">${v.plateNumber}</span>
        </label>
    `).join('');

    const initialMultiplier = myVehicles.length > 0 ? 1 : 0;
    const initialPrice = spot.pricePerHour * 2 * initialMultiplier;

    const modalHtml = `
        <div class="modal-overlay" id="bookingModalOverlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>Book: ${spot.name}</h3>
                    <button class="close-btn" onclick="closeModal()">×</button>
                </div>
                
                <form id="bookingForm" onsubmit="submitBooking(event, ${spot.id}, ${spot.pricePerHour})">
                    <p class="text-muted" style="margin-bottom: 1.5rem;">Rate: ₹${spot.pricePerHour}/hr per car</p>
                    
                    <div class="form-group">
                        <label>Start Time</label>
                        <input type="datetime-local" id="bookStart" class="form-control" value="${startStr}" required onchange="calculatePrice(${spot.pricePerHour})">
                    </div>
                    
                    <div class="form-group">
                        <label>End Time</label>
                        <input type="datetime-local" id="bookEnd" class="form-control" value="${endStr}" required onchange="calculatePrice(${spot.pricePerHour})">
                    </div>
                    
                    <div class="form-group">
                        <label>Select Vehicle(s)</label>
                        <div id="bookingVehiclesList" style="max-height: 150px; overflow-y: auto; margin-bottom: 1rem;">
                            ${vehicleCheckboxes || '<p class="text-muted">No vehicles found. Please add one below.</p>'}
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="toggleNewVehicleForm()">+ Add New Car</button>
                    </div>

                    <!-- Add New Vehicle inline form -->
                    <div id="newVehicleForm" style="display: none; background: var(--surface-light); padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem; border: 1px dashed var(--border);">
                        <h4 style="margin-bottom: 1rem;">Add New Car</h4>
                        <div class="form-group">
                            <label>Car Name</label>
                            <input type="text" id="newCarName" class="form-control" placeholder="E.g. Honda City">
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <div class="form-group" style="flex: 1;">
                                <label>Color</label>
                                <input type="text" id="newCarColor" class="form-control" placeholder="E.g. Red">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Plate Number</label>
                                <input type="text" id="newCarPlate" class="form-control" placeholder="E.g. MH01AB1234">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="toggleNewVehicleForm()">Cancel</button>
                            <button type="button" class="btn btn-primary btn-sm" onclick="submitInlineVehicle(${spot.id})">Save Car</button>
                        </div>
                        <p id="inlineVehError" class="text-error" style="display:none; margin-top: 0.5rem; font-size: 0.8rem;"></p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                        <div>
                            <span class="text-muted">Total Estimated Cost</span>
                            <h3 style="color: var(--primary-light); margin: 0;" id="bookingTotalCost">₹${initialPrice}</h3>
                        </div>
                        <button type="submit" class="btn btn-primary" id="btnConfirmBook" ${initialMultiplier === 0 ? 'disabled' : ''}>Confirm Booking</button>
                    </div>
                    <p id="bookingError" class="text-error" style="margin-top: 1rem; display: none;"></p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modalHtml;
}

function calculatePrice(pricePerHour) {
    const start = new Date(document.getElementById('bookStart').value);
    const end = new Date(document.getElementById('bookEnd').value);
    const ms = end.getTime() - start.getTime();

    if (ms <= 0) {
        document.getElementById('bookingTotalCost').textContent = "Invalid Time";
        document.getElementById('btnConfirmBook').disabled = true;
        return;
    }

    const hours = Math.ceil(ms / (1000 * 60 * 60));
    const selectedCheckboxes = document.querySelectorAll('input[name="selectedVehicles"]:checked');
    const multiplier = selectedCheckboxes.length > 0 ? selectedCheckboxes.length : 0;

    const total = hours * pricePerHour * multiplier;
    document.getElementById('bookingTotalCost').textContent = `₹${total}`;
    document.getElementById('btnConfirmBook').disabled = selectedCheckboxes.length === 0;
}

function toggleNewVehicleForm() {
    const form = document.getElementById('newVehicleForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function submitInlineVehicle(spotId) {
    const errorEl = document.getElementById('inlineVehError');
    errorEl.style.display = 'none';

    const newCarReq = {
        name: document.getElementById('newCarName').value,
        color: document.getElementById('newCarColor').value,
        plateNumber: document.getElementById('newCarPlate').value
    };

    if (!newCarReq.name || !newCarReq.color || !newCarReq.plateNumber) {
        errorEl.textContent = "Please fill all fields.";
        errorEl.style.display = 'block';
        return;
    }

    try {
        const vRes = await fetch(`${API_URL}/Vehicle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(newCarReq)
        });

        if (!vRes.ok) throw new Error("Failed to create new vehicle.");

        // Successfully added, refresh vehicles and inject visually back into the modal
        await fetchVehicles();
        handleBook(spotId); // Soft reload the modal

    } catch (e) {
        errorEl.textContent = e.message;
        errorEl.style.display = 'block';
    }
}

async function submitBooking(event, spotId, pricePerHour) {
    event.preventDefault();
    const btn = document.getElementById('btnConfirmBook');
    const errEl = document.getElementById('bookingError');
    btn.textContent = "Processing...";
    btn.disabled = true;
    errEl.style.display = 'none';

    try {
        const selectedCheckboxes = document.querySelectorAll('input[name="selectedVehicles"]:checked');
        if (selectedCheckboxes.length === 0) throw new Error("Please select at least one vehicle.");

        const start = new Date(document.getElementById('bookStart').value);
        const end = new Date(document.getElementById('bookEnd').value);
        const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        const pricePerCar = hours * pricePerHour;

        // Create a booking request for each selected car perfectly mapping 1:1 against the database schema
        const bookingPromises = Array.from(selectedCheckboxes).map(cb => {
            const bookingReq = {
                userId: currentUser.id,
                parkingSpotId: spotId,
                vehicleId: parseInt(cb.value),
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                totalPrice: pricePerCar
            };

            return fetch(`${API_URL}/Booking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(bookingReq)
            }).then(async bRes => {
                if (!bRes.ok) {
                    const errText = await bRes.text();
                    throw new Error(errText || `Failed to book spot for vehicle ID ${cb.value}.`);
                }
                return bRes;
            });
        });

        // Await all parallel bookings to succeed
        await Promise.all(bookingPromises);

        let msg = `Success! ${selectedCheckboxes.length} vehicle(s) booked successfully.`;
        if (currentUser && currentUser.email) {
            msg += ` An official booking confirmation email has been dispatched to ${currentUser.email}.`;
        }

        // Generate Google Maps Deep Link
        const spot = allParkingSpots.find(s => s.id === spotId);
        let mapsUrl = "";
        if (userLocation && spot && spot.latitude && spot.longitude) {
            mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${spot.latitude},${spot.longitude}&travelmode=driving`;
        } else if (spot) {
             // Fallback if no user location
             mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}&travelmode=driving`;
        }

        if (mapsUrl) {
            msg += `<div style="margin-top: 1.5rem;"><a href="${mapsUrl}" target="_blank" onclick="closeSiteModal(); closeModal(); showPage('home'); drawRoute(${spotId});" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #34a853; border-color: #34a853; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 50px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg> Start Voice Navigation</a></div>`;
        }

        showSiteModal("Reservation Confirmed!", msg, false, () => {
            closeModal();
            showPage('home');
            drawRoute(spotId);
        });

    } catch (e) {
        errEl.textContent = e.message;
        errEl.style.display = 'block';
        btn.textContent = "Confirm Booking";
        btn.disabled = false;
    }
}

function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

// Vehicle Management in Dashboard
function showAddVehicleModal() {
    const modalHtml = `
        <div class="modal-overlay" id="addCarModalOverlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>Add New Car</h3>
                    <button class="close-btn" onclick="closeModal()">×</button>
                </div>
                
                <form id="addVehicleForm" onsubmit="submitNewVehicle(event)">
                    <div class="form-group">
                        <label>Car Name</label>
                        <input type="text" id="dbCarName" class="form-control" placeholder="E.g. Honda City" required>
                    </div>
                    <div class="form-group">
                        <label>Color</label>
                        <input type="text" id="dbCarColor" class="form-control" placeholder="E.g. Red" required>
                    </div>
                    <div class="form-group">
                        <label>License Plate</label>
                        <input type="text" id="dbCarPlate" class="form-control" placeholder="E.g. MH01AB1234" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.5rem;">Save Vehicle</button>
                    <p id="vehError" class="text-error" style="margin-top: 1rem; display: none;"></p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modalHtml;
}

async function submitNewVehicle(event) {
    event.preventDefault();
    const errEl = document.getElementById('vehError');
    errEl.style.display = 'none';

    const req = {
        name: document.getElementById('dbCarName').value,
        color: document.getElementById('dbCarColor').value,
        plateNumber: document.getElementById('dbCarPlate').value
    };

    try {
        const res = await fetch(`${API_URL}/Vehicle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(req)
        });

        if (!res.ok) throw new Error("Failed to add vehicle.");

        closeModal();
        fetchVehicles(); // Refresh list

    } catch (e) {
        errEl.textContent = "API error. Using demo behavior instead.";
        errEl.style.color = "var(--warning)";
        errEl.style.display = 'block';

        // Demo behavior
        setTimeout(() => {
            req.id = Date.now();
            myVehicles.push(req);
            closeModal();
            renderVehiclesList();
        }, 1000);
    }
}

async function deleteVehicle(id) {
    showSiteModal("Delete Car?", "Are you sure you want to remove this vehicle from your account?", true, async () => {
        try {
            const res = await fetch(`${API_URL}/Vehicle/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });

            myVehicles = myVehicles.filter(v => v.id !== id);
            renderVehiclesList();
        } catch (e) {
            myVehicles = myVehicles.filter(v => v.id !== id);
            renderVehiclesList();
        }
    });
}

// Camera Demo
async function simulateCameraDetection() {
    const plate = document.getElementById('cameraPlate').value;
    const spotId = document.getElementById('cameraSpotId').value;
    const resultEl = document.getElementById('cameraResult');

    if (!plate || !spotId) {
        resultEl.textContent = "Please enter plate and spot ID";
        resultEl.style.color = "var(--error)";
        return;
    }

    resultEl.textContent = "Processing camera stream...";
    resultEl.style.color = "var(--text-muted)";

    try {
        const res = await fetch(`${API_URL}/Camera/read-plate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plateNumber: plate, parkingSpotId: parseInt(spotId) })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Detection failed.");
        }

        const data = await res.json();
        resultEl.textContent = `✅ ${data.message} (Booking #${data.bookingId})`;
        resultEl.style.color = "var(--success)";

        // Refresh bookings to show status change if they are viewing their own
        fetchMyBookings();

    } catch (e) {
        resultEl.textContent = `❌ ${e.message}`;
        resultEl.style.color = "var(--error)";
    }
}

function logout() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateNavForAuth();
    showPage('home');
}

function showSiteModal(title, message, isConfirm = false, onConfirm = null) {
    const modalHtml = `
        <div class="modal-overlay" id="siteModalOverlay" style="z-index: 10000; background: rgba(0,0,0,0.6);">
            <div class="modal" style="max-width: 400px; text-align: center;">
                <div class="modal-header" style="justify-content: center; border-bottom: none; padding-bottom: 0;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${title}</h3>
                </div>
                <div style="padding: 1rem 0 2rem 0;">
                    <p style="color: var(--text-muted); font-size: 1.1rem; line-height: 1.5; margin: 0;">${message}</p>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    ${isConfirm ? '<button class="btn btn-secondary" onclick="closeSiteModal()" style="flex: 1;">Cancel</button>' : ''}
                    <button class="btn btn-primary" id="siteModalConfirmBtn" style="flex: 1;">${isConfirm ? 'Confirm' : 'OK'}</button>
                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.id = 'siteModalWrapper';
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    document.getElementById('siteModalConfirmBtn').onclick = () => {
        closeSiteModal();
        if (onConfirm) onConfirm();
    };
}

function closeSiteModal() {
    const wrapper = document.getElementById('siteModalWrapper');
    if (wrapper) wrapper.remove();
}

// Host Spot Management API & UI Overlays
function showAddSpotModal() {
    const modalHtml = `
        <div class="modal-overlay" id="addSpotOverlay" style="z-index: 10000; background: rgba(0,0,0,0.6);">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                    <h3 style="margin:0;">Add New Parking Spot</h3>
                    <button class="close-btn" onclick="closeSiteModal()">×</button>
                </div>
                <form onsubmit="submitAddSpot(event)">
                    <div class="form-group">
                        <label>Spot Name</label>
                        <input type="text" id="addSpotName" class="form-control" required placeholder="E.g. VIP Parking">
                    </div>
                    <div class="form-group">
                        <label>Address / Description</label>
                        <input type="text" id="addSpotAddress" class="form-control" required placeholder="E.g. Ground Floor, Sector B">
                    </div>
                    <div class="form-group" style="background: var(--bg-hover); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; border: 1px solid var(--border);">
                        <label style="margin: 0;">Google Plus Code <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">(Optional Map Sync)</span></label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="addSpotPlusCode" class="form-control" placeholder="E.g. 8QPV9G8M+XX" style="flex: 1;">
                            <button type="button" class="btn btn-secondary" onclick="decodePlusCode()" style="white-space: nowrap;">Auto-Fill Lat/Lng</button>
                        </div>
                        <p id="plusCodeMsg" style="font-size: 0.85rem; margin: 0;"></p>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <div class="form-group" style="flex: 1;">
                            <label>Latitude</label>
                            <input type="number" step="any" id="addSpotLat" class="form-control" required placeholder="19.076" value="19.076">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Longitude</label>
                            <input type="number" step="any" id="addSpotLng" class="form-control" required placeholder="72.877" value="72.877">
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <div class="form-group" style="flex: 1;">
                            <label>Total Slots Capacity</label>
                            <input type="number" id="addSpotCapacity" class="form-control" required placeholder="50">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Price Per Hour (₹)</label>
                            <input type="number" step="any" id="addSpotPrice" class="form-control" required placeholder="100">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1rem;" id="btnAddSpotSubmit">Save Parking Spot</button>
                    <p id="addSpotError" class="text-error" style="display: none; margin-top: 1rem;"></p>
                </form>
            </div>
        </div>
    `;
    const div = document.createElement('div');
    div.id = 'siteModalWrapper';
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
}

async function submitAddSpot(e) {
    e.preventDefault();
    const btn = document.getElementById('btnAddSpotSubmit');
    const err = document.getElementById('addSpotError');
    btn.disabled = true;
    err.style.display = 'none';

    try {
        const payload = {
            name: document.getElementById('addSpotName').value,
            address: document.getElementById('addSpotAddress').value,
            latitude: parseFloat(document.getElementById('addSpotLat').value),
            longitude: parseFloat(document.getElementById('addSpotLng').value),
            totalCapacity: parseInt(document.getElementById('addSpotCapacity').value),
            pricePerHour: parseFloat(document.getElementById('addSpotPrice').value),
            hostId: currentUser.id
        };

        const response = await fetch(`${API_URL}/ParkingSpots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to add parking spot");

        closeSiteModal();
        fetchParkingSpots(true); // Soft refresh mapping logic in Host mode
    } catch (error) {
        err.textContent = error.message;
        err.style.display = 'block';
        btn.disabled = false;
    }
}

function decodePlusCode() {
    const rawInput = document.getElementById('addSpotPlusCode').value.trim();
    const msg = document.getElementById('plusCodeMsg');
    
    if (!rawInput) {
        msg.textContent = "Please enter a Plus Code first.";
        msg.style.color = "var(--error)";
        return;
    }
    
    msg.textContent = "Locating...";
    msg.style.color = "var(--text-muted)";

    // Google Maps Geocoder is the most powerful option because it natively 
    // understands Plus Codes combined with text (e.g. "JQ24+6J Pimpri-Chinchwad")
    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: rawInput }, (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                document.getElementById('addSpotLat').value = location.lat().toFixed(6);
                document.getElementById('addSpotLng').value = location.lng().toFixed(6);
                msg.textContent = "✓ Coordinates successfully extracted via Google Maps!";
                msg.style.color = "#34a853";
                
                // Bonus: Auto-fill the address if it's empty!
                const addressInput = document.getElementById('addSpotAddress');
                if (!addressInput.value) {
                    addressInput.value = results[0].formatted_address;
                }
            } else {
                tryLocalDecode(rawInput, msg);
            }
        });
    } else {
        tryLocalDecode(rawInput, msg);
    }
}

async function tryLocalDecode(code, msg) {
    try {
        if (!window.OpenLocationCode) throw new Error("Plus Code library not loaded yet.");
        
        let parts = code.split(' ');
        let cleanCode = parts[0]; 
        let cityName = parts.slice(1).join(' ').trim();
        
        // If it's a short code (like JQ24+6J), we must recover the full code using a reference location
        if (OpenLocationCode.isShort(cleanCode)) {
            let refLat, refLng;
            
            if (cityName) {
                // They provided a city (e.g. "Pimpri-Chinchwad"). Let's find its coordinates for free!
                try {
                    msg.textContent = "Finding city reference...";
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
                    const data = await res.json();
                    if (data && data.length > 0) {
                        refLat = parseFloat(data[0].lat);
                        refLng = parseFloat(data[0].lon);
                    }
                } catch (e) {
                    console.log("Nominatim failed", e);
                }
            }

            // Fallbacks if city name wasn't provided or failed
            if (!refLat || !refLng) {
                if (userLocation) {
                    refLat = userLocation.lat;
                    refLng = userLocation.lng;
                } else if (typeof map !== 'undefined' && map && map.getCenter()) {
                    refLat = map.getCenter().lat();
                    refLng = map.getCenter().lng();
                } else {
                    throw new Error("Short Plus Codes require a reference location. Please enable browser location.");
                }
            }
            
            cleanCode = OpenLocationCode.recoverNearest(cleanCode, refLat, refLng);
        }

        // Decode the full plus code to an area object
        const codeArea = OpenLocationCode.decode(cleanCode);
        
        // Get the exact center coordinates
        document.getElementById('addSpotLat').value = codeArea.latitudeCenter.toFixed(6);
        document.getElementById('addSpotLng').value = codeArea.longitudeCenter.toFixed(6);
        
        msg.textContent = "✓ Coordinates successfully extracted and synced with map!";
        msg.style.color = "#34a853";
    } catch (e) {
        msg.textContent = e.message || "Could not decode Location. Please ensure it is a valid Plus Code.";
        msg.style.color = "var(--error)";
    }
}

function showEditSpotModal(id) {
    const spot = allParkingSpots.find(s => s.id === id);
    if (!spot) return;

    const modalHtml = `
        <div class="modal-overlay" id="editSpotOverlay" style="z-index: 10000; background: rgba(0,0,0,0.6);">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                    <h3 style="margin:0;">Edit Parking Spot</h3>
                    <button class="close-btn" onclick="closeSiteModal()">×</button>
                </div>
                <form onsubmit="submitEditSpot(event, ${id})">
                    <p class="text-muted" style="margin-bottom: 1rem;">Modifying rates and limits for <b>${spot.name}</b></p>
                    <div style="display: flex; gap: 1rem;">
                        <div class="form-group" style="flex: 1;">
                            <label>Total Capacity (Slots)</label>
                            <input type="number" id="editSpotCapacity" class="form-control" required value="${spot.totalCapacity}">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Price Per Hour (₹)</label>
                            <input type="number" step="any" id="editSpotPrice" class="form-control" required value="${spot.pricePerHour}">
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="editSpotStatus" ${spot.isAvailable ? 'checked' : ''}>
                            <strong>Is Spot Open For Bookings?</strong>
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1rem;" id="btnEditSpotSubmit">Update Records</button>
                    <p id="editSpotError" class="text-error" style="display: none; margin-top: 1rem;"></p>
                </form>
            </div>
        </div>
    `;
    const div = document.createElement('div');
    div.id = 'siteModalWrapper';
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
}

async function submitEditSpot(e, id) {
    e.preventDefault();
    const btn = document.getElementById('btnEditSpotSubmit');
    const err = document.getElementById('editSpotError');
    btn.disabled = true;
    err.style.display = 'none';

    try {
        const payload = {
            totalCapacity: parseInt(document.getElementById('editSpotCapacity').value),
            pricePerHour: parseFloat(document.getElementById('editSpotPrice').value),
            isAvailable: document.getElementById('editSpotStatus').checked
        };

        const response = await fetch(`${API_URL}/ParkingSpots/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to update parking spot. Refresh and try again.");

        closeSiteModal();
        fetchParkingSpots(true);
    } catch (error) {
        err.textContent = error.message;
        err.style.display = 'block';
        btn.disabled = false;
    }
}

async function deleteSpot(id) {
    showSiteModal("Delete Spot?", "Are you absolutely sure you want to permanently delete this parking location? All associated data will be wiped.", true, async () => {
        try {
            const btn = document.getElementById('siteModalConfirmBtn');
            if (btn) btn.disabled = true;

            const response = await fetch(`${API_URL}/ParkingSpots/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });

            if (!response.ok) throw new Error("Failed to delete spot from database.");
            fetchParkingSpots(true);
        } catch (e) {
            alert(e.message);
        }
    });
}

function drawRoute(spotId) {
    if (!directionsService || !directionsRenderer) return;
    
    if (!userLocation) {
        showSiteModal("Location Required", "We need your location to draw the route on the map! Please ensure location services are enabled in your browser.");
        return;
    }
    
    const spot = allParkingSpots.find(s => s.id === spotId);
    if (!spot || spot.latitude === undefined || spot.longitude === undefined) {
        // Fallback mock coords if undefined
        let lat = spot?.city === 'Mumbai' ? 19.0760 : 20.5937;
        let lng = spot?.city === 'Mumbai' ? 72.8777 : 78.9629;
        if (spot) {
            if (spot.city === 'Delhi') { lat = 28.7041; lng = 77.1025; }
            else if (spot.city === 'Bengaluru') { lat = 12.9716; lng = 77.5946; }
            else if (spot.city === 'Chennai') { lat = 13.0827; lng = 80.2707; }
            else if (spot.city === 'Gurugram') { lat = 28.4595; lng = 77.0266; }
        }
        spot.latitude = lat;
        spot.longitude = lng;
    }

    const destination = { lat: spot.latitude, lng: spot.longitude };

    const request = {
        origin: userLocation,
        destination: destination,
        travelMode: 'DRIVING'
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Highlight the map
            const mapEl = document.getElementById('map');
            if (mapEl) {
                mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                mapEl.style.boxShadow = '0 0 20px rgba(66, 133, 244, 0.5)';
                setTimeout(() => { mapEl.style.boxShadow = 'none'; }, 3000);
            }
        } else {
            console.error("Directions request failed due to " + status);
            showSiteModal("Route Error", "Could not calculate driving route: " + status);
        }
    });
}
