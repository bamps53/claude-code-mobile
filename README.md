# Claude Code Mobile

リモートサーバー上の Claude Code セッションにモバイルデバイスから安全にアクセスするためのReact Nativeアプリケーション。

## 🎯 プロジェクトの目的

SSH接続によりリモートサーバーの Claude Code セッションに安全にアクセスし、プッシュ通知による非同期ワークフローを実現する。

### 主要価値提案
- **リモートアクセス**: 場所を問わないモバイルからの開発環境アクセス
- **非同期ワークフロー**: Claude Code作業完了時の即座な通知
- **複数セッション管理**: 複数開発タスクの効率的な並行管理

## 🏗️ 技術アーキテクチャ

### コア技術スタック
- **フレームワーク**: React Native + Expo (EAS Build)
- **言語**: TypeScript (strict mode)
- **状態管理**: Redux Toolkit
- **ナビゲーション**: Expo Router (ファイルベース)
- **UI**: React Native Paper (Material Design)
- **SSH通信**: react-native-ssh-sftp
- **セキュア ストレージ**: Expo Secure Store
- **プッシュ通知**: Expo Notifications (FCM/APNS)

### アーキテクチャ設計原則
- **直接SSH接続**: 中間サーバー不要のセキュアな通信
- **エンドツーエンド暗号化**: SSH標準プロトコル使用
- **ローカル認証情報管理**: デバイス内暗号化保存
- **段階的実装**: 各フェーズでデモ可能な状態を維持

## 📋 開発ステータス

### 現在: Phase 1 準備中 🚧

**完了済み:**
- ✅ 基本プロジェクト構造
- ✅ 設計ドキュメント策定 ([DESIGN_DOC.md](docs/DESIGN_DOC.md))
- ✅ 段階的実装計画 ([IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md))

**次の実装ステップ:**
- [ ] Redux Toolkit 状態管理セットアップ
- [ ] Expo Router 画面構造実装
- [ ] React Native Paper UI基盤構築

### 実装ロードマップ

| Phase | 期間 | 主要機能 | 成果物 |
|-------|------|----------|---------|
| **Phase 1** | 1-2週間 | 基盤構築 | ナビゲーション・UI基盤 |
| **Phase 2** | 2-3週間 | SSH接続 | EAS Build・認証機能 |
| **Phase 3** | 2-3週間 | セッション管理 | tmux操作・状態同期 |
| **Phase 4** | 2-3週間 | ターミナルUI | リアルタイムI/O・特殊キー |
| **Phase 5** | 2-3週間 | プッシュ通知 | 非同期通知システム |

詳細な実装計画: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

## 🚀 開発環境セットアップ

### 必要条件
- **Node.js**: 18.0+ 
- **Package Manager**: npm または yarn
- **開発環境**: 
  - iOS: Xcode (macOS)
  - Android: Android Studio
  - Expo CLI (推奨)

### クイックスタート

```bash
# リポジトリクローン
git clone <repository-url>
cd claude-code-mobile

# 依存関係インストール
npm install

# 開発サーバー起動
npm start
```

### 開発コマンド

```bash
# 開発サーバー
npm start                    # Expo development server
npm run ios                  # iOS simulator
npm run android              # Android emulator  
npm run web                  # Web browser

# 品質管理
npx tsc --noEmit            # TypeScript type check
npm run lint                # ESLint + auto-fix
npm test                    # Jest test runner

# プロダクションビルド
eas build --platform all    # EAS Build (Phase 2以降)
```

## 📁 プロジェクト構造

```
claude-code-mobile/
├── app/                     # Expo Router screens
│   ├── (tabs)/             
│   │   ├── _layout.tsx     # タブナビゲーション
│   │   ├── sessions.tsx    # セッション管理画面
│   │   └── terminal.tsx    # ターミナルインターフェース
│   ├── _layout.tsx         # ルートレイアウト + Providers
│   ├── index.tsx           # ウェルカム画面
│   ├── connection.tsx      # SSH接続設定
│   └── settings.tsx        # アプリ設定
├── src/
│   ├── api/               # SSH・通信APIレイヤー
│   ├── components/        # 再利用可能UIコンポーネント
│   ├── hooks/            # カスタムReact Hooks
│   ├── store/            # Redux Toolkit store
│   ├── types/            # TypeScript型定義
│   └── utils/            # ユーティリティ関数
├── docs/                  # プロジェクトドキュメント
│   ├── DESIGN_DOC.md     # システム設計仕様
│   └── IMPLEMENTATION_PLAN.md # 実装計画
├── assets/               # 静的リソース
└── tests/                # テストファイル
```

## 🔒 セキュリティ設計

### データ保護戦略
- **通信暗号化**: SSH標準プロトコル (RSA/Ed25519)
- **認証情報保護**: Expo Secure Store 暗号化ストレージ
- **セッション管理**: メモリ内データのみ、永続化なし
- **アプリ認証**: PIN/生体認証対応 (Phase 2以降)

### セキュリティガイドライン
- 認証情報のハードコード禁止
- SSH接続タイムアウト設定
- セキュアなエラーメッセージ
- 定期的なセキュリティ監査

## 📱 主要機能仕様

### SSH接続管理
- **認証方式**: パスワード・SSH秘密鍵対応
- **接続プロファイル**: 複数サーバー管理
- **自動再接続**: ネットワーク断線時の復旧
- **接続監視**: リアルタイム状態表示

### tmuxセッション管理  
- **セッション操作**: 作成・削除・一覧・接続
- **状態同期**: リアルタイムセッション情報更新
- **並行管理**: 複数セッション同時操作
- **永続化**: サーバー側セッション保持

### ターミナルインターフェース
- **リアルタイムI/O**: コマンド実行・出力表示
- **特殊キー**: Ctrl+C, Tab, 矢印キー等
- **履歴機能**: コマンド履歴・自動補完
- **カスタマイズ**: フォント・テーマ・サイズ調整

### プッシュ通知
- **作業完了通知**: Claude Code BEL文字検知
- **バックグラウンド受信**: アプリ非アクティブ時
- **ディープリンク**: 通知からセッション直接アクセス
- **通知設定**: ユーザーカスタマイズ可能

## 🧪 品質保証

### テスト戦略
- **単体テスト**: 重要ロジック (SSH, Redux, Utils)
- **統合テスト**: SSH接続〜ターミナル操作フロー
- **E2Eテスト**: 主要ユーザージャーニー自動化
- **セキュリティテスト**: 認証・暗号化機能検証

### 品質基準
- TypeScript strict mode エラーゼロ
- 主要機能テストカバレッジ80%以上
- iOS/Android両プラットフォーム動作保証
- セキュリティベストプラクティス準拠

### 継続的品質管理
- コミット前型チェック必須
- ESLint/Prettier自動フォーマット
- 定期的な依存関係セキュリティ監査
- パフォーマンス監視・最適化

## 🤝 開発コントリビューション

### 開発ガイドライン
1. **実装前**: 関連ドキュメント確認 (DESIGN_DOC.md, CLAUDE.md)
2. **コード品質**: TypeScript strict mode準拠
3. **テスト**: 新機能には適切なテストを作成
4. **セキュリティ**: セキュリティガイドライン遵守

### コーディング規約
- **TypeScript**: 厳密な型定義、`any`使用禁止
- **React**: 関数型コンポーネント、Hooks使用
- **状態管理**: Redux Toolkit、Immer活用
- **スタイル**: React Native Paper + カスタムスタイル

## 📚 ドキュメント

- **[DESIGN_DOC.md](docs/DESIGN_DOC.md)**: システム設計仕様
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)**: 段階的実装計画  
- **[CLAUDE.md](CLAUDE.md)**: Claude Code固有開発ガイダンス

## 📄 ライセンス

Private project - All rights reserved.

---

## ⚠️ 重要な注意事項

### EAS Build要件
SSH機能のためEAS Buildが必須です。Expo Goでは以下制限があります：
- SSH接続機能使用不可
- UI開発・テストのみ可能

### 開発アプローチ
段階的開発により**各フェーズで動作可能な状態**を維持し、継続的に機能追加を行います。

**現在のフォーカス**: Phase 1 基盤構築の実装準備中