const FALLBACK_POSTS = [
  {
    title: "朝霧と阿寺ブルー",
    date: "2024-05-12",
    summary: "早朝のキャンプ場付近では薄い霧がかかり、透き通る青が柔らかく揺らいでいました。訪問の際は防寒対策を。",
    image: "assets/img/river-1.svg",
    link: "https://note.com/yoshino_tomae/n/nf84ec453deb7",
  },
  {
    title: "新緑シーズン開幕",
    date: "2024-04-28",
    summary: "渓谷沿いの遊歩道で新緑が色濃くなってきました。水量が多いため、滑りやすい場所では足元に注意してください。",
    image: "assets/img/river-2.svg",
    link: "https://note.com/yoshino_tomae/n/n322582f0f733",
  },
  {
    title: "春の光と青",
    date: "2024-03-18",
    summary: "南木曽方面からのアクセス道路で小規模な工事が行われています。平日は片側交互通行のため時間に余裕を持ってご来訪ください。",
    image: "assets/img/river-3.svg",
    link: "https://note.com/yoshino_tomae/n/ne8b98fbd5530",
  },
];

const FALLBACK_ALERTS = [
  {
    label: "道路状況",
    message: "倉本方面の林道で路面工事中です。大型車でお越しの際は南木曽側からのルートをご利用ください。",
  },
  {
    label: "混雑予想",
    message: "5月の週末は午前9時までに駐車場が満車となる見込みです。公共交通機関のご利用もご検討ください。",
  },
];

const WEATHER_CODES = {
  0: "快晴",
  1: "ほぼ快晴",
  2: "晴れ時々曇り",
  3: "曇り",
  45: "霧",
  48: "濃霧",
  51: "霧雨(弱)",
  53: "霧雨(中)",
  55: "霧雨(強)",
  56: "着氷性霧雨(弱)",
  57: "着氷性霧雨(強)",
  61: "雨(弱)",
  63: "雨(中)",
  65: "雨(強)",
  66: "着氷性の雨(弱)",
  67: "着氷性の雨(強)",
  71: "雪(弱)",
  73: "雪(中)",
  75: "雪(強)",
  80: "にわか雨(弱)",
  81: "にわか雨(中)",
  82: "にわか雨(強)",
  95: "雷雨",
  96: "雷雨(ひょう)",
  99: "雷雨(ひょう強)",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const normalizeRecord = (record) => {
  if (!record || typeof record !== "object") return null;

  const getFirst = (...keys) => {
    for (const key of keys) {
      if (record[key]) {
        const value = record[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && value.length > 0) {
          const first = value[0];
          if (typeof first === "string") return first;
          if (first && typeof first === "object") {
            if (first.url) return first.url;
            if (first.href) return first.href;
          }
        }
        if (typeof value === "object") {
          if (value.url) return value.url;
          if (value.href) return value.href;
          if (value.text) return value.text;
          if (value.content) return value.content;
          if (value.start) return value.start;
        }
      }
    }
    return "";
  };

  const title = getFirst("Title", "Name", "title", "名前", "見出し");
  const date = getFirst("Date", "date", "日付", "投稿日");
  const summary = getFirst("Summary", "概要", "Description", "description", "本文");
  const image = getFirst("Image", "Photo", "Cover", "image", "photo", "cover");
  const link = getFirst("Link", "URL", "link", "url");

  if (!title && !summary && !image) return null;

  return {
    title: title || "更新情報",
    date,
    summary: summary || "",
    image: image || FALLBACK_POSTS[0].image,
    link: link || "",
  };
};

const renderPosts = (container, posts = []) => {
  if (!container) return;
  if (!posts.length) {
    container.innerHTML = '<p class="news-empty">現在表示できる投稿がありません。</p>';
    return;
  }

  const template = posts
    .slice(0, Number(container.dataset.notionLimit) || posts.length)
    .map((post) => {
      const safeSummary = post.summary ? post.summary.toString().trim() : "";
      const summaryText = safeSummary.length > 120 ? `${safeSummary.slice(0, 116)}…` : safeSummary;
      const formattedDate = formatDate(post.date);
      return `
        <article class="news-card" role="listitem">
          <figure>
            <img src="${post.image}" alt="${post.title}の写真" loading="lazy" />
          </figure>
          <div>
            ${formattedDate ? `<time datetime="${post.date || ''}">${formattedDate}</time>` : ""}
            <h3>${post.title}</h3>
            ${summaryText ? `<p>${summaryText}</p>` : ""}
            ${post.link ? `<a class="more" href="${post.link}" target="_blank" rel="noopener noreferrer">続きを読む</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  container.innerHTML = template;
};

const renderAlerts = (container, alerts = []) => {
  if (!container) return;
  if (!alerts.length) {
    container.innerHTML = '<li class="notice-item">現在お知らせはありません。</li>';
    return;
  }

  container.innerHTML = alerts
    .map(
      (alert) => `
        <li class="notice-item">
          ${alert.label ? `<strong>${alert.label}</strong>` : ""}
          <span>${alert.message}</span>
        </li>
      `
    )
    .join("");
};

const fetchNotionFeed = async (container) => {
  if (!container) return;

  const source = container.dataset.notionSource;
  if (!source) {
    renderPosts(container, FALLBACK_POSTS);
    return;
  }

  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const data = await response.json();
    const records = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

    const posts = records
      .map(normalizeRecord)
      .filter(Boolean)
      .sort((a, b) => {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        return db - da;
      });

    renderPosts(container, posts.length ? posts : FALLBACK_POSTS);
  } catch (error) {
    console.error("Notion feed error", error);
    renderPosts(container, FALLBACK_POSTS);
  }
};

const fetchAlerts = async (container) => {
  if (!container) return;
  const source = container.closest("[data-alert-source]")?.dataset.alertSource;
  if (!source) {
    renderAlerts(container, FALLBACK_ALERTS);
    return;
  }

  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch alerts: ${response.status}`);
    const data = await response.json();
    const alerts = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    const normalized = alerts
      .map((item) =>
        typeof item === "string"
          ? { label: "お知らせ", message: item }
          : {
              label: item.label || item.title || item.type || "お知らせ",
              message: item.message || item.description || item.text || "",
            }
      )
      .filter((item) => item.message);

    renderAlerts(container, normalized.length ? normalized : FALLBACK_ALERTS);
  } catch (error) {
    console.error("Alert feed error", error);
    renderAlerts(container, FALLBACK_ALERTS);
  }
};

const describeWeatherCode = (code) => WEATHER_CODES[code] || "天気情報";

const formatTemperature = (value) =>
  typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}℃` : "--℃";

const updateWeather = (container, data) => {
  if (!container) return;
  const currentRoot = container.querySelector(".weather-current");
  const forecastRoot = container.querySelector(".weather-forecast");
  const updatedText = container.querySelector(".weather-updated");

  if (!currentRoot || !forecastRoot) return;

  if (!data) {
    currentRoot.innerHTML = "<p>天気情報を取得できませんでした。</p>";
    forecastRoot.innerHTML = "";
    if (updatedText) updatedText.textContent = "";
    return;
  }

  const { current_weather: current, daily } = data;
  if (updatedText) {
    updatedText.textContent = current?.time
      ? `更新: ${formatDate(current.time)} ${new Date(current.time).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "";
  }

  currentRoot.innerHTML = `
    <div class="temperature">${formatTemperature(current?.temperature)}</div>
    <div class="meta">
      <span>${describeWeatherCode(current?.weathercode)}</span>
      ${typeof current?.windspeed === "number" ? `<span>風速: ${Math.round(current.windspeed)} m/s</span>` : ""}
      ${typeof current?.winddirection === "number" ? `<span>風向: ${Math.round(current.winddirection)}°</span>` : ""}
    </div>
  `;

  const days = Math.min(daily?.time?.length || 0, 4);
  forecastRoot.innerHTML = Array.from({ length: days }, (_, index) => {
    const day = {
      date: daily.time?.[index],
      weathercode: daily.weathercode?.[index],
      max: daily.temperature_2m_max?.[index],
      min: daily.temperature_2m_min?.[index],
    };
    return `
      <div class="forecast-item" role="listitem">
        <span>${formatDate(day.date)}</span>
        <span>${describeWeatherCode(day.weathercode)}</span>
        <span class="temp">${formatTemperature(day.max)} / ${formatTemperature(day.min)}</span>
      </div>
    `;
  }).join("");
};

const fetchWeather = async (container) => {
  if (!container) return;
  const lat = Number(container.dataset.latitude);
  const lon = Number(container.dataset.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    updateWeather(container, null);
    return;
  }

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current_weather: "true",
    daily: ["weathercode", "temperature_2m_max", "temperature_2m_min"].join(","),
    timezone: "Asia/Tokyo",
    forecast_days: "4",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    const data = await response.json();
    updateWeather(container, data);
  } catch (error) {
    console.error("Weather fetch error", error);
    updateWeather(container, null);
  }
};

const toggleNavigation = () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (!navToggle || !nav) return;

  const setExpanded = (expanded) => {
    navToggle.setAttribute("aria-expanded", String(expanded));
    nav.setAttribute("aria-expanded", String(expanded));
  };

  setExpanded(false);

  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    setExpanded(!expanded);
  });

  nav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 768px)").matches) {
        setExpanded(false);
      }
    })
  );
};

const enableSmoothScroll = () => {
  const handleClick = (event) => {
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const hash = anchor.getAttribute("href");
    if (!hash || !hash.startsWith("#")) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", handleClick);
  });
};

const setCurrentYear = () => {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  toggleNavigation();
  enableSmoothScroll();

  const newsGrid = document.querySelector("[data-notion-source]");
  const noticeList = document.querySelector(".notice-list");
  const weatherSection = document.querySelector(".weather");

  fetchNotionFeed(newsGrid);
  fetchAlerts(noticeList);
  fetchWeather(weatherSection);
});
