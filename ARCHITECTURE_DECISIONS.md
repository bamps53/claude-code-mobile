# Architecture Decision Records (ADR)

このファイルでは、Claude Code Mobile アプリの重要な技術的意思決定を記録します。

## ADR-001: SSH Implementation Strategy - WebSocket Proxy vs Native SSH

**Date**: 2025-06-14  
**Status**: Decided  
**Decision Makers**: Development Team  

### Context

Claude Code Mobile アプリでは、SSH接続機能の実装において2つのアプローチが検討されました：

1. **WebSocket Proxy アプローチ**: WebSocketサーバー経由でSSH接続
2. **Native SSH アプローチ**: `react-native-ssh-sftp`による直接SSH接続

### Decision

**Native SSH アプローチ (`react-native-ssh-sftp`) を採用する**

### Rationale

#### Business Requirements
- **アプリストア販売**: 商用アプリとして販売することが決定
- **収益性**: 持続可能なビジネスモデルが必要
- **スケーラビリティ**: ユーザー増加に対応できるアーキテクチャが必要

#### Technical Comparison

| 項目 | WebSocket Proxy | Native SSH |
|------|-----------------|------------|
| **開発速度** | ✅ 高速 (Expo Go対応) | ❌ 低速 (EAS Build必要) |
| **インフラコスト** | ❌ 高 ($50-200+/月) | ✅ ゼロ |
| **運用負荷** | ❌ 24/7監視・メンテナンス | ✅ なし |
| **プライバシー** | ⚠️ 第三者サーバー経由 | ✅ 直接接続 |
| **信頼性** | ❌ サーバー障害リスク | ✅ 高い |
| **ユーザビリティ** | ❌ 「なぜ経由？」 | ✅ 直感的 |
| **パフォーマンス** | ⚠️ ネットワーク遅延 | ✅ 直接接続 |

#### Business Impact Analysis

**WebSocket Proxy の課題:**
```
売上予想: $5,000/月 (500ユーザー × $9.99)
サーバー費用: $200/月 (基本運用)
監視・保守: $500/月 (人件費換算)
実質利益: $4,300/月

リスク:
- ユーザー増加時のサーバースケーリング費用
- サーバー障害による悪評リスク
- 認証情報管理の責任とリスク
```

**Native SSH の利点:**
```
売上予想: $5,000/月 (同条件)
インフラ費用: $0/月
運用費用: $0/月
実質利益: $5,000/月

利点:
- インフラコストゼロ
- 運用リスクゼロ
- ユーザープライバシー完全保護
- スケーラビリティ問題なし
```

#### Technical Implementation

**Adopted Solution:**
```typescript
// src/api/ssh-native.ts
import SSHClient from '@dylankenneally/react-native-ssh-sftp';

export class NativeSSHManager {
  // Password authentication
  client = await SSHClient.connectWithPassword(host, port, username, password);
  
  // Private key authentication  
  client = await SSHClient.connectWithKey(host, port, username, privateKey, passphrase);
  
  // Direct tmux session management
  await client.execute('tmux new-session -d -s "session-name"');
  await client.execute('tmux list-sessions -F "#{session_name},#{session_created}"');
}
```

### Consequences

#### Positive
- ✅ **Zero Infrastructure Cost**: アプリ販売収益がそのまま利益
- ✅ **User Privacy**: 認証情報がユーザーデバイス内で完結
- ✅ **Reliability**: 開発者サーバーの障害影響なし
- ✅ **Scalability**: ユーザー数増加による追加コストなし
- ✅ **Performance**: 直接接続による低遅延

#### Negative
- ❌ **Development Complexity**: EAS Build setup required
- ❌ **Build Time**: Native compilation needed
- ❌ **Testing**: Expo Go では動作確認不可

#### Migration Impact
- 既存のWebSocket実装は参考実装として保持
- Native実装への完全移行
- EAS Build環境のセットアップが必要

### Implementation Status

**Phase 1: Core SSH Implementation** ✅ **COMPLETED**
```typescript
✅ Native SSH connection management
✅ Password & private key authentication
✅ Tmux session operations (create, list, delete, attach)
✅ Command execution and terminal I/O
✅ Connection status management
✅ Error handling and timeout management
```

**Phase 2: Production Readiness** 🚧 **IN PROGRESS**
```typescript
🚧 EAS Build configuration
🚧 Expo Secure Store integration
🚧 SSH key pair generation
🚧 Production error handling
```

**Phase 3: Enhanced Features** 📋 **PLANNED**
```typescript
📋 Real-time terminal streaming optimization
📋 SFTP file operations
📋 Push notifications for server monitoring
📋 Multi-server connection management
```

### Dependencies

**Required for Production:**
- EAS Build setup and configuration
- React Native development build environment
- iOS/Android store developer accounts

**Technical Dependencies:**
- `@dylankenneally/react-native-ssh-sftp: ^1.5.20`
- `expo-secure-store: ^14.2.3` (for credential storage)
- EAS Build compatibility testing

### Related Decisions
- ADR-002: EAS Build vs Expo Go Development Strategy (Pending)
- ADR-003: Credential Storage Security Implementation (Pending)
- ADR-004: App Store Pricing and Revenue Model (Pending)

### References
- [react-native-ssh-sftp Documentation](https://github.com/dylankenneally/react-native-ssh-sftp)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Secure Store Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)

---

## ADR-002: Development Workflow - EAS Build Strategy

**Date**: 2025-06-14  
**Status**: Proposed  
**Decision Makers**: Development Team  

### Context

Native SSH implementation requires EAS Build, changing our development workflow from Expo Go to Development Builds.

### Options

1. **Expo Go + Mock Mode**: Continue using Expo Go with mock SSH for development
2. **Full EAS Build**: Use EAS Development Builds for all development
3. **Hybrid Approach**: Expo Go for UI development, EAS Build for SSH testing

### Recommendation

**Hybrid Approach** - Use Expo Go for rapid UI development, EAS Development Builds for SSH feature testing.

### Implementation Plan

```bash
# Development Build setup
eas build --profile development --platform ios
eas build --profile development --platform android

# Install on devices
eas build:run --profile development
```

**Benefits:**
- Fast UI iteration with Expo Go
- Real SSH testing when needed
- Balanced development speed vs functionality

---

*Last Updated: 2025-06-14*