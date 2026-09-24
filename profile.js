const profileUsername = document.querySelector("#profile-username");
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
            .select("id, username")
            .eq("username", username)
            .single();

    if (profileError || !profile) {
        profileMessage.textContent = "User not found.";
        return;
    }

    profileUsername.textContent = `@${profile.username}`;

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