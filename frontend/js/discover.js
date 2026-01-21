const userId = localStorage.getItem("userId");

if (!userId) {
  window.location = "index.html";
}

fetch(`http://localhost:3000/api/users/${userId}`)
  .then(res => res.json())
  .then(users => {
    const container = document.getElementById("profiles");

    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${user.name}</h3>
        <p>Age: ${user.age}</p>
        <p>Gender: ${user.gender}</p>
        <button onclick="likeUser(${user.id})">❤️ Like</button>
      `;

      container.appendChild(card);
    });
  });

  function likeUser(toUser) {
    fetch("http://localhost:3000/api/like", {
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
        alert("🎉 It's a Match!");
      } else {
        alert("Liked!");
      }
    });
  }
  