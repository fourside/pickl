# Pickl TODO 実装計画

## 実行順序（軽い順）

1. ~~ヘッダー固定（§6） — CSS追加のみ~~ **完了** `8c3d922`
2. ~~ログイン画面オーバーフロー修正（§2） — CSS修正~~ **完了** `8ae0f0e`, `a455704`
3. ~~アイテム先頭追加（§5） — API + フロント小変更~~ **完了** `42270d8`
4. ~~1Password関連（§3） — 対応不要（調査完了済み）~~ **完了**（調査のみ）
5. ~~リスト名編集（§4） — API新規 + フロントUI~~ **完了** `68e8457`
6. ~~ダークモード（§1） — CSS変数 + Context + 設定UI~~ **完了** `392ee9c`, `876d4f8`
7. ~~アバターアップロード（§7） — R2 + マイグレーション + API + クロッパーUI~~ **完了**

---

## 1. ダークモード ✅ 完了

### Context
現在はライトモードのみ。`:root` にCSS変数が定義済みで、全コンポーネントが `var(--color-*)` を使用しているため、ダーク用の変数セットを追加するだけで大部分が対応できる。方針: デフォルトはシステム追従、設定画面のトグルで手動上書き可能。

### 変更ファイル
- `src/front/global.css` — ダーク用CSS変数を `[data-theme="dark"]` と `@media (prefers-color-scheme: dark)` で追加
- `src/front/shared/theme/theme-context.tsx` — **新規作成** ThemeProvider + useTheme フック。localStorage に保存 (`"system"` | `"light"` | `"dark"`)
- `src/front/main.tsx` — ThemeProvider でラップ
- `src/front/features/settings/page.tsx` — テーマ切替セレクト追加（System / Light / Dark）
- `src/front/features/settings/settings.module.css` — テーマ切替UIのスタイル
- `src/front/features/list-detail/list-detail.module.css` — `.dragOverlay` の `background: white` をCSS変数に変更
- `index.html` — `theme-color` メタタグの動的更新はThemeContext内で対応
- `public/manifest.json` — `background_color` はそのまま（PWAインストール時は固定値）

### 実装結果
- `global.css` に `:root[data-theme="dark"]` ブロックを追加し、全`--color-*` 変数をダーク値で上書き
- ThemeProvider (`theme-context.tsx`) で `<html>` の `data-theme` 属性を制御。初期値はシステム設定（`prefers-color-scheme`）から取得
- localStorageに `"light"` / `"dark"` を保存。`"system"` 選択肢は廃止し、トグルスイッチ（`@base-ui/react/switch`）で切替
- ハードコードされた色（`white`, `#0d2137` など）をCSS変数に置換
- コミット: `392ee9c`（初期実装）, `876d4f8`（selectからトグルスイッチへリファクタ）

---

## 2. ログイン画面のオーバーフロー修正 ✅ 完了

### Context
デスクトップブラウザでログイン画面が無駄にスクロールする。`.page` が `min-height: 100dvh` を使っており、`body` のデフォルトmargin (8px) がリセットされていないことが原因。

### 変更ファイル
- `src/front/global.css` — `body { margin: 0 }` を追加
- `src/front/features/auth/auth.module.css` — `min-height: 100dvh` → `height: 100dvh` に変更、`overflow: hidden` を追加

### 実装結果
1. `global.css` に `body { margin: 0 }` を追加（`background`, `color`, `font-family` も設定）
2. ログインページの `.page` を `height: 100dvh` + `box-sizing: border-box` に変更（`padding: 1rem` がheightに含まれるようになりオーバーフロー解消）
- コミット: `8ae0f0e`（body margin: 0）, `a455704`（box-sizing修正）

---

## 3. 1Password 関連（調査のみ） ✅ 完了

### 3a. 自動ログイン（1Passwordで入力後に自動サブミット）

**調査結果:**
- 1Passwordの「自動サブミット」は、1Password側の設定で有効にするもの。Webサイト側で特別な実装は不要
- 1Passwordはフォームの `<form>` タグと `type="submit"` ボタンを検出して自動サブミットする
- 現在のログインフォームは `<form onSubmit={handleSubmit}>` + `<button type="submit">` の構成で、1Passwordの自動サブミットに対応済み
- **1Password側の設定**: 該当ログインアイテムの編集 → 「自動入力後にサブミット」を有効化
- React controlled inputsの場合、1Passwordはinputイベントをディスパッチしてstateを更新し、その後formをsubmitする

**対応不要** — 1Passwordのアイテム設定で「Submit after filling」を有効化すれば動作するはず

### 3b. 1Passwordのアイコンにfaviconが採用されない

**調査結果:**
- 1Passwordはサイトアイコンを独自にクロールして取得する（Rich Icons サーバー）
- ローカル開発環境 (`localhost`) ではアイコンが取得できない
- デプロイ済み本番URLの場合、1Passwordが自動でアイコンを取得するまで時間がかかることがある
- 現在の設定（`/favicon.ico` + `/icons/icon-192.png`）は標準的で問題なし
- **対処法**: 本番URLでしばらく待つ。または1Passwordアプリでログインアイテムを編集し、手動でアイコンを設定

**対応不要** — 設定は正しい。本番環境で1Passwordのアイコンキャッシュが更新されるのを待つ

---

## 4. リスト名の編集 ✅ 完了

### Context
現在リスト名は作成時のみ設定可能で、編集APIがない。リスト一覧画面またはリスト詳細画面のヘッダーからインライン編集できるようにする。

### 変更ファイル
- `src/models/list.ts` — `UpdateListRequestSchema` を追加
- `src/api/routes/lists.ts` — `PATCH /lists/:id` エンドポイント追加（参加者のみ更新可能）
- `src/front/features/lists/api.ts` — `updateList` 関数追加
- `src/front/features/list-detail/api.ts` — `updateListName` 関数追加
- `src/front/features/list-detail/page.tsx` — ヘッダーのh1をクリックで編集可能にする（inline edit）
- `src/front/features/list-detail/list-detail.module.css` — 編集用のinputスタイル追加

### 実装結果
1. モデルに `UpdateListRequestSchema` を追加（`{ name: string }` のバリデーション）
2. API: `PATCH /lists/:id` で `requireParticipant` チェック後にリスト名を更新、`updated_at` も更新
3. フロントエンド: リスト詳細のヘッダー `<h1>` をクリックするとinputに切り替わり、blur/Enterで保存。Escでキャンセル
4. SWRの `mutate` で楽観的更新
- コミット: `68e8457`

---

## 5. 入力したアイテムを先頭に表示 ✅ 完了

### Context
現在、新規アイテムは `position = max + 1` でリスト末尾に追加される。先頭に来るように変更する。

### 変更ファイル
- `src/api/routes/items.ts` — `POST /:listId` のposition計算を `min - 1` に変更
- `src/front/features/list-detail/page.tsx` — `handleAddItem` の楽観的更新を `[newItem, ...prev]` に変更

### 実装結果
1. API側: `maxPos` の取得を `minPos` に変更し、`position = (minPos?.min_position ?? 1) - 1` で先頭に挿入
2. フロントエンド: `mutateItems((prev) => [newItem, ...(prev ?? [])])` に変更
3. positionが負の値になっても問題ない（`ORDER BY position ASC` で正しくソートされる）
- コミット: `42270d8`

---

## 6. リスト詳細のヘッダー固定 ✅ 完了

### Context
リスト詳細画面でスクロールするとヘッダー（戻るボタン + リスト名）がスクロールアウトする。`position: sticky` で固定する。

### 変更ファイル
- `src/front/features/list-detail/list-detail.module.css` — `.header` に `position: sticky; top: 0;` と背景色を追加

### 実装結果
- `.header` に `position: sticky; top: 0; background: var(--color-surface); z-index: 10;` を追加
- CSS変数を使うことでダークモード対応も自動的に行われる
- コミット: `8c3d922`

---

## 7. アバターアップロード機能 ✅ 完了

### Context
ユーザープロフィールにアバター画像の設定機能がない。Cloudflare R2に画像を保存し、設定画面からアップロード・表示する。

### 変更ファイル
- `wrangler.toml` — R2バケット `pickl-avatars` のバインディング追加
- `src/api/index.ts` — `AVATAR_BUCKET: R2Bucket` を Bindings に追加、ルートマウント
- `src/api/db.ts` — `avatar_key: string | null` を型定義に追加
- `migrations/002_add_avatar.sql` — **新規作成** `ALTER TABLE users ADD COLUMN avatar_key TEXT`
- `src/api/routes/avatar.ts` — **新規作成** `avatarPublicRoutes`（GET、認証不要）と `avatarRoutes`（PUT、認証必須）
- `src/front/features/settings/avatar-cropper.tsx` — **新規作成** react-easy-crop で円形クロップ、192x192 WebP 出力
- `src/front/features/settings/page.tsx` — アバタープレビュー（イニシャルフォールバック）+ ファイル選択 → クロッパーモーダル → アップロード
- `src/front/features/settings/api.ts` — `uploadAvatar` 関数追加（Content-Type付きの生Blobを送信）
- `src/front/features/settings/settings.module.css` — アバター・クロッパーモーダルのスタイル
- `package.json` — `react-easy-crop` を追加

### 実装結果
1. R2バケット `pickl-avatars` をバインディング。デプロイ前に `npx wrangler r2 bucket create pickl-avatars` が必要
2. `migrations/002_add_avatar.sql` で `avatar_key TEXT` カラム追加
3. API:
   - `PUT /api/avatar` — 認証必須。Blob受信（Content-Type で形式判定）、R2に `avatars/{userId}.webp` で保存、DBの `avatar_key` を更新。2MB制限、JPEG/PNG/WebP のみ許可
   - `GET /api/avatar/:userId` — 認証不要（`<img src>` から直接アクセス可能）。R2からオブジェクト取得、`Cache-Control: public, max-age=3600` 付き
   - GETを認証不要にするため、`index.ts` でルート登録順を工夫（`avatarPublicRoutes` を `authMiddleware` の前にマウント）
4. フロントエンド:
   - アバター画像のクリックでファイル選択 → react-easy-crop で円形クロップ → Canvas API で 192x192 WebP に変換 → PUT で送信
   - アバター未設定時はイニシャル文字をプレースホルダー表示
   - アップロード後はタイムスタンプクエリでキャッシュバスト
5. テスト修正:
   - `test-setup.ts` に `window.matchMedia` モック追加（jsdom非実装のため）
   - `testing/wrapper.tsx` に `ThemeProvider` 追加（ダークモード導入時に漏れていた分）

---

## 検証方法

各項目の実装後:
1. `npm run lint` — Biome チェック通過
2. `npm test` — フロントエンド/モデルテスト通過
3. `npm run test:api` — APIテスト通過
4. `npm run dev` で動作確認:
   - ダークモード: 設定画面でトグル切替、システム追従の確認
   - ログイン: デスクトップブラウザでスクロールが発生しないこと
   - リスト名編集: 詳細画面でタイトルクリック → 編集 → 保存
   - アイテム先頭追加: 新規追加時にリスト先頭に表示されること
   - ヘッダー固定: リスト詳細でスクロール時にヘッダーが固定されること
   - アバター: ファイル選択 → クロップモーダル → 保存 → プレビュー反映
5. `npm run build` — プロダクションビルド成功

---

## 別途対応: Service Worker の整理

### 現状
- `src/front/sw.ts` にSWコード（Workbox precache + push通知）が存在する
- しかし `navigator.serviceWorker.register()` を呼ぶコードがどこにもない（`main.tsx` 等にない）
- `vite.config.ts` に VitePWA プラグインも未導入
- つまり **SWはビルド・登録されておらず、実際には動作していない**

### 影響
- Workbox precaching が機能しないため、オフライン対応ができていない
- push通知のハンドラ (`push`, `notificationclick`) もSWが登録されていないため動作しない
- 逆に、デプロイ時のキャッシュ問題は発生しない（SWが無いので古いアセットがキャッシュされない）

### 整理時にやること
1. SWのビルド方法を決める（VitePWA プラグイン導入、または手動ビルド）
2. `main.tsx` にSW登録コードを追加
3. 更新戦略を決める:
   - `skipWaiting()` + `clients.claim()` で即時反映するか
   - 「更新があります」バナーでユーザーにリロードを促すか
4. push通知が必要な場合はSW登録後にsubscription処理も確認
