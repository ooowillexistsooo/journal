const postForm = document.querySelector("#post-form");
const postMessage = document.querySelector("#post-message");

async function getSession() {
    const { data, error } =
        await window.supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = "login.html";
        return null;
    }

    return data.session;
}

postForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const session = await getSession();

    if (!session) {
        return;
    }

    const content = document.querySelector("#post-content").value.trim();
    const isPublic = document.querySelector("#is-public").checked;

    if (!content) {
        postMessage.textContent = "Write something before posting.";
        return;
    }

    const { error } = await window.supabaseClient
        .from("posts")
        .insert({
            user_id: session.user.id,
            content: content,
            is_public: isPublic
        });

    if (error) {
        postMessage.textContent = error.message;
        return;
    }

    postMessage.textContent = "Your journal entry was posted.";
    postForm.reset();
});

getSession();