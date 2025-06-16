# Claude Code Mobile - セットアップガイド

## 🚨 重要：Expo Goでは動作しません

このアプリはSSHネイティブライブラリを使用するため、**Expo Goでは動作しません**。
必ず開発ビルドを作成して使用してください。

## 📱 開発ビルドのセットアップ

### 1. 開発ビルドの作成

```bash
# Androidの場合
eas build --profile development --platform android --local

# または、クラウドビルド
eas build --profile development --platform android
```

### 2. ビルドのインストール

```bash
# ローカルビルドの場合
adb install build-*.apk

# クラウドビルドの場合
# EASダッシュボードからAPKをダウンロードしてインストール
```

### 3. 開発サーバーの起動

```bash
# 重要：--dev-clientフラグを必ず指定
npx expo start --dev-client
```

### 4. アプリの起動

- 実機で「**Claude Code Mobile**」アプリを起動（Expo Goではない）
- QRコードをスキャンして開発サーバーに接続

## ❌ よくある間違い

### Expo Goを使用している

**症状**：

- SSH接続時に「Cannot read property 'connectToHostByPassword' of null」エラー
- `NativeModules`が空
- `RNSSHClient`がnull

**解決方法**：
開発ビルドを使用する（上記の手順を参照）

### 開発ビルドが古い

**症状**：

- 新しい機能が反映されない
- 予期しない動作

**解決方法**：

```bash
# クリーンビルド
cd android && ./gradlew clean && cd ..
rm -rf node_modules
npm install
eas build --profile development --platform android --local
```

## ✅ 正しく動作している場合

コンソールログで以下が確認できます：

```
[SSH] Native modules available: [..., RNSSHClient, ...]
[SSH] RNSSHClient module: [object Object]
```

## 🔍 デバッグ情報

開発者メニュー（実機を振る）から以下を確認：

1. **Show Element Inspector** - UI要素の確認
2. **Open Debugger** - コンソールログの確認
3. **Show Perf Monitor** - パフォーマンス監視

## 📞 サポート

問題が解決しない場合：

1. `npx expo doctor`でプロジェクトの健全性を確認
2. `eas build:list`でビルド履歴を確認
3. GitHubのIssuesで報告
