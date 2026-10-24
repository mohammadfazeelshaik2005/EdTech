async function checkSwayamMain() {
  const res = await fetch('https://storage.googleapis.com/swayam2_central/modules/nptel/assets/js/main.js');
  const js = await res.text();
  console.log('SWAYAM main.js length:', js.length);
  // Look for any ajax or url calls
  const urls = Array.from(js.matchAll(/url\s*:\s*["']([^"']+)["']/gi)).map(m => m[1]);
  console.log('URLs in SWAYAM main.js:', urls);
}

checkSwayamMain();
