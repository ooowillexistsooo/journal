const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");

if (loginForm && loginMessage) {
	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const email = document.querySelector("#email").value.trim();
		const password = document.querySelector("#password").value;

		loginMessage.textContent = "logging in.............";

		const { error } = await window.supabaseClient.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (error) {
			loginMessage.textContent = error.message;
			return;
		}

		window.location.href = "index.html";
	});
}
