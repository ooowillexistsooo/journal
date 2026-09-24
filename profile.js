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

    const customDocument = new DOMParser().parseFromString(
        profile.custom_html || "",
        "text/html"
    );

    customDocument
        .querySelectorAll("script, iframe, object, embed, base, link, meta, form")
        .forEach((element) => element.remove());

    customDocument.querySelectorAll("*").forEach((element) => {
        [...element.attributes].forEach((attribute) => {
            if (
                attribute.name.toLowerCase().startsWith("on") ||
                attribute.name.toLowerCase() === "formaction" ||
                attribute.value.toLowerCase().includes("javascript:")
            ) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    profileCustom.replaceChildren(...customDocument.body.childNodes);

    const customStyle = document.createElement("style");
    customStyle.id = "profile-custom-css";
    customStyle.textContent = (profile.custom_css || "")
        .replace(/@import/gi, "")
        .replace(/javascript\s*:/gi, "");

    document.querySelector("#profile-custom-css")?.remove();
    document.head.appendChild(customStyle);

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