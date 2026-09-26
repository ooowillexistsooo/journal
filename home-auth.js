const signupLink = document.querySelector("#signup-link");
const loginLink = document.querySelector("#login-link");
const welcomeUser = document.querySelector("#welcome-user");
const myProfileLink = document.querySelector("#my-profile-link");
const logoutButton = document.querySelector("#logout-button");

async function showAccount() {
    const { data: { user }, error } =
        await window.supabaseClient.auth.getUser();

    if (error || !user) {
        return;
    }

    const { data: profile, error: profileError } =
        await window.supabaseClient
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

    const username =
        profile?.username || user.user_metadata?.username || "username not set";

    welcomeUser.textContent = username === "username not set"
        ? "signed in, but no username is set"
        : `signed in as @${username}`;
    signupLink.hidden = true;
    loginLink.hidden = true;
    welcomeUser.hidden = false;
    logoutButton.hidden = false;

    if (profile?.username || user.user_metadata?.username) {
        const profileUsername = profile?.username || user.user_metadata.username;
        myProfileLink.href =
            `profile.html?username=${encodeURIComponent(profileUsername)}`;
        myProfileLink.hidden = false;
    }

    if (profileError) {
        console.error("Could not load profile username:", profileError.message);
    }
}

logoutButton.addEventListener("click", async () => {
    const { error } = await window.supabaseClient.auth.signOut();

    if (error) {
        welcomeUser.textContent = error.message;
        return;
    }

    window.location.reload();
});

showAccount();