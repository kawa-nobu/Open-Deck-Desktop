const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');


//license-checker-rseidelsohn が出力した JSON ファイルの場所
const inputPath = path.resolve(projectRoot, 'build_license/licenses.json');

//生成物の出力先ディレクトリと HTML ファイル名
const outputDir = path.resolve(projectRoot, 'build_license');
const outputPath = path.resolve(outputDir, 'OPD_Use_Software_License.html');

//HTML に埋め込む文字列をエスケープする
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

//値を配列として扱う
function normalizeArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
}

// JSON ファイルを読み込む
function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

//ファイルを安全に読み込む
function safeReadFile(filePath) {
    try {
        if (!filePath) return '';
        if (!fs.existsSync(filePath)) return '';
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return '';
    }
}

//HTML 埋め込み用に、licenseFile のパスを安全な形へ整える
function toDisplayLicenseFileName(licenseFile) {
    if (!licenseFile || !String(licenseFile).trim()) {
        return '';
    }
    return path.basename(String(licenseFile).trim());
}

//licenseFile を読み込むための候補パスを作成
function createLicenseFileCandidates(rawPath) {
    return [
        rawPath,
        path.resolve(projectRoot, rawPath),
        path.resolve(projectRoot, 'node_modules', rawPath),
    ];
}

//パッケージ1件分のライセンス本文を抽出する
function getLicenseText(info) {
    if (info.licenseText && String(info.licenseText).trim()) {
        return String(info.licenseText).trim();
    }

    if (info.licenseFile && String(info.licenseFile).trim()) {
        const rawPath = String(info.licenseFile).trim();
        const candidates = createLicenseFileCandidates(rawPath);

        for (const candidate of candidates) {
            const text = safeReadFile(candidate);
            if (text.trim()) {
                return text.trim();
            }
        }
    }

    return '';
}

// パッケージ1件分の HTML を組み立てる
function buildPackageBlock([packageId, info]) {
    const licenses = normalizeArray(info.licenses).join(', ') || '不明';
    const repository = info.repository || info.url || info.homepage || '';
    const publisher = info.publisher || '';
    const email = info.email || '';

    // ライセンスファイルを
    const displayLicenseFile = toDisplayLicenseFileName(info.licenseFile || '');

    //ライセンス本文を抽出する
    const licenseText = getLicenseText(info);

    return `
    <section class="package">
      <h2>${escapeHtml(packageId)}</h2>
      <table class="meta">
        <tr><th>ライセンス</th><td>${escapeHtml(licenses)}</td></tr>
        <tr><th>開発者</th><td>${escapeHtml(publisher)}</td></tr>
        <tr><th>連絡先(Email)</th><td>${escapeHtml(email)}</td></tr>
        <tr><th>リポジトリ</th><td>${repository
            ? `<a href="${escapeHtml(repository)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repository)}</a>`
            : ''
        }</td></tr>
        <tr><th>ライセンス ファイル</th><td>${escapeHtml(displayLicenseFile)}</td></tr>
      </table>

      ${licenseText
            ? `
            <details class="license-details">
              <summary>ライセンス テキスト</summary>
              <pre>${escapeHtml(licenseText)}</pre>
            </details>
          `
            : `
            <p class="license-missing">
              ライセンスのテキストが見つかりませんでした。該当パッケージ内にライセンスファイルが含まれていない可能性があります。
            </p>
          `
        }
    </section>
  `;
}

//HTML全体を組み立てる
function buildHtml(data) {
    const packages = Object.entries(data).sort((a, b) =>
        a[0].localeCompare(b[0], 'en')
    );

    const packageCount = packages.length;
    const body = packages.map(buildPackageBlock).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Open-Deck使用ソフトウェアライセンス一覧</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      line-height: 1.6;
      margin: 0;
      padding: 32px;
      color: #222;
      background: #fff;
    }
    h1 {
      margin-top: 0;
      border-bottom: 2px solid #ddd;
      padding-bottom: 12px;
    }
    .summary {
      margin-bottom: 24px;
      color: #555;
    }
    .package {
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      break-inside: avoid;
    }
    .package h2 {
      margin-top: 0;
      font-size: 1.1rem;
      word-break: break-all;
    }
    .meta {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 12px;
    }
    .meta th, .meta td {
      text-align: left;
      vertical-align: top;
      border-top: 1px solid #eee;
      padding: 8px;
    }
    .meta th {
      width: 160px;
      background: #fafafa;
    }
    .license-details summary {
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 8px;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: #fafafa;
      border: 1px solid #eee;
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      font-size: 12px;
    }
    .license-missing {
      color: #a33;
      font-style: italic;
    }
    a {
      color: #0366d6;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <h1>Open-Deck使用ソフトウェアライセンス一覧</h1>
  <p>Open-Deckデスクトップ版の本バージョンでは下記のソフトウェアが使用されています。<br>各種ソフトウェアの開発者様に敬意を表します。</p>
  <p class="summary">
    総パッケージ数: ${packageCount}
  </p>
  ${body}
</body>
</html>`;
}

//メイン処理
function main() {
    if (!fs.existsSync(inputPath)) {
        console.error(`Input JSON not found: ${inputPath}`);
        process.exit(1);
    }

    const json = readJson(inputPath);

    fs.mkdirSync(outputDir, { recursive: true });

    const html = buildHtml(json);
    fs.writeFileSync(outputPath, html, 'utf8');

    console.log(`Generated!: ${outputPath}`);
}

main();