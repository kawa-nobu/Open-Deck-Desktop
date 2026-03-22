# Open-Deck Desktop
Open-Deck Desktop は、[Open-Deck](https://github.com/kawa-nobu/Open-Deck) をベースにしたデスクトップアプリケーションです。  
ブラウザ拡張機能版 Open-Deck をデスクトップ環境で利用できるようにしています。
拡張機能版とは違い、ブラウザ側の制約を受けにくいため、他SNSサポートや単一アプリケーションとして動作できるためより利便性が上がっております。

## 主な機能
以下のような拡張機能版 Open-Deck にて実装されている機能に加え、他SNSカラムのサポートが行われております。

- 共通機能
  - タイムラインカラム
  - 通知カラム
  - Explore(ユニバーサルカラム)
  - 制限の少ないカラム追加
  - カラムの2段表示
  - 秒単位で設定できる自動更新
  - 柔軟なカラム幅調整
  - プロファイルの保存・切り替え
  
- デスクトップアプリ版独自機能
  - セッション機能による無制限な複数アカウント表示機能
    - 各セッションの名称設定可能
  - 他SNSカラム(試験実装)
    - Misskey.io
    - Bluesky
  - UIカラーモード設定機能
    - (システム / ライト / ダーク)から設定可能
  - 閉じるボタンの最小化割当機能
  - プロモーション非表示機能



## クイックスタート(開発者向け)
開発時に使用するものです。
通常利用する際はリリースされたものを使用してください。

```bash
# このリポジトリをクローンする
git clone https://github.com/kawa-nobu/Open-Deck-Desktop.git

# クローンしたディレクトリに移動
cd Open-Deck-Desktop

# 依存関係をインストール
npm install

# 開発モードで Open-Deck を起動する
npm run dev
```

### 通常モードで起動

```bash
npm start
```

## ビルド
ビルドには `electron-builder` を使用します。

### OS 別ビルド

```bash
# Windows
npx electron-builder --win

# macOS
npx electron-builder --mac

# Linux
npx electron-builder --linux
```

## ライセンス
### アセットライセンス
本アプリケーションでは他SNSサポート等にて以下のブランドロゴを使用しています
- Misskey
  - [アセット集](https://misskey-hub.net/ja/brand-assets/)
  - ライセンス: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Bluesky
  - [Bluesky for Journalists](https://bsky.social/about/blog/press-faq)
  - [Bluesky's media kit](https://drive.google.com/drive/folders/16mlJPfWNnc6jj-3vGZ88SFysIY13GBp0?usp=drive_link)