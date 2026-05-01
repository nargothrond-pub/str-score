(() => {
  "use strict";

  // Updated ID to match new branding
  if (document.getElementById("str-score-widget")) return;

  const isListingPage = () =>
    /airbnb\.[a-z.]+\/rooms\//.test(location.href) ||
    /airbnb\.[a-z.]+\/h\//.test(location.href);

  if (!isListingPage()) return;

  const widget = document.createElement("div");
  widget.id = "str-score-widget";
  const header = document.createElement("div");
  header.id = "str-score-header";
  const titleSpan = document.createElement("span");
  titleSpan.textContent = "🏠 STR Score";
  const closeSpan = document.createElement("span");
  closeSpan.id = "str-score-close";
  closeSpan.title = "Close";
  closeSpan.textContent = "✕";
  header.append(titleSpan, closeSpan);

  const body = document.createElement("div");
  body.id = "str-score-body";
  const loading = document.createElement("div");
  loading.id = "str-score-loading";
  loading.textContent = "⏳ Reading listing…";
  body.append(loading);

  widget.append(header, body);
  document.body.appendChild(widget);

  document.getElementById("str-score-close").addEventListener("click", () => {
    widget.remove();
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const parseNum = (str) => {
    if (!str) return null;
    const cleaned = str.replace(/[^\d.,]/g, "").replace(/,(?=\d{3})/g, "").replace(/,/g, ".").trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  const trySelectors = (selectors) => {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim()) return el.textContent.trim();
      } catch (_) {}
    }
    return null;
  };

  const scanText = (regex) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const m = node.textContent.match(regex);
      if (m) return m;
    }
    return null;
  };

  // ── Rating ───────────────────────────────────────────────────────────────
  const extractRating = () => {
    for (const el of document.querySelectorAll("[aria-label]")) {
      const label = el.getAttribute("aria-label") || "";
      const m = label.match(/(\d[\d,.]+)\s*(out of\s*5|\/\s*5|stars?)/i);
      if (m) { const n = parseNum(m[1]); if (n && n > 0 && n <= 5) return n; }
    }
    const raw = trySelectors([
      '[data-testid="pdp-reviews-highlight-banner-host-rating"]',
      '[data-testid="rating-and-reviews"] span',
      '.r1lutz1s', 'span[class*="rating"]', 'div[class*="Rating"] span',
    ]);
    if (raw) { const m = raw.match(/(\d[\d,.]+)/); if (m) { const n = parseNum(m[1]); if (n && n > 0 && n <= 5) return n; } }
    const m = scanText(/\b([4-5]\.\d{1,2})\b/);
    if (m) { const n = parseNum(m[1]); if (n && n > 0 && n <= 5) return n; }
    return null;
  };

  // ── Reviews ──────────────────────────────────────────────────────────────
  const extractReviews = () => {
    for (const el of document.querySelectorAll("[aria-label]")) {
      const label = el.getAttribute("aria-label") || "";
      const m = label.match(/(\d[\d,]+)\s+reviews?/i);
      if (m) { const n = parseNum(m[1]); if (n && n > 0) return n; }
    }
    const raw = trySelectors([
      '[data-testid="pdp-reviews-highlight-banner-host-review-count"]',
      '[data-testid="reviews-count"]',
      'a[href*="reviews"] span',
      'button[data-testid*="review"] span',
    ]);
    if (raw) { const m = raw.match(/(\d[\d,]+)/); if (m) { const n = parseNum(m[1]); if (n && n > 0) return n; } }
    const m = scanText(/[\(·]\s*(\d[\d,]+)\s+reviews?\s*[\)·]/i) || scanText(/\b(\d{1,5})\s+reviews?\b/i);
    if (m) { const n = parseNum(m[1]); if (n && n > 0) return n; }
    return null;
  };

  // ── Price ────────────────────────────────────────────────────────────────
  const extractPrice = () => {
    const parsePriceFromText = (text) => {
      if (!text) return null;
      const m = text.match(/[\$€£¥₹]\s*([\d][\d,.\s]*)/);
      return m ? parseNum(m[1]) : null;
    };
    const isPerNight = (t) => /per\s*night|\/\s*night|\bnight\b/i.test(t);
    const isTotal    = (t) => /\btotal\b/i.test(t);

    for (const sel of [
      '[data-testid="price-summary-total"]',
      '[data-testid="checkout-total-price"]',
      '[data-testid="book_it_total_price"]',
      '[data-testid="total-price"]',
    ]) {
      try {
        const el = document.querySelector(sel);
        if (el) { const n = parsePriceFromText(el.textContent); if (n && n > 20) return { price: n, label: "Total (before taxes)" }; }
      } catch (_) {}
    }

    for (const el of document.querySelectorAll("div,span,td,li,p")) {
      const text = el.textContent || "";
      if (text.length > 200 || !isTotal(text) || isPerNight(text)) continue;
      const n = parsePriceFromText(text);
      if (n && n > 20) return { price: n, label: "Total (before taxes)" };
    }

    {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        const txt = node.textContent.trim();
        if (!isTotal(txt)) continue;
        let combined = txt;
        let sib = node.nextSibling; let hops = 0;
        while (sib && hops < 6) { combined += " " + (sib.textContent || ""); sib = sib.nextSibling; hops++; }
        if (isPerNight(combined)) continue;
        const n = parsePriceFromText(combined);
        if (n && n > 20) return { price: n, label: "Total (before taxes)" };
      }
    }

    const nm = scanText(/[\$€£¥₹]\s*([\d][^\s]*)\s*[×x]\s*(\d+)\s*nights?/i);
    if (nm) {
      const perNight = parseNum(nm[1]); const nights = parseInt(nm[2], 10);
      if (perNight && nights && perNight < 5000 && nights < 365)
        return { price: perNight * nights, label: `${perNight.toLocaleString()}×${nights} nights (calc.)` };
    }

    const raw = trySelectors([
      '[data-testid="price-and-discounted-price"]',
      '[data-testid="structuredDisplayPrice-primaryLine"] span',
      'span[class*="_tyxjp1"]',
    ]);
    if (raw) {
      const n = parsePriceFromText(raw) || parseNum(raw.replace(/[^\d,.]/g, ""));
      if (n && n > 5) return { price: n, label: "Per night ⚠️ (select dates for total)" };
    }

    return null;
  };

  // ── Score ─────────────────────────────────────────────────────────────────
  const calcScore = (price, stars, reviews) => (price * 1000) / (stars * reviews);

  const setLoading = (container) => {
    container.replaceChildren();
    const l = document.createElement("div");
    l.id = "str-score-loading";
    l.textContent = "⏳ Reading listing…";
    container.append(l);
  };

  const render = (stars, reviews, priceData) => {
    const body = document.getElementById("str-score-body");
    if (!body) return;

    const price      = priceData ? priceData.price : null;
    const priceLabel = priceData ? priceData.label : null;
    const errors = [];
    if (!stars)   errors.push("rating");
    if (!reviews) errors.push("review count");
    if (!price)   errors.push("total price (select dates first)");

    if (errors.length) {
      body.replaceChildren();
      const errDiv = document.createElement("div");
      errDiv.id = "str-score-error";
      errDiv.append("⚠️ Could not read: ");
      const strong = document.createElement("strong");
      strong.textContent = errors.join(", ");
      errDiv.append(strong, ".");
      errDiv.append(document.createElement("br"));
      errDiv.append("Select your travel dates, scroll the page, then retry.");
      
      const retryBtn = document.createElement("button");
      retryBtn.id = "str-score-refresh";
      retryBtn.textContent = "🔄 Retry";
      retryBtn.onclick = () => { setLoading(body); scheduleExtract(500); };
      
      body.append(errDiv, retryBtn);
      return;
    }

    const score = calcScore(price, stars, reviews);

    body.replaceChildren();

    const createRow = (label, value) => {
      const row = document.createElement("div");
      row.className = "scorer-row";
      const lbl = document.createElement("span");
      lbl.className = "scorer-label";
      lbl.textContent = label;
      const val = document.createElement("span");
      val.className = "scorer-value";
      val.textContent = value;
      row.append(lbl, val);
      return row;
    };

    body.append(createRow("⭐ Stars", stars.toFixed(2)));
    body.append(createRow(`💬 Reviews`, reviews.toLocaleString()));
    body.append(createRow(`💶 ${priceLabel}`, price.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})));

    const result = document.createElement("div");
    result.id = "str-score-result";
    const resLabel = document.createElement("div");
    resLabel.className = "score-label";
    resLabel.textContent = "Value Score";
    const resNum = document.createElement("div");
    resNum.className = "score-number";
    resNum.textContent = score.toFixed(1);
    result.append(resLabel, resNum);

    const formula = document.createElement("div");
    formula.id = "str-score-formula";
    formula.textContent = "score = price×1000 ÷ (stars×reviews) — lower is better";

    const refreshBtn = document.createElement("button");
    refreshBtn.id = "str-score-refresh";
    refreshBtn.textContent = "🔄 Refresh";
    refreshBtn.onclick = () => { setLoading(body); scheduleExtract(300); };

    body.append(result, formula, refreshBtn);
  };

  // ── Extraction loop ───────────────────────────────────────────────────────
  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  const extract = () => {
    attempts++;
    const stars     = extractRating();
    const reviews   = extractReviews();
    const priceData = extractPrice();
    if ((!stars || !reviews || !priceData) && attempts < MAX_ATTEMPTS) {
      scheduleExtract(1500);
      return;
    }
    render(stars, reviews, priceData);
  };

  const scheduleExtract = (delay = 800) => {
    attempts = 0;
    setTimeout(extract, delay);
  };

  scheduleExtract(1500);

  // Re-run on SPA navigation
  let lastHref = location.href;
  const navObserver = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      if (!isListingPage()) { widget.remove(); navObserver.disconnect(); return; }
      const body = document.getElementById("str-score-body");
      if (body) setLoading(body);
      scheduleExtract(2000);
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: true });
})();