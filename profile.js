const profileUsername = document.querySelector("#profile-username");
const profileDisplayName = document.querySelector("#profile-display-name");
const profileBio = document.querySelector("#profile-bio");
const profileAvatar = document.querySelector("#profile-avatar");
const profileCustom = document.querySelector("#profile-custom");
const profileMessage = document.querySelector("#profile-message");
const profilePosts = document.querySelector("#profile-posts");

const pathUsername = window.location.pathname.match(/^\/@([^/]+)$/)?.[1];

const queryUsername = new URLSearchParams(window.location.search)
    .get("username");

const username = (pathUsername || queryUsername || "").toLowerCase();

async function loadProfile() {
    if (!username) {
        profileMessage.textContent = "No username was provided.";
        return;
    }

    const { data: profile, error: profileError } =
        await window.supabaseClient
            .from("profiles")
            .select("id, username, display_name, bio, avatar_url, custom_html, custom_css")
            .eq("username", username)
            .single();

    if (profileError) {
        profileMessage.textContent = profileError.message;
        return;
    }

    if (!profile) {
        profileMessage.textContent = "User not found.";
        return;
    }

    profileUsername.textContent = `@${profile.username}`;
    profileDisplayName.textContent = profile.display_name || "";
    profileBio.textContent = profile.bio || "";

    if (profile.avatar_url) {
        profileAvatar.src = profile.avatar_url;
        profileAvatar.hidden = false;
    }

    const safeHtml = (profile.custom_html || "")
        .replace(/<\/?(script|iframe|object|embed|base|link|meta|form)[^>]*>/gi, "")
        .replace(/\s(on[a-z]+|formaction)\s*=\s*(['"]).*?\2/gi, "")
        .replace(/javascript\s*:/gi, "");
    const safeCss = (profile.custom_css || "")
        .replace(/@import/gi, "")
        .replace(/javascript\s*:/gi, "");

    profileCustom.srcdoc = `<!doctype html><html><head><style>${safeCss}</style></head><body>${safeHtml}</body></html>`;

    const { data: posts, error: postsError } =
        await window.supabaseClient
            .from("posts")
            .select("content, created_at")
            .eq("user_id", profile.id)
            .eq("is_public", true)
            .order("created_at", { ascending: false });

    if (postsError) {
        profileMessage.textContent = postsError.message;
        return;
    }

    if (!posts.length) {
        profilePosts.textContent = "No public posts yet.";
        return;
    }

    posts.forEach((post) => {
        const entry = document.createElement("article");
        const content = document.createElement("p");
        const date = document.createElement("small");

        content.textContent = post.content;
        date.textContent = new Date(post.created_at).toLocaleString();

        entry.append(content, date);
        profilePosts.appendChild(entry);
    });
}

loadProfile();