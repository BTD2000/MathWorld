
const newsStatus = document.getElementById("newsStatus");
const newsList = document.getElementById("newsList");

async function loadNews() {
  const { data, error } = await db
    .from("news")
    .select("id, title, content, category, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("News error:", error);
    newsStatus.textContent = "Could not load news.";
    return;
  }

  newsList.replaceChildren();

  if (!data || data.length === 0) {
    newsStatus.textContent = "No news yet.";
    return;
  }

  newsStatus.textContent = "";

  for (const item of data) {
    const card = document.createElement("article");
    card.className = "card news-card";

    const category = document.createElement("span");
    category.className = "badge";
    category.textContent = item.category;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const date = document.createElement("p");
    date.className = "news-date";
    date.textContent = new Date(item.created_at).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    const content = document.createElement("p");
    content.textContent = item.content;

    card.append(category, title, date, content);
    newsList.append(card);
  }
}

loadNews();
