async function loadPosts() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session) {
    return;
  }

  const { data, error } = await window.supabaseClient
    .from("posts")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const list = document.querySelector("#journal-list");

  if (!data || data.length === 0) {
    list.innerHTML = "<p>no entries yet.</p>";
    return;
  }

  list.innerHTML = data
    .map(
      (post) => `
        <div class="entry">
          <p>${post.content}</p>
          <small>${new Date(post.created_at).toLocaleString()}</small>
        </div>
      `
    )
    .join("");
}

loadPosts();