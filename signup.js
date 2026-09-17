const signupForm = document.querySelector("#signup-form");
const signupMessage = document.querySelector("#signup-message");

if (signupForm && signupMessage) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usernameInput = document.querySelector("#username");
        const emailInput = document.querySelector("#email");
        const passwordInput = document.querySelector("#password");
        const conductBox = document.querySelector("#conduct-agreement");

        if (!usernameInput || !emailInput || !passwordInput || !conductBox) {
            signupMessage.textContent = "form fields are missing. add the ids to the inputs.";
            return;
        }

        if (!conductBox.checked) {
            signupMessage.textContent = "you need to agree to the code of conduct first.";
            return;
        }

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        signupMessage.textContent = "creating...";

        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                },
                emailRedirectTo: `${window.location.origin}/index.html`
            }
        });

        if (error) {
            signupMessage.textContent = error.message;
            return;
        }

        if (data.session) {
            signupMessage.textContent = "account created yippe!";
            window.location.href = "index.html";
        } else {
            signupMessage.textContent = "hey, we created your account, but we need more confirmation so check your email to confirm you exist <3";
        }
    });
}