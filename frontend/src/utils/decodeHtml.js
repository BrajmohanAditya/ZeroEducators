export const decodeHtml = (html) => {
  if (!html) return "";
  let txt = String(html);
  
  // Multi-pass decoding to handle double-encoded entities (e.g. &amp;lt; or &amp;#39;)
  for (let i = 0; i < 2; i++) {
    txt = txt
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&shy;/g, "");
  }
  return txt;
};
