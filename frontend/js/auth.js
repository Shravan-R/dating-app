function login() {
    fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
        window.location = "discover.html";
      } else {
        alert("Login failed");
      }
    });
  }
  
  function register() {
    fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        age: age.value,
        gender: gender.value
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.msg) {
        alert(data.msg);
        window.location = "index.html";
      }
    });
  }
  