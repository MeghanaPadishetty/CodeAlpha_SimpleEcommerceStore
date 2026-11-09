document.addEventListener("DOMContentLoaded", () => {
  const login = document.getElementById("login-form");
  const register = document.getElementById("register-form");
  const form = login || register;
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const message = document.getElementById("form-message");
    const values = Object.fromEntries(new FormData(form).entries());
    const endpoint = login ? "/api/login" : "/api/register";
    try {
      await API.request(endpoint, { method: "POST", body: JSON.stringify(values) });
      message.textContent = "Success! Redirecting...";
      message.style.color = "#356545";
      location.href = "/";
    } catch (err) { message.textContent = err.message; message.style.color = "#a44"; }
  });
});
