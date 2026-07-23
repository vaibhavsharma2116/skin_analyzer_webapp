import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const assetsDir = join(process.cwd(), "dist", "client", "assets");
const indexPath = join(process.cwd(), "dist", "client", "index.html");

const files = readdirSync(assetsDir);
const mainJs = files.find((f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f));
const mainCss = files.find((f) => /^styles-[A-Za-z0-9_-]+\.css$/.test(f));

if (!mainJs) {
  console.error("Could not find main index.js entry in dist/client/assets");
  process.exit(1);
}

const cssLink = mainCss
  ? `  <link rel="stylesheet" href="/assets/${mainCss}">\n`
  : "";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="color-scheme" content="light dark">
  <title>SkinPop</title>
${cssLink}  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="manifest" href="/manifest.webmanifest">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${mainJs}"></script>
</body>
</html>
`;

writeFileSync(indexPath, html);
console.log(`Generated ${indexPath} pointing to /assets/${mainJs}`);
if (mainCss) console.log(`Linked stylesheet /assets/${mainCss}`);
