# 実装計画書

Claude Code Mobile アプリの段階的実装計画

## 🎯 開発戦略

### 基本方針
- **段階的実装**: 各フェーズで動作する最小機能を確保
- **品質重視**: 機能追加前に既存機能の安定性を確保
- **テスト駆動**: 重要機能には必ずテストを作成
- **早期検証**: 各フェーズで実機テストを実施

### 成功基準
- 各フェーズ完了時に**デモ可能な状態**を維持
- TypeScript エラーゼロを常に維持
- 主要機能の単体テストカバレッジ80%以上
- iOS/Android 両プラットフォームでの動作確認

## 📋 Phase 1: 基盤構築 (Duration: 1-2 weeks)

### 目標
基本的なアプリ構造とナビゲーションを実装し、UI/UX の基盤を確立する。

### 1.1 プロジェクト初期化
- [x] Expo + React Native + TypeScript プロジェクト構造
- [ ] package.json の依存関係整理
- [ ] ESLint/Prettier 設定
- [ ] TypeScript strict mode 設定

### 1.2 Redux Toolkit 状態管理
```typescript
// 実装対象
- src/store/index.ts          # Store 設定
- src/store/authSlice.ts      # 認証状態管理
- src/store/sessionSlice.ts   # セッション状態管理
- src/types/index.ts          # 型定義
```

**検証項目**:
- Redux DevTools での状態確認
- 状態の更新・永続化確認
- TypeScript 型安全性確認

### 1.3 Expo Router ナビゲーション
```typescript
// 実装対象画面
- app/_layout.tsx            # ルートレイアウト
- app/index.tsx             # ウェルカム画面
- app/connection.tsx        # SSH接続設定 (UI のみ)
- app/(tabs)/_layout.tsx    # タブレイアウト
- app/(tabs)/sessions.tsx   # セッション管理 (UI のみ)
- app/(tabs)/terminal.tsx   # ターミナル (UI のみ)
- app/settings.tsx          # 設定画面 (UI のみ)
```

**検証項目**:
- 画面間の遷移確認
- タブナビゲーション動作確認
- 戻るボタン・深いリンク動作確認

### 1.4 React Native Paper UI
```typescript
// 実装対象
- src/theme/index.ts         # テーマ設定
- 基本的なUIコンポーネント配置
- Material Design ガイドライン準拠
```

**検証項目**:
- UI コンポーネントの表示確認
- レスポンシブデザイン確認
- ダーク/ライトテーマ対応確認

### Phase 1 完了基準
- ✅ 全画面の基本UI表示
- ✅ ナビゲーション動作
- ✅ Redux 状態管理基盤
- ✅ TypeScript エラーゼロ
- ✅ iOS/Android での動作確認

---

## 📋 Phase 2: SSH接続機能 (Duration: 2-3 weeks)

### 目標
実際のSSH接続機能を実装し、EAS Build環境を構築する。

### 2.1 EAS Build 環境構築
```bash
# 実装対象
- eas.json 設定
- app.json の EAS Build 設定
- iOS/Android ビルド設定
- 開発用ビルドの作成・テスト
```

**検証項目**:
- Development Build の正常ビルド
- 実機での基本動作確認
- Hot Reload 動作確認

### 2.2 SSH ライブラリ統合
```typescript
// 実装対象
- src/api/ssh.ts             # SSH 接続 API
- react-native-ssh-sftp 統合
- 接続管理クラス実装
```

```typescript
// 実装例
export class SSHManager {
  async connect(config: SSHConfig): Promise<void>
  async disconnect(): Promise<void>
  async executeCommand(command: string): Promise<string>
  getConnectionStatus(): boolean
}
```

**検証項目**:
- 実サーバーへの SSH 接続成功
- パスワード認証動作確認
- エラーハンドリング確認

### 2.3 Expo Secure Store 統合
```typescript
// 実装対象
- src/utils/secureStorage.ts  # 暗号化ストレージ
- 認証情報の安全な保存・読み込み
- 設定画面での認証情報管理
```

**検証項目**:
- 認証情報の暗号化保存確認
- アプリ再起動後の復元確認
- セキュリティテスト

### 2.4 接続設定 UI 実装
```typescript
// 実装対象
- app/connection.tsx の完全実装
- フォームバリデーション
- 接続テスト機能
- エラー表示・回復フロー
```

**検証項目**:
- 入力バリデーション動作
- 接続成功/失敗のフィードバック
- ユーザビリティテスト

### Phase 2 完了基準
- ✅ EAS Build での実機動作
- ✅ 実SSH サーバーへの接続成功
- ✅ 認証情報の安全な管理
- ✅ 接続エラーの適切な処理
- ✅ セキュリティテスト通過

---

## 📋 Phase 3: セッション管理 (Duration: 2-3 weeks)

### 目標
tmux セッションの作成・管理・削除機能を実装する。

### 3.1 tmux 操作 API
```typescript
// 実装対象
- src/api/tmux.ts            # tmux 操作 API
```

```typescript
// 実装例
export class TmuxManager {
  async listSessions(): Promise<Session[]>
  async createSession(name: string): Promise<Session>
  async killSession(sessionId: string): Promise<void>
  async attachSession(sessionId: string): Promise<void>
}
```

**検証項目**:
- tmux コマンドの正常実行
- セッション情報の正確な解析
- 複数セッション並行管理

### 3.2 セッション管理 UI
```typescript
// 実装対象
- app/(tabs)/sessions.tsx の完全実装
- セッション一覧表示
- 新規セッション作成ダイアログ
- セッション削除確認
```

**検証項目**:
- セッション CRUD 操作確認
- リアルタイム状態更新
- エラーハンドリング

### 3.3 状態同期システム
```typescript
// 実装対象
- リアルタイムセッション状態取得
- Redux 状態の自動更新
- バックグラウンド同期
```

**検証項目**:
- 状態同期の正確性
- パフォーマンス影響確認
- ネットワーク切断時の動作

### Phase 3 完了基準
- ✅ tmux セッション完全管理
- ✅ セッション状態のリアルタイム同期
- ✅ 複数セッション並行操作
- ✅ エラー回復機能
- ✅ パフォーマンステスト通過

---

## 📋 Phase 4: ターミナルインターフェース (Duration: 2-3 weeks)

### 目標
リアルタイムコマンド実行とターミナル出力表示を実装する。

### 4.1 リアルタイム I/O
```typescript
// 実装対象
- src/api/terminal.ts        # ターミナル I/O 管理
- リアルタイムストリーミング
- コマンド履歴管理
```

**検証項目**:
- リアルタイム出力表示
- 入力応答性確認
- 長時間実行コマンド対応

### 4.2 ターミナル UI 実装
```typescript
// 実装対象
- app/(tabs)/terminal.tsx の完全実装
- スクロール可能な出力表示
- コマンド入力インターフェース
- 特殊キーボタン
```

**検証項目**:
- ターミナル操作性確認
- 特殊キー動作確認
- UI レスポンシブ性確認

### 4.3 高度なターミナル機能
```typescript
// 実装対象
- コマンド履歴 (上下矢印)
- テキストサイズ調整
- カラーテーマ対応
- コピー&ペースト
```

**検証項目**:
- 履歴機能動作確認
- アクセシビリティ確認
- ユーザビリティテスト

### Phase 4 完了基準
- ✅ リアルタイムターミナル操作
- ✅ 特殊キー完全対応
- ✅ コマンド履歴機能
- ✅ 高いユーザビリティ
- ✅ パフォーマンス最適化

---

## 📋 Phase 5: プッシュ通知 (Duration: 2-3 weeks)

### 目標
Claude Code 作業完了時の非同期通知システムを実装する。

### 5.1 Expo Notifications 統合
```typescript
// 実装対象
- src/api/notifications.ts   # 通知管理
- 通知権限要求
- デバイストークン管理
```

**検証項目**:
- 通知権限取得確認
- トークン送信確認
- 通知受信テスト

### 5.2 サーバー側監視システム
```bash
# 実装対象
- server/monitor.js          # tmux 出力監視
- BEL文字検知システム
- FCM/APNS 送信機能
```

**検証項目**:
- BEL文字検知精度
- 通知送信成功率
- レスポンス時間

### 5.3 バックグラウンド処理
```typescript
// 実装対象
- バックグラウンド通知受信
- ディープリンク処理
- 通知設定UI
```

**検証項目**:
- バックグラウンド受信確認
- ディープリンク動作確認
- 通知設定機能確認

### Phase 5 完了基準
- ✅ プッシュ通知完全動作
- ✅ サーバー監視システム
- ✅ バックグラウンド処理
- ✅ ディープリンク対応
- ✅ エンドツーエンドテスト通過

---

## 🧪 各フェーズ共通のテスト戦略

### 単体テスト
```bash
# テスト対象
- SSH 接続管理
- tmux 操作 API
- 状態管理 (Redux)
- ユーティリティ関数
```

### 統合テスト
```bash
# テスト対象
- SSH 接続〜セッション管理
- ターミナル操作フロー
- 通知システム全体
```

### E2E テスト
```bash
# テスト対象
- アプリ起動〜接続〜操作〜終了
- エラー回復フロー
- パフォーマンステスト
```

## 📊 各フェーズの成果物

| Phase | 主要成果物 | 検証方法 |
|-------|------------|----------|
| 1 | 基本UI・ナビゲーション | 手動テスト |
| 2 | SSH接続機能 | 実サーバーテスト |
| 3 | セッション管理 | 機能テスト |
| 4 | ターミナル操作 | ユーザビリティテスト |
| 5 | プッシュ通知 | E2Eテスト |

## 🎯 リスク管理

### 技術リスク
- **EAS Build 複雑性**: 早期構築で問題特定
- **SSH ライブラリ互換性**: 複数選択肢の調査
- **プッシュ通知制限**: プラットフォーム制約の事前調査

### 品質リスク
- **メモリリーク**: 定期的なプロファイリング
- **セキュリティ**: 継続的なセキュリティテスト
- **パフォーマンス**: 各フェーズでの性能測定

---

**最終目標**: 安定動作するプロダクション品質のアプリケーション