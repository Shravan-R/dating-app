const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "index.html";
}

let currentProfileIndex = 0;
let profiles = [];
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let isDragging = false;

// Load profiles
function loadProfiles() {
  const container = document.getElementById("profiles");
  container.innerHTML = `
    <div class="text-center text-white p-5">
      <div class="spinner-border text-primary" role="status" style="color: #ff6b9d !important;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading profiles...</p>
    </div>
  `;

  console.log("Loading profiles for user:", userId);
  console.log("API URL:", `${API_URL}/discover/${userId}`);

  fetch(`${API_URL}/discover/${userId}`)
    .then (async res => {
      console.log("Response status:", res.status);
      if (!res.ok) {
        return res.json().then(err => {
          console.error("API Error:", err);
          throw new Error(err.msg || `HTTP error! status: ${res.status}`);
        });
      }
      return res.json();
    })
    .then(data => {
      console.log("Received data:", data);
      console.log("Data type:", typeof data);
      console.log("Is array:", Array.isArray(data));
      
      // Validate response is an array
      if (!Array.isArray(data)) {
        console.error("Invalid response format, expected array:", data);
        throw new Error("Invalid response format");
      }
      
      // Filter out invalid entries and ensure all required fields exist
      // Note: Database query already filters null names, but we double-check here
      profiles = data.filter(user => {
        if (!user || user.id === undefined || user.id === null) {
          return false;
        }
        // Handle null or empty names
        if (!user.name || (typeof user.name === 'string' && user.name.trim() === '')) {
          console.warn("User with null/empty name filtered out:", user);
          return false;
        }
        // Check other required fields
        if (user.age === undefined || user.age === null || !user.gender) {
          console.warn("User with missing required fields filtered out:", user);
          return false;
        }
        return true;
      });
      
      console.log("Valid profiles:", profiles.length);
      
      if (profiles.length === 0) {
        container.innerHTML = `
          <div class="text-center text-white p-5">
            <h4>No more profiles to show!</h4>
            <p class="text-muted">Check back later for new matches.</p>
            <a href="matches.html" class="btn mt-3" style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); border: none; color: white; border-radius: 10px; padding: 10px 20px;">
              View Matches
            </a>
          </div>
        `;
      } else {
        currentProfileIndex = 0;
        showCurrentProfile();
      }
    })
    .catch(error => {
      console.error("Error loading profiles:", error);
      container.innerHTML = `
        <div class="text-center text-white p-5">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b9d; margin-bottom: 20px;"></i>
          <h4>Failed to load profiles</h4>
          <p class="text-muted mb-3">${error.message || "Please try again later"}</p>
          <button onclick="loadProfiles()" class="btn" style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); border: none; color: white; border-radius: 10px; padding: 10px 20px;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    });
}

function showCurrentProfile() {
  const container = document.getElementById("profiles");
  
  if (currentProfileIndex >= profiles.length) {
    container.innerHTML = `
      <div class="text-center text-white p-5">
        <h4>No more profiles to show!</h4>
        <p class="text-muted">Check back later for new matches.</p>
        <a href="matches.html" class="btn mt-3" style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); border: none; color: white; border-radius: 10px; padding: 10px 20px;">
          View Matches
        </a>
      </div>
    `;
    return;
  }

  const user = profiles[currentProfileIndex];
  
  // Validate user object
  if (!user || !user.id || !user.name) {
    console.error("Invalid user data:", user);
    currentProfileIndex++;
    if (currentProfileIndex < profiles.length) {
      showCurrentProfile();
    } else {
      container.innerHTML = `
        <div class="text-center text-white p-5">
          <h4>No more profiles to show!</h4>
          <p class="text-muted">Check back later for new matches.</p>
          <a href="matches.html" class="btn mt-3" style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); border: none; color: white; border-radius: 10px; padding: 10px 20px;">
            View Matches
          </a>
        </div>
      `;
    }
    return;
  }
  
  const userImage = user.image_url ? 
    `<img src="${user.image_url}" alt="${user.name}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #ff6b9d;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
    '';
  
  const avatarPlaceholder = `<div class="profile-avatar mb-3" style="width: 120px; height: 120px; margin: 0 auto; border-radius: 50%; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); display: ${user.image_url ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 48px; color: white; font-weight: bold;">
    ${user.name.charAt(0).toUpperCase()}
  </div>`;

  container.innerHTML = `
    <div class="profile-card" id="profileCard">
      <div class="card shadow-lg border-0" style="background: linear-gradient(135deg, #2a2a3e 0%, #1e1e2e 100%); border-radius: 20px; overflow: hidden; max-width: 400px; margin: 0 auto; position: relative; transition: transform 0.1s ease-out;">
        <div class="card-body p-4" style="min-height: 500px;">
          <div class="text-center mb-4">
            ${userImage}
            ${avatarPlaceholder}
            <h3 class="text-white fw-bold mb-2">${user.name}</h3>
            ${user.username ? `<p class="text-muted mb-1">@${user.username}</p>` : ''}
            <p class="text-muted mb-1">${user.age} years old</p>
            <p class="text-muted mb-2">${user.gender}</p>
            ${user.location ? `<p class="text-white-50 mb-2"><i class="fas fa-map-marker-alt me-1"></i>${user.location}</p>` : ''}
            ${user.bio ? `<p class="text-white-50 mb-2">${user.bio}</p>` : ''}
            ${user.hobbies ? `<p class="text-white-50 small mb-2"><i class="fas fa-heart me-1"></i>${user.hobbies}</p>` : ''}
            ${user.interests ? `<p class="text-white-50 small"><i class="fas fa-star me-1"></i>${user.interests}</p>` : ''}
          </div>
        </div>
        <div class="swipe-indicator" id="swipeIndicator" style="position: absolute; top: 20px; left: 20px; font-size: 32px; font-weight: bold; opacity: 0; transition: all 0.3s; z-index: 10; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          <i class="fas fa-heart"></i> LIKE
        </div>
        <div class="swipe-indicator" id="passIndicator" style="position: absolute; top: 20px; right: 20px; font-size: 32px; font-weight: bold; opacity: 0; transition: all 0.3s; z-index: 10; color: #ff6b9d; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          <i class="fas fa-times"></i> PASS
        </div>
      </div>
    </div>
  `;

  const profileCard = document.getElementById("profileCard");
  setupSwipeHandlers(profileCard);
}

function setupSwipeHandlers(card) {
  // Touch events
  card.addEventListener("touchstart", handleStart, { passive: true });
  card.addEventListener("touchmove", handleMove, { passive: true });
  card.addEventListener("touchend", handleEnd);

  // Mouse events for desktop
  card.addEventListener("mousedown", handleStart);
  card.addEventListener("mousemove", handleMove);
  card.addEventListener("mouseup", handleEnd);
  card.addEventListener("mouseleave", handleEnd);
}

function handleStart(e) {
  isDragging = true;
  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX;
  startY = touch.clientY;
  
  const card = document.getElementById("profileCard").querySelector(".card");
  card.style.transition = "none";
}

function handleMove(e) {
  if (!isDragging) return;
  
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  currentX = touch.clientX - startX;
  currentY = touch.clientY - startY;
  
  const card = document.getElementById("profileCard").querySelector(".card");
  const rotation = currentX * 0.15;
  const scale = 1 - Math.abs(currentX) / 1000; // Scale down as you drag
  
  card.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rotation}deg) scale(${Math.max(scale, 0.8)})`;
  
  // Show indicators with enhanced feedback
  const likeIndicator = document.getElementById("swipeIndicator");
  const passIndicator = document.getElementById("passIndicator");
  
  if (currentX > 50) {
    likeIndicator.style.opacity = Math.min(1, currentX / 150);
    likeIndicator.style.color = "#4ade80";
    likeIndicator.style.transform = `scale(${1 + currentX / 200})`;
    passIndicator.style.opacity = "0";
  } else if (currentX < -50) {
    passIndicator.style.opacity = Math.min(1, Math.abs(currentX) / 150);
    passIndicator.style.color = "#ff6b9d";
    passIndicator.style.transform = `scale(${1 + Math.abs(currentX) / 200})`;
    likeIndicator.style.opacity = "0";
  } else {
    likeIndicator.style.opacity = "0";
    likeIndicator.style.transform = "scale(1)";
    passIndicator.style.opacity = "0";
    passIndicator.style.transform = "scale(1)";
  }
}

function createParticles(x, y, color, count = 15) {
  const container = document.getElementById("profiles");
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.color = color;
    const angle = (Math.PI * 2 * i) / count;
    const velocity = 50 + Math.random() * 50;
    particle.style.setProperty("--tx", `${Math.cos(angle) * velocity}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * velocity}px`);
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

function handleEnd() {
  if (!isDragging) return;
  
  isDragging = false;
  const card = document.getElementById("profileCard").querySelector(".card");
  const threshold = 100;
  const cardRect = card.getBoundingClientRect();
  const centerX = cardRect.left + cardRect.width / 2;
  const centerY = cardRect.top + cardRect.height / 2;
  
  if (Math.abs(currentX) > threshold) {
    // Swipe action
    if (currentX > 0) {
      // Swipe right - Like
      createParticles(centerX, centerY, "#4ade80", 20);
      likeUser(profiles[currentProfileIndex].id);
    } else {
      // Swipe left - Pass
      createParticles(centerX, centerY, "#ff6b9d", 20);
      passUser();
    }
    
    // Enhanced animation with scale and rotation
    const exitX = currentX > 0 ? window.innerWidth + 200 : -window.innerWidth - 200;
    const exitRotation = currentX > 0 ? 30 : -30;
    
    card.style.transition = "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    card.style.transform = `translateX(${exitX}px) translateY(${currentY}px) rotate(${exitRotation}deg) scale(0.3)`;
    card.style.opacity = "0";
    
    setTimeout(() => {
      currentProfileIndex++;
      showCurrentProfile();
    }, 400);
  } else {
    // Snap back with bounce
    card.style.transition = "transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    card.style.transform = "translateX(0) translateY(0) rotate(0deg) scale(1)";
  }
  
  // Reset indicators
  const likeIndicator = document.getElementById("swipeIndicator");
  const passIndicator = document.getElementById("passIndicator");
  likeIndicator.style.opacity = "0";
  likeIndicator.style.transform = "scale(1)";
  passIndicator.style.opacity = "0";
  passIndicator.style.transform = "scale(1)";
  
  currentX = 0;
  currentY = 0;
}

function likeUser(toUser) {
  fetch(`${API_URL}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromUser: userId,
      toUser: toUser
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.match) {
        // Show match animation
        showMatchAnimation();
      }
    })
    .catch(error => {
      console.error("Error:", error);
    });
}

function passUser() {
  // Just move to next profile
  // You can track passes if needed
}

function showMatchAnimation() {
  const matchOverlay = document.createElement("div");
  matchOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s;
  `;
  
  matchOverlay.innerHTML = `
    <div class="text-center text-white">
      <h1 style="font-size: 72px; margin-bottom: 20px;">🎉</h1>
      <h2 class="fw-bold mb-3">It's a Match!</h2>
      <p class="text-muted mb-4">You both liked each other</p>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-lg" style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); border: none; color: white; border-radius: 10px; padding: 12px 30px;">
        Continue
      </button>
    </div>
  `;
  
  document.body.appendChild(matchOverlay);
  
  setTimeout(() => {
    matchOverlay.remove();
  }, 3000);
}

// Button handlers
function handleLike() {
  if (currentProfileIndex >= profiles.length) return;
  const toUser = profiles[currentProfileIndex].id;
  likeUser(toUser);
  currentProfileIndex++;
  showCurrentProfile();
}

function handlePass() {
  if (currentProfileIndex >= profiles.length) return;
  passUser();
  currentProfileIndex++;
  showCurrentProfile();
}

// Make functions globally available for button clicks
window.handleLike = handleLike;
window.handlePass = handlePass;

// Load profiles on page load
loadProfiles();
