
// Show alert message
function showAlert(message, type = 'danger') {
  const alertContainer = document.getElementById('alertContainer');
  const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  alertContainer.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert" style="background: ${type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(220, 53, 69, 0.1)'}; border: 1px solid ${type === 'success' ? '#4ade80' : '#dc3545'}; color: ${type === 'success' ? '#4ade80' : '#dc3545'}; border-radius: 10px;">
      <i class="fas ${icon} me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" style="filter: invert(1);"></button>
    </div>
  `;
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    const alert = alertContainer.querySelector('.alert');
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

// Set loading state
function setLoading(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  const btnText = document.getElementById(buttonId + 'Text');
  const btnSpinner = document.getElementById(buttonId + 'Spinner');
  
  if (isLoading) {
    btn.disabled = true;
    btnText.classList.add('d-none');
    btnSpinner.classList.remove('d-none');
  } else {
    btn.disabled = false;
    btnText.classList.remove('d-none');
    btnSpinner.classList.add('d-none');
  }
}

// Check if user is logged in
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    return false;
  }
  return true;
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!checkAuth()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showAlert("Please fill in all fields");
    return;
  }

  setLoading('loginBtn', true);

  fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      setLoading('loginBtn', false);
      
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.name || "User");
        showAlert("Login successful! Redirecting...", 'success');
        setTimeout(() => {
          window.location.href = "discover.html";
        }, 1000);
      } else {
        showAlert(data.msg || "Login failed. Please check your credentials.");
      }
    })
    .catch(error => {
      setLoading('loginBtn', false);
      console.error("Error:", error);
      showAlert("An error occurred. Please try again.");
    });
}

function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const age = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;

  if (!name || !email || !password || !age || !gender) {
    showAlert("Please fill in all fields");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters");
    return;
  }

  if (age < 18 || age > 100) {
    showAlert("Age must be between 18 and 100");
    return;
  }

  setLoading('registerBtn', true);

  fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, age, gender })
  })
    .then(res => res.json())
    .then(data => {
      setLoading('registerBtn', false);
      
      if (data.msg && data.msg.includes("successfully")) {
        showAlert("Registration successful! Redirecting to login...", 'success');
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        showAlert(data.msg || "Registration failed");
      }
    })
    .catch(error => {
      setLoading('registerBtn', false);
      console.error("Error:", error);
      showAlert("An error occurred. Please try again.");
    });
}

// Allow Enter key to submit
document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (window.location.pathname.includes("register")) {
          register();
        } else {
          login();
        }
      }
    });
  });
});
