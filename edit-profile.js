const profileForm = document.querySelector("#profile-form");
const profileMessage = document.querySelector("#profile-message");
const profileRevisions = document.querySelector("#profile-revisions");
const loadRevisionButton = document.querySelector("#load-revision");

function setCodeFields(html, css) {
    document.querySelector("#custom-html").value = html || "";
    document.querySelector("#custom-css").value = css || "";
}

async function loadRevisions(userId) {
    const { data: revisions, error } = await window.supabaseClient
        .from("profile_revisions")
        .select("id, created_at, custom_html, custom_css")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        profileMessage.textContent = error.message;
        return;
    }

    profileRevisions.replaceChildren(new Option("current version", ""));

    revisions.forEach((revision) => {
        const label = new Date(revision.created_at).toLocaleString();
        profileRevisions.append(new Option(label, revision.id));
    });

    profileRevisions._revisions = revisions;
}

async function loadOwnProfile() {
    const { data: { user } } =
        await window.supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile, error } = await window.supabaseClient
        .from("profiles")
        .select("display_name, bio, avatar_url, custom_html, custom_css")
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

        await loadRevisions(user.id);
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

    const { error: revisionError } = await window.supabaseClient
        .from("profile_revisions")
        .insert({
            profile_id: user.id,
            custom_html: customHtml,
            custom_css: customCss
        });

    if (revisionError) {
        profileMessage.textContent = revisionError.message;
        return;
    }

    profileMessage.textContent = "profile saved!";
    await loadRevisions(user.id);
});

loadRevisionButton.addEventListener("click", () => {
    const revision = profileRevisions._revisions?.find(
        (item) => item.id === profileRevisions.value
    );

    if (!revision) {
        profileMessage.textContent = "choose a previous version first.";
        return;
    }

    setCodeFields(revision.custom_html, revision.custom_css);
    profileMessage.textContent = "previous version loaded. edit it, then save profile.";
});

loadOwnProfile();