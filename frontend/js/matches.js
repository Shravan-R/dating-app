const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "index.html";
}

function loadMatches() {
  fetch(`${API_URL}/matches/${userId}`)
    .then(res => res.json())
    .then(matches => {
      const container = document.getElementById("matchesContainer");
      
      if (matches.length === 0) {
        container.innerHTML = `
          <div class="text-center text-white p-5">
            <i class="fas fa-heart-broken" style="font-size: 64px; color: #ff6b9d; margin-bottom: 20px;"></i>
            <h4 class="mb-3">No matches yet</h4>
            <p class="text-muted mb-4">Start swiping to find your match!</p>
            <a href="discover.html" class="btn" style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); border: none; color: white; border-radius: 10px; padding: 12px 30px;">
              <i class="fas fa-search"></i> Discover People
            </a>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="row g-3">
          ${matches.map(match => `
            <div class="col-12 col-md-6 col-lg-4">
              <div class="card match-card shadow-lg border-0" style="background: linear-gradient(135deg, #2a2a3e 0%, #1e1e2e 100%); border-radius: 15px; cursor: pointer;" onclick="openChat(${match.id})">
                <div class="card-body p-4 text-center">
                  <div class="match-avatar mb-3">
                    ${match.name.charAt(0).toUpperCase()}
                  </div>
                  <h5 class="text-white fw-bold mb-2">${match.name}</h5>
                  <p class="text-muted mb-1">${match.age} years old</p>
                  <p class="text-muted mb-3">${match.gender}</p>
                  ${match.bio ? `<p class="text-white-50 small mb-3">${match.bio}</p>` : ''}
                  <button class="btn btn-sm w-100" style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); border: none; color: white; border-radius: 10px;">
                    <i class="fas fa-comment"></i> Chat
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    })
    .catch(error => {
      console.error("Error:", error);
      document.getElementById("matchesContainer").innerHTML = `
        <div class="text-center text-white p-5">
          <h4>Error loading matches</h4>
          <p class="text-muted">Please try again later.</p>
        </div>
      `;
    });
}

function openChat(matchUserId) {
  window.location.href = `chat.html?user=${matchUserId}`;
}

// Load matches on page load
loadMatches();
