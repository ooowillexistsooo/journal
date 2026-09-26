const adminMessage = document.querySelector("#admin-message");
const reportList = document.querySelector("#report-list");
const adminPostList = document.querySelector("#admin-post-list");
const adminCommentList = document.querySelector("#admin-comment-list");
const reportFilter = document.querySelector("#report-filter");
const adminSearch = document.querySelector("#admin-search");

let loadedPosts = [];
let loadedComments = [];

async function requireAdmin() {
    const { data: { user }, error: userError } =
        await window.supabaseClient.auth.getUser();
    if (userError || !user) {
        window.location.href = "login.html";
        return null;
    }

    const { data: isAdmin, error } = await window.supabaseClient.rpc("is_admin");
    if (error) {
        adminMessage.textContent = `Could not check admin access: ${error.message}. Run the admin SQL setup and add your user ID to admin_users.`;
        return null;
    }

    if (!isAdmin) {
        adminMessage.textContent = "Your account is signed in but is not listed in admin_users.";
        return null;
    }
    return user;
}

async function loadReports() {
    const status = reportFilter.value;
    let query = window.supabaseClient
        .from("reports")
        .select("id, reporter_id, post_id, comment_id, reason, status, created_at, posts(content), comments(content)")
        .order("created_at", { ascending: false })
        .limit(100);
    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
        adminMessage.textContent = error.message;
        return;
    }

    reportList.replaceChildren();
    document.querySelector("#open-report-count").textContent = String(
        data.filter((report) => report.status === "open").length
    );
    if (!data.length) {
        reportList.textContent = "No reports in this view.";
        return;
    }

    data.forEach((report) => {
        const item = document.createElement("article");
        const title = document.createElement("h3");
        const reason = document.createElement("p");
        const reportedContent = document.createElement("blockquote");
        const details = document.createElement("small");
        const actions = document.createElement("div");
        const resolveButton = document.createElement("button");
        const dismissButton = document.createElement("button");
        const target = report.post_id ? `Post ${report.post_id}` : `Comment ${report.comment_id}`;

        title.textContent = `${report.status}: ${target}`;
        reason.textContent = report.reason;
        reportedContent.textContent = report.posts?.content || report.comments?.content || "Reported item is no longer available.";
        details.textContent = `Reported ${new Date(report.created_at).toLocaleString()} by ${report.reporter_id}`;
        resolveButton.type = "button";
        resolveButton.textContent = "resolve";
        dismissButton.type = "button";
        dismissButton.textContent = "dismiss";
        actions.className = "admin-actions";
        resolveButton.addEventListener("click", () => updateReport(report.id, "resolved"));
        dismissButton.addEventListener("click", () => updateReport(report.id, "dismissed"));
        actions.append(resolveButton, dismissButton);
        item.className = "admin-item";
        item.append(title, reportedContent, reason, details, actions);
        reportList.appendChild(item);
    });
}

async function updateReport(reportId, status) {
    const { error } = await window.supabaseClient
        .from("reports")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", reportId);
    if (error) {
        adminMessage.textContent = error.message;
        return;
    }
    adminMessage.textContent = `Report marked ${status}.`;
    await loadReports();
}

async function loadPosts() {
    const { data, error } = await window.supabaseClient
        .from("posts")
        .select("id, user_id, content, created_at, is_public, moderation_status")
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) {
        adminMessage.textContent = error.message;
        return;
    }
    loadedPosts = data || [];
    document.querySelector("#post-count").textContent = String(loadedPosts.length);
    renderPosts();
}

function renderPosts() {
    const search = adminSearch.value.trim().toLowerCase();
    const results = loadedPosts.filter((post) => post.content.toLowerCase().includes(search));
    adminPostList.replaceChildren();
    results.forEach((post) => {
        const item = document.createElement("article");
        const content = document.createElement("p");
        const details = document.createElement("small");
        const visibilityButton = document.createElement("button");
        const deleteButton = document.createElement("button");
        const hidden = post.moderation_status === "hidden";
        content.textContent = post.content;
        details.textContent = `${post.is_public ? "public" : "private"} | ${hidden ? "hidden" : "visible"} | ${new Date(post.created_at).toLocaleString()}`;
        visibilityButton.type = "button";
        visibilityButton.textContent = hidden ? "restore post" : "hide post";
        deleteButton.type = "button";
        deleteButton.textContent = "delete permanently";
        visibilityButton.addEventListener("click", () => setPostVisibility(post.id, hidden ? "visible" : "hidden"));
        deleteButton.addEventListener("click", () => deletePost(post.id));
        item.append(content, details, visibilityButton, deleteButton);
        adminPostList.appendChild(item);
    });
    if (!results.length) adminPostList.textContent = "No matching posts.";
}

async function setPostVisibility(postId, moderationStatus) {
    const { error } = await window.supabaseClient
        .from("posts")
        .update({ moderation_status: moderationStatus })
        .eq("id", postId);
    if (error) {
        adminMessage.textContent = error.message;
        return;
    }
    adminMessage.textContent = `Post ${moderationStatus}.`;
    await loadPosts();
}

async function deletePost(postId) {
    if (!window.confirm("Delete this post permanently?")) return;
    const { error } = await window.supabaseClient.from("posts").delete().eq("id", postId);
    if (error) {
        adminMessage.textContent = error.message;
        return;
    }
    adminMessage.textContent = "Post deleted.";
    await refreshDashboard();
}

async function loadComments() {
    const { data, error } = await window.supabaseClient
        .from("comments")
        .select("id, content, created_at, post_id")
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) {
        adminMessage.textContent = error.message;
        return;
    }
    loadedComments = data || [];
    document.querySelector("#comment-count").textContent = String(loadedComments.length);
    renderComments();
}

function renderComments() {
    const search = adminSearch.value.trim().toLowerCase();
    const results = loadedComments.filter((comment) => comment.content.toLowerCase().includes(search));
    adminCommentList.replaceChildren();
    results.forEach((comment) => {
        const item = document.createElement("article");
        const content = document.createElement("p");
        const details = document.createElement("small");
        const deleteButton = document.createElement("button");
        content.textContent = comment.content;
        details.textContent = `Post ${comment.post_id} | ${new Date(comment.created_at).toLocaleString()}`;
        deleteButton.type = "button";
        deleteButton.textContent = "delete comment";
        deleteButton.addEventListener("click", () => deleteComment(comment.id));
        item.append(content, details, deleteButton);
        adminCommentList.appendChild(item);
    });
    if (!results.length) adminCommentList.textContent = "No matching comments.";
}

async function deleteComment(commentId) {
    if (!window.confirm("Delete this comment permanently?")) return;
    const { error } = await window.supabaseClient.from("comments").delete().eq("id", commentId);
    if (error) {
        adminMessage.textContent = error.message;
        return;
    }
    adminMessage.textContent = "Comment deleted.";
    await Promise.all([loadComments(), loadReports()]);
}

async function refreshDashboard() {
    adminMessage.textContent = "Refreshing dashboard...";
    await Promise.all([loadReports(), loadPosts(), loadComments()]);
    adminMessage.textContent = "Dashboard refreshed.";
}

async function startAdminDashboard() {
    if (!(await requireAdmin())) return;
    document.querySelector("#refresh-admin").addEventListener("click", refreshDashboard);
    reportFilter.addEventListener("change", loadReports);
    adminSearch.addEventListener("input", () => {
        renderPosts();
        renderComments();
    });
    await refreshDashboard();
}

startAdminDashboard();