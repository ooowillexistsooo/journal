const signupForm = document.querySelector("#signup-form");
const signupMessage = document.querySelector("#signup-message");

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#username").value
        .trim()
        .toLowerCase();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const agreement = document.querySelector("#conduct-agreement");

    const usernamePattern = /^[a-z0-9_]{3,20}$/;

    if (!usernamePattern.test(username)) {
        signupMessage.textContent =
            "Username must be 3-20 characters using lowercase letters, numbers, or underscores.";
        return;
    }

    if (!agreement.checked) {
        signupMessage.textContent =
            "You must agree to the code of conduct.";
        return;
    }

    signupMessage.textContent = "Creating account...";

    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) {
        signupMessage.textContent = error.message;
        return;
    }

    const { error: profileError } = await window.supabaseClient
        .from("profiles")
        .insert({
            id: data.user.id,
            username: username
        });

    if (profileError) {
        signupMessage.textContent = profileError.message;
        return;
    }

    if (data.session) {
        window.location.href = "index.html";
    } else {
        signupMessage.textContent =
            "Account created. Check your email to confirm your account.";
    }
});