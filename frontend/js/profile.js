const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "index.html";
}

// Load current user profile
function loadProfile() {
  fetch(`${API_URL}/me?userId=${userId}`)
    .then(res => res.json())
    .then(user => {
      if (user.username) document.getElementById("username").value = user.username;
      if (user.bio) document.getElementById("bio").value = user.bio;
      if (user.image_url) {
        document.getElementById("image_url").value = user.image_url;
        const preview = document.getElementById("imagePreview");
        preview.src = user.image_url;
        preview.classList.remove("d-none");
        preview.style.display = "block";
        document.getElementById("imagePlaceholder").style.display = "none";
      }
      if (user.location) document.getElementById("location").value = user.location;
      if (user.hobbies) document.getElementById("hobbies").value = user.hobbies;
      if (user.interests) document.getElementById("interests").value = user.interests;
    })
    .catch(error => {
      console.error("Error loading profile:", error);
      showAlert("Failed to load profile", "danger");
    });
}

// Preview image when URL is entered
document.getElementById("image_url").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  const preview = document.getElementById("imagePreview");
  const placeholder = document.getElementById("imagePlaceholder");
  
  if (url) {
    preview.src = url;
    preview.onerror = () => {
      preview.classList.add("d-none");
      placeholder.style.display = "flex";
    };
    preview.onload = () => {
      preview.classList.remove("d-none");
      preview.style.display = "block";
      placeholder.style.display = "none";
    };
  } else {
    preview.classList.add("d-none");
    preview.style.display = "none";
    placeholder.style.display = "flex";
  }
});

// Save profile
function saveProfile() {
  const username = document.getElementById("username").value.trim();
  const bio = document.getElementById("bio").value.trim();
  const image_url = document.getElementById("image_url").value.trim();
  const location = document.getElementById("location").value.trim();
  const hobbies = document.getElementById("hobbies").value.trim();
  const interests = document.getElementById("interests").value.trim();

  setLoading("saveBtn", true);

  fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username || null,
      bio: bio || null,
      image_url: image_url || null,
      location: location || null,
      hobbies: hobbies || null,
      interests: interests || null
    })
  })
    .then(res => res.json())
    .then(data => {
      setLoading("saveBtn", false);
      if (data.msg && data.msg.includes("successfully")) {
        showAlert("Profile updated successfully!", "success");
        // Update localStorage if username changed
        if (username) {
          localStorage.setItem("userName", username);
        }
      } else {
        showAlert(data.msg || "Failed to update profile", "danger");
      }
    })
    .catch(error => {
      setLoading("saveBtn", false);
      console.error("Error:", error);
      showAlert("An error occurred. Please try again.", "danger");
    });
}

function setLoading(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  const btnText = document.getElementById(buttonId + "Text");
  const btnSpinner = document.getElementById(buttonId + "Spinner");
  
  if (isLoading) {
    btn.disabled = true;
    btnText.classList.add("d-none");
    btnSpinner.classList.remove("d-none");
  } else {
    btn.disabled = false;
    btnText.classList.remove("d-none");
    btnSpinner.classList.add("d-none");
  }
}

function showAlert(message, type = "danger") {
  const alertContainer = document.getElementById("alertContainer");
  const alertClass = type === "success" ? "alert-success" : "alert-danger";
  const icon = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";
  
  alertContainer.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert" style="background: ${type === "success" ? "rgba(74, 222, 128, 0.1)" : "rgba(220, 53, 69, 0.1)"}; border: 1px solid ${type === "success" ? "#4ade80" : "#dc3545"}; color: ${type === "success" ? "#4ade80" : "#dc3545"}; border-radius: 10px;">
      <i class="fas ${icon} me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" style="filter: invert(1);"></button>
    </div>
  `;
  
  setTimeout(() => {
    const alert = alertContainer.querySelector(".alert");
    if (alert) alert.remove();
  }, 5000);
}

// Load profile on page load
loadProfile();
