const API_URL = "http://localhost:3000/api";

// Load user info for header
function loadHeaderUser() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  fetch(`${API_URL}/me?userId=${userId}`)
    .then(res => res.json())
    .then(user => {
      // Update username in header
      const usernameElements = document.querySelectorAll(".header-username");
      usernameElements.forEach(el => {
        el.textContent = user.username || user.name || "User";
      });

      // Update user image in header
      const imageElements = document.querySelectorAll(".header-user-image");
      imageElements.forEach(el => {
        if (user.image_url) {
          el.src = user.image_url;
          el.style.display = "block";
          el.onerror = () => {
            // Fallback to avatar if image fails
            el.style.display = "none";
            const placeholder = el.nextElementSibling;
            if (placeholder) placeholder.style.display = "flex";
          };
        } else {
          el.style.display = "none";
          const placeholder = el.nextElementSibling;
          if (placeholder) placeholder.style.display = "flex";
        }
      });

      // Update avatar placeholder with first letter
      const avatarPlaceholders = document.querySelectorAll(".header-avatar-placeholder");
      avatarPlaceholders.forEach(el => {
        const firstLetter = (user.username || user.name || "U").charAt(0).toUpperCase();
        el.textContent = firstLetter;
      });
    })
    .catch(error => {
      console.error("Error loading user for header:", error);
    });
}

// Call on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadHeaderUser);
} else {
  loadHeaderUser();
}
