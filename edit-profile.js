const profileForm = document.querySelector("#profile-form");
const profileMessage = document.querySelector("#profile-message");

async function loadOwnProfile() {
    const { data: { user } } =
        await window.supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile, error } = await window.supabaseClient
        .from("profiles")
        .select("display_name, bio, avatar_url")
        .eq("id", user.id)
        .single();

    if (error && error.code !== "PGRST116") {
        profileMessage.textContent = error.message;
        return;
    }

    if (profile) {
        document.querySelector("#display-name").value =
            profile.display_name || "";

        document.querySelector("#bio").value =
            profile.bio || "";

        document.querySelector("#avatar-url").value =
            profile.avatar_url || "";

        document.querySelector("#custom-html").value =
            profile.custom_html || "";

        document.querySelector("#custom-css").value =
            profile.custom_css || "";
    }
}

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const { data: { user } } =
        await window.supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const displayName =
        document.querySelector("#display-name").value.trim();

    const bio =
        document.querySelector("#bio").value.trim();

    const avatarUrl =
        document.querySelector("#avatar-url").value.trim();

    const customHtml =
        document.querySelector("#custom-html").value;

    const customCss =
        document.querySelector("#custom-css").value;

    const { error } = await window.supabaseClient
        .from("profiles")
        .update({
            display_name: displayName,
            bio: bio,
            avatar_url: avatarUrl,
            custom_html: customHtml,
            custom_css: customCss
        })
        .eq("id", user.id);

    if (error) {
        profileMessage.textContent = error.message;
        return;
    }

    profileMessage.textContent = "profile saved!";
});

loadOwnProfile();