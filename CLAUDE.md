# CLAUDE.md

Claude Code (claude.ai/code) での開発ガイダンス

## プロジェクト概要

Claude Code のリモートアクセスを実現するモバイルアプリケーション。SSH経由でセキュアにリモートサーバーのClaude Codeセッションにアクセスし、プッシュ通知による非同期ワークフローを可能にします。

**技術スタック**: TypeScript + React Native + Expo (EAS Build)

## 🚧 現在の開発状況

### Phase 1: 基盤構築 (実装準備中)

**完了済み**:
- ✅ プロジェクト基本構造
- ✅ 設計ドキュメント ([docs/DESIGN_DOC.md](docs/DESIGN_DOC.md))
- ✅ 実装計画 ([IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md))

**次の実装ステップ** (優先順):
1. Redux Toolkit 状態管理セットアップ
2. Expo Router 画面構造構築  
3. React Native Paper UI基盤実装
4. 基本的なナビゲーションフロー構築

## 📋 段階的実装戦略

プロジェクトは5つのフェーズに分けて段階的に実装します。各フェーズ完了時に**動作デモ可能な状態**を維持することが重要です。

### Phase 1: 基盤構築 (1-2週間) 🚧
```typescript
目標: アプリの基本構造とナビゲーション確立

実装対象:
- Redux Toolkit 状態管理
- Expo Router 画面構造  
- React Native Paper UI基盤
- 基本的な画面遷移

検証基準:
✅ 全画面の基本UI表示
✅ ナビゲーション動作確認
✅ Redux 状態管理動作
✅ TypeScript エラーゼロ
```

### Phase 2: SSH接続機能 (2-3週間) 📋
```typescript
目標: 実SSH接続とEAS Build環境構築

実装対象:
- react-native-ssh-sftp 統合
- EAS Build 環境構築
- Expo Secure Store 認証情報管理
- 接続設定UI完全実装

検証基準:
✅ EAS Build での実機動作
✅ 実SSH サーバーへの接続成功
✅ 認証情報の安全な管理
✅ 接続エラーの適切な処理
```

### Phase 3: セッション管理 (2-3週間) 📋
```typescript
目標: tmux セッション完全管理

実装対象:
- tmux 操作 API
- セッション CRUD 操作
- リアルタイム状態同期
- セッション管理UI

検証基準:
✅ tmux セッション完全管理
✅ セッション状態のリアルタイム同期
✅ 複数セッション並行操作
✅ エラー回復機能
```

### Phase 4: ターミナルインターフェース (2-3週間) 📋
```typescript
目標: リアルタイムターミナル操作

実装対象:
- リアルタイム I/O ストリーミング
- ターミナル UI 完全実装
- 特殊キー操作対応
- コマンド履歴機能

検証基準:
✅ リアルタイムターミナル操作
✅ 特殊キー完全対応
✅ コマンド履歴機能
✅ 高いユーザビリティ
```

### Phase 5: プッシュ通知 (2-3週間) 📋
```typescript
目標: 非同期通知システム

実装対象:
- Expo Notifications 統合
- サーバー側監視システム
- バックグラウンド通知処理
- ディープリンク対応

検証基準:
✅ プッシュ通知完全動作
✅ サーバー監視システム
✅ バックグラウンド処理
✅ エンドツーエンドテスト
```

## 🎯 開発ガイドライン

### 必須の開発原則

#### 1. 段階的実装
- **各フェーズで動作するデモ**を必ず作成
- 機能追加前に既存機能の安定性確保
- **TypeScript エラーゼロ**を常に維持

#### 2. 品質重視
- 新機能には**必ずテスト**を作成
- コミット前に `npx tsc --noEmit` でエラーチェック
- iOS/Android 両方での動作確認

#### 3. セキュリティ最優先
- 認証情報は Expo Secure Store で暗号化保存
- ハードコードされた認証情報・APIキーの禁止
- SSH接続は標準セキュリティプラクティス遵守

### コーディング規約

#### TypeScript
```typescript
// ✅ Good: 厳密な型定義
interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
}

// ❌ Bad: any の使用
const config: any = { /* ... */ };

// ✅ Good: 型安全な実装
const validateConfig = (config: SSHConfig): boolean => {
  return config.host.length > 0 && config.port > 0;
};
```

#### React Native
```typescript
// ✅ Good: 関数型コンポーネント + Hooks
const ConnectionScreen: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  // ...
};

// ❌ Bad: クラスコンポーネント
class ConnectionScreen extends React.Component {
  // ...
}
```

#### Redux Toolkit
```typescript
// ✅ Good: createSlice 使用
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setConnecting: (state, action) => {
      state.isConnecting = action.payload; // Immer により安全
    },
  },
});

// ❌ Bad: 直接的な状態変更
state.isConnecting = true; // createSlice 外では禁止
```

## 📁 ディレクトリ構造と命名規約

### プロジェクト構造
```
src/
├── api/               # SSH・外部API通信
│   ├── ssh.ts        # SSH接続管理
│   ├── tmux.ts       # tmux操作
│   └── notifications.ts # プッシュ通知
├── components/        # 再利用可能UIコンポーネント
│   ├── common/       # 汎用コンポーネント
│   └── terminal/     # ターミナル専用
├── hooks/            # カスタムReact Hooks
│   ├── useSSH.ts     # SSH接続フック
│   └── useTerminal.ts # ターミナル操作フック
├── store/            # Redux Toolkit
│   ├── index.ts      # Store設定
│   ├── authSlice.ts  # 認証状態
│   └── sessionSlice.ts # セッション状態
├── types/            # TypeScript型定義
│   ├── index.ts      # 共通型
│   ├── ssh.ts        # SSH関連型
│   └── session.ts    # セッション関連型
└── utils/            # ユーティリティ関数
    ├── validation.ts # バリデーション
    └── secureStorage.ts # セキュアストレージ
```

### 命名規約
- **ファイル**: camelCase (`sshManager.ts`)
- **コンポーネント**: PascalCase (`ConnectionScreen`)
- **型定義**: PascalCase (`SSHConfig`)
- **フック**: use + PascalCase (`useSSHConnection`)

## 🧪 テスト戦略

### テスト対象優先度

#### 1. 高優先度 (必須)
```typescript
// SSH接続ロジック
describe('SSHManager', () => {
  test('should connect successfully with valid credentials', async () => {
    // SSH接続テスト
  });
});

// Redux状態管理
describe('authSlice', () => {
  test('should update connection state correctly', () => {
    // 状態更新テスト
  });
});
```

#### 2. 中優先度 (推奨)
```typescript
// カスタムフック
describe('useSSHConnection', () => {
  test('should handle connection lifecycle', () => {
    // フックテスト
  });
});

// ユーティリティ関数
describe('validation utils', () => {
  test('should validate SSH config correctly', () => {
    // バリデーションテスト
  });
});
```

#### 3. 低優先度 (時間があれば)
```typescript
// UIコンポーネント
describe('ConnectionScreen', () => {
  test('should render connection form', () => {
    // UIテスト
  });
});
```

## 🚀 開発コマンド

### 日常的な開発フロー
```bash
# 1. 開発サーバー起動
npm start

# 2. 型チェック (コミット前必須)
npx tsc --noEmit

# 3. コード品質チェック
npm run lint

# 4. テスト実行
npm test

# 5. プラットフォーム別テスト
npm run ios    # iOS Simulator
npm run android # Android Emulator
```

### Phase 2以降 (EAS Build)
```bash
# 開発ビルド作成
eas build --profile development --platform ios
eas build --profile development --platform android

# 実機インストール
eas build:run --profile development

# プロダクションビルド
eas build --profile production --platform all
```

## 🔧 重要な実装考慮事項

### SSH接続の考慮事項
- **EAS Build必須**: SSH機能のためネイティブビルド必要
- **タイムアウト設定**: モバイルネットワーク環境を考慮
- **エラーハンドリング**: 接続失敗・ネットワーク断線・認証エラー
- **認証情報管理**: Expo Secure Store での暗号化保存

### パフォーマンス最適化
- **メモリ管理**: SSH接続・セッションデータの適切なクリーンアップ
- **バッテリー効率**: 効率的な接続管理、不要なバックグラウンド処理回避
- **ネットワーク最適化**: モバイル環境での接続品質対応

### ユーザビリティ
- **直感的なUI**: Material Design による一貫したUX
- **エラー表示**: ユーザーフレンドリーなエラーメッセージ
- **接続状態**: 明確な接続状態の表示
- **オフライン対応**: 限定的だが適切なオフライン機能

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### SSH接続エラー
```bash
# 認証情報確認
- ホスト名、ポート、ユーザー名の正確性
- パスワード・SSH秘密鍵の有効性
- ネットワーク接続状態

# デバッグ方法
- SSH接続ログの確認
- ネットワーク診断
- 認証情報の再設定
```

#### EAS Build エラー
```bash
# 設定確認
- eas.json の設定確認
- app.json の EAS Build設定
- 依存関係の互換性確認

# デバッグ方法
- eas build:configure の再実行
- ビルドログの詳細確認
- 依存関係の更新・削除
```

#### パフォーマンス問題
```bash
# メモリリーク確認
- React Native Performance Monitor 使用
- Redux DevTools での状態確認
- 不要な再レンダリングの特定

# 最適化方法
- useMemo/useCallback 適切な使用
- 長いリストの仮想化
- 画像・リソースの最適化
```

## 📚 参考リソース

### 技術ドキュメント
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Native SSH SFTP](https://github.com/shaqian/react-native-ssh-sftp)

### 設計・実装
- [docs/DESIGN_DOC.md](docs/DESIGN_DOC.md) - 詳細システム設計
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - 段階的実装計画

---

## 🎯 次のアクション

**現在のフォーカス**: Phase 1 基盤構築

1. **Redux Toolkit セットアップ**: `src/store/` ディレクトリの実装
2. **画面構造構築**: `app/` ディレクトリの Expo Router 実装
3. **UI基盤実装**: React Native Paper による Material Design 基盤

各実装前に関連するドキュメント（設計書・実装計画）を確認し、段階的に高品質な実装を進めることが重要です。