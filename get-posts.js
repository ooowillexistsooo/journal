let posts = [];

async function loadPosts() {
	const list = document.querySelector("#journal-list");
	const status = document.querySelector("#feed-status");
	status.textContent = "loading journals...";

	const { data, error } = await window.supabaseClient
		.from("posts")
		.select("id, content, created_at, profiles(username, display_name)")
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
	const search = document
		.querySelector("#post-search")
		.value.trim()
		.toLowerCase();
	const sort = document.querySelector("#post-sort").value;
	const recentOnly = document.querySelector("#recent-toggle").checked;
	const filteredPosts = posts
		.filter((post) => {
			const searchableText =
				`${post.content} ${post.profiles?.username || ""} ${post.profiles?.display_name || ""}`.toLowerCase();
			return searchableText.includes(search);
		})
		.sort((first, second) => {
			const firstTime = new Date(first.created_at).getTime();
			const secondTime = new Date(second.created_at).getTime();
			return sort === "oldest"
				? firstTime - secondTime
				: secondTime - firstTime;
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
		const actions = document.createElement("div");
		const likeButton = document.createElement("button");
		const likeCount = document.createElement("span");
		const commentForm = document.createElement("form");
		const commentInput = document.createElement("input");
		const commentButton = document.createElement("button");
		const commentsList = document.createElement("div");
		const username = post.profiles?.username || "unknown-user";

		actions.className = "post-actions";
		commentsList.className = "comments-list";
		likeButton.type = "button";
		likeButton.textContent = "like";
		commentInput.type = "text";
		commentInput.placeholder = "write a comment";
		commentInput.maxLength = 1000;
		commentInput.required = true;
		commentButton.type = "submit";
		commentButton.textContent = "comment";

		author.textContent = post.profiles?.display_name || `@${username}`;
		author.href = `profile.html?username=${encodeURIComponent(username)}`;
		content.textContent = post.content;
		date.textContent = new Date(post.created_at).toLocaleString();
		actions.append(likeButton, likeCount);
		commentForm.append(commentInput, commentButton);
		entry.append(author, content, date, actions, commentForm, commentsList);
		list.appendChild(entry);

		loadLikeState(post.id, likeButton, likeCount);
		loadComments(post.id, commentsList);

		likeButton.addEventListener("click", () =>
			toggleLike(post.id, likeButton, likeCount)
		);
		commentForm.addEventListener("submit", (event) =>
			submitComment(event, post.id, commentInput, commentsList)
		);
	});
}

async function getCurrentUser() {
	const { data, error } = await window.supabaseClient.auth.getUser();
	return error ? null : data.user;
}

async function loadLikeState(postId, likeButton, likeCount) {
	const { count } = await window.supabaseClient
		.from("likes")
		.select("id", { count: "exact", head: true })
		.eq("post_id", postId);

	likeCount.textContent = ` ${count || 0}`;

	const user = await getCurrentUser();
	if (!user) {
		return;
	}

	const { data: like } = await window.supabaseClient
		.from("likes")
		.select("id")
		.eq("post_id", postId)
		.eq("user_id", user.id)
		.maybeSingle();

	if (like) {
		likeButton.textContent = "unlike";
	}
}

async function toggleLike(postId, likeButton, likeCount) {
	const user = await getCurrentUser();
	if (!user) {
		window.location.href = "login.html";
		return;
	}

	const { data: existingLike } = await window.supabaseClient
		.from("likes")
		.select("id")
		.eq("post_id", postId)
		.eq("user_id", user.id)
		.maybeSingle();

	const query = existingLike
		? window.supabaseClient.from("likes").delete().eq("id", existingLike.id)
		: window.supabaseClient.from("likes").insert({
				post_id: postId,
				user_id: user.id
		  });

	const { error } = await query;
	if (error) {
		console.error(error);
		return;
	}

	likeButton.textContent = existingLike ? "like" : "unlike";
	const { count } = await window.supabaseClient
		.from("likes")
		.select("id", { count: "exact", head: true })
		.eq("post_id", postId);
	likeCount.textContent = ` ${count || 0}`;
}

async function loadComments(postId, commentsList) {
	const { data, error } = await window.supabaseClient
		.from("comments")
		.select("id, content, created_at, profiles(username, display_name)")
		.eq("post_id", postId)
		.order("created_at", { ascending: true });

	if (error) {
		console.error(error);
		return;
	}

	commentsList.replaceChildren();
	data.forEach((comment) => {
		const commentElement = document.createElement("div");
		const author = document.createElement("strong");
		const text = document.createElement("p");
		const date = document.createElement("small");
		const username = comment.profiles?.username || "unknown-user";

		author.textContent = comment.profiles?.display_name || `@${username}`;
		text.textContent = comment.content;
		date.textContent = new Date(comment.created_at).toLocaleString();
		commentElement.append(author, text, date);
		commentsList.appendChild(commentElement);
	});
}

async function submitComment(event, postId, commentInput, commentsList) {
	event.preventDefault();
	const user = await getCurrentUser();
	if (!user) {
		window.location.href = "login.html";
		return;
	}

	const content = commentInput.value.trim();
	if (!content) {
		return;
	}

	const { error } = await window.supabaseClient.from("comments").insert({
		post_id: postId,
		user_id: user.id,
		content
	});

	if (error) {
		console.error(error);
		return;
	}

	commentInput.value = "";
	await loadComments(postId, commentsList);
}

document.querySelector("#post-search").addEventListener("input", renderPosts);
document.querySelector("#post-sort").addEventListener("change", renderPosts);
document
	.querySelector("#recent-toggle")
	.addEventListener("change", renderPosts);
document.querySelector("#refresh-posts").addEventListener("click", loadPosts);
loadPosts();
