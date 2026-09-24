let posts = [];

async function loadPosts() {
  const list = document.querySelector("#journal-list");
  const status = document.querySelector("#feed-status");
  status.textContent = "loading journals...";

  const { data, error } = await window.supabaseClient
    .from("posts")
    .select("content, created_at, profiles(username, display_name)")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    status.textContent = error.message;
    return;
  }

  posts = data || [];
  renderPosts();
  status.textContent = `${posts.length} public journal${posts.length === 1 ? "" : "s"}`;
}

function renderPosts() {
  const list = document.querySelector("#journal-list");
  const search = document.querySelector("#post-search").value.trim().toLowerCase();
  const sort = document.querySelector("#post-sort").value;
  const recentOnly = document.querySelector("#recent-toggle").checked;
  const filteredPosts = posts
    .filter((post) => {
      const searchableText = `${post.content} ${post.profiles?.username || ""} ${post.profiles?.display_name || ""}`.toLowerCase();
      return searchableText.includes(search);
    })
    .sort((first, second) => {
      const firstTime = new Date(first.created_at).getTime();
      const secondTime = new Date(second.created_at).getTime();
      return sort === "oldest" ? firstTime - secondTime : secondTime - firstTime;
    })
    .filter((post, index) => !recentOnly || index < 5);

  list.replaceChildren();

  if (filteredPosts.length === 0) {
    list.textContent = "no matching public journals.";
    return;
  }

  filteredPosts.forEach((post) => {
    const entry = document.createElement("article");
    const author = document.createElement("a");
    const content = document.createElement("p");
    const date = document.createElement("small");
    const username = post.profiles?.username || "unknown-user";

    author.textContent = post.profiles?.display_name || `@${username}`;
    author.href = `profile.html?username=${encodeURIComponent(username)}`;
    content.textContent = post.content;
    date.textContent = new Date(post.created_at).toLocaleString();
    entry.append(author, content, date);
    list.appendChild(entry);
  });
}

document.querySelector("#post-search").addEventListener("input", renderPosts);
document.querySelector("#post-sort").addEventListener("change", renderPosts);
document.querySelector("#recent-toggle").addEventListener("change", renderPosts);
document.querySelector("#refresh-posts").addEventListener("click", loadPosts);
loadPosts();