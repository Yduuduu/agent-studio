# 기술 스펙: Visual Workflow Builder

> Status: Draft v1.0
> Owner: Staff Frontend Engineer
> Scope: 프론트엔드 렌더링 최적화 / 상태 관리 / 컴포넌트 거버넌스 레퍼런스 프로젝트

---

## 0. 프로젝트 목표

AI 에이전트 파이프라인을 시각적으로 설계·검증·모니터링하는 워크플로우 빌더를 구축한다. 목적은 제품 자체가 아니라, 다음 세 가지 프론트엔드 역량을 증명 가능한 코드로 남기는 것이다.

1. **극한의 렌더링 최적화** — 수백 개 노드/엣지, 초당 수백 건의 로그 스트림에서도 60fps 유지
2. **복잡한 상태 관리** — 캔버스 상태, 폼 상태, 스트리밍 상태가 서로 격리되면서도 동기화되는 아키텍처
3. **엄격한 컴포넌트 거버넌스** — 재사용 가능한 디자인 시스템과 자동화된 품질 게이트

---

## 1. 기술 스택

| 영역            | 선택                                          | 비고                            |
| --------------- | --------------------------------------------- | ------------------------------- |
| 프레임워크      | Next.js 16 (App Router) + React 19            | `src/app` 구조                  |
| 언어            | TypeScript (strict)                           | `noUncheckedIndexedAccess` 포함 |
| 캔버스          | React Flow v12 (`@xyflow/react`)              | 커스텀 노드/엣지                |
| 전역 상태       | `zustand` (+ 자체 커맨드 히스토리 스토어)     | 캔버스/로그 스토어 분리         |
| 폼              | `react-hook-form` + `@hookform/resolvers/zod` | `useFieldArray`, `Controller`   |
| 스키마 검증     | `zod`                                         | 폼/노드 데이터 공용 스키마      |
| 가상화          | `@tanstack/react-virtual`                     | 로그 뷰어                       |
| 스타일          | TailwindCSS + `clsx` + `tailwind-merge`       | 인라인 스타일 금지              |
| 컴포넌트 문서화 | Storybook 10                                  | `ui/` 컴포넌트 필수             |
| 품질 게이트     | ESLint, Prettier, Husky, lint-staged          | pre-commit 강제                 |
| 테스트          | Vitest + Testing Library                      | 유닛/훅 테스트                  |

---

## 2. 디렉토리 구조 (확정)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     # 워크플로우 빌더 메인 페이지
│   └── globals.css
├── components/
│   ├── ui/                          # 공통 디자인 시스템
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── button.types.ts
│   │   ├── input/
│   │   ├── drawer/
│   │   ├── modal/
│   │   ├── badge/                   # 노드 상태 뱃지
│   │   └── progress-bar/
│   ├── form/
│   │   ├── SchemaForm.tsx           # 스키마 → 필드 매핑 엔트리
│   │   ├── fields/
│   │   │   ├── TextField.tsx
│   │   │   ├── SelectField.tsx
│   │   │   ├── ArrayField.tsx       # useFieldArray 래핑
│   │   │   └── ConditionalField.tsx
│   │   └── schema-form.types.ts
│   ├── canvas/
│   │   ├── WorkflowCanvas.tsx       # ReactFlow 래퍼
│   │   ├── nodes/
│   │   │   ├── BaseNode.tsx
│   │   │   ├── LLMNode.tsx
│   │   │   ├── DBQueryNode.tsx
│   │   │   └── ConditionNode.tsx
│   │   ├── edges/
│   │   │   └── CustomEdge.tsx
│   │   └── canvas.utils.ts          # 순환 참조 검사 등
│   └── log-viewer/
│       ├── LogViewer.tsx
│       ├── LogRow.tsx
│       └── HILApprovalBar.tsx
├── hooks/
│   ├── useSSE.ts
│   ├── useUndoRedo.ts
│   └── useNodeSelection.ts
├── store/
│   ├── useCanvasStore.ts            # nodes, edges, history
│   └── useLogStore.ts               # 스트리밍 로그, HIL 상태
├── types/
│   ├── node.schema.ts               # Zod: 노드 데이터 스키마
│   ├── form.schema.ts
│   └── log.types.ts
└── utils/
    ├── cn.ts
    ├── api.ts
    └── validators.ts
```

**규칙**: `ui/` 하위 컴포넌트는 반드시 `{Component}.tsx`, `{Component}.stories.tsx`, (필요 시) `{component}.types.ts` 3종 세트로 구성한다.

---

## 3. Phase별 상세 설계

### 3.1 Phase 1 — 노드 기반 AI 워크플로우 빌더

#### 3.1.1 커스텀 노드 (`components/canvas/nodes`)

- `BaseNode.tsx`: 모든 노드가 공유하는 레이아웃(카드, 헤더, 핸들)을 제공하는 컴파운드 컴포넌트. `LLMNode`, `DBQueryNode`, `ConditionNode`는 `BaseNode`를 합성해 구현한다.
- 노드 데이터 타입:

```ts
// types/node.schema.ts
import { z } from "zod";

export const nodeStatusSchema = z.enum(["idle", "pending", "running", "success", "error"]);

export const baseNodeDataSchema = z.object({
  label: z.string().min(1),
  status: nodeStatusSchema.default("idle"),
  progress: z.number().min(0).max(100).optional(), // running 상태에서만 사용
});

export type NodeStatus = z.infer<typeof nodeStatusSchema>;
export type BaseNodeData = z.infer<typeof baseNodeDataSchema>;
```

- 상태 뱃지(`ui/badge`)는 `status`에 따라 색상 매핑(`idle: gray`, `running: blue(pulse)`, `success: green`, `error: red`)만 담당하고, 프로그레스 바(`ui/progress-bar`)는 `status === "running"`일 때만 렌더링한다.
- **렌더링 최적화**: `LLMNode` 등 커스텀 노드는 `React.memo` + 커스텀 비교 함수로 감싸고, ReactFlow의 `nodeTypes`/`edgeTypes` 객체는 컴포넌트 외부(모듈 스코프)에서 한 번만 생성해 매 렌더마다 재생성되지 않도록 한다.

#### 3.1.2 Zustand 전역 상태 + Undo/Redo

- `store/useCanvasStore.ts`는 `nodes`, `edges`, ReactFlow 표준 핸들러(`onNodesChange`, `onEdgesChange`, `onConnect`)를 보관한다.
- Undo/Redo는 **커맨드 패턴 기반 히스토리 스택**으로 구현한다 (전체 상태 스냅샷 방식이 아니라, 변경 diff를 push하는 방식으로 메모리 사용량 최소화):

```ts
// hooks/useUndoRedo.ts (설계 개요)
interface HistoryEntry {
  undo: () => void;
  redo: () => void;
}

interface UndoRedoState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  push: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
}
```

- `useCanvasStore`의 상태 변경 액션(노드 추가/삭제/이동 확정, 엣지 연결/삭제)은 반드시 `pushHistory()`를 호출해 스택에 기록한다. 드래그 중 `position` 변경처럼 연속적인 변경은 `onNodeDragStop`에서만 히스토리에 커밋하고, 드래그 중간 프레임은 기록하지 않는다 (히스토리 폭주 방지).
- 스택 크기는 "무한"이지만 실무 안전장치로 `MAX_HISTORY = 200` 상한을 두고 초과 시 `past`의 가장 오래된 항목부터 제거한다. (스펙 문서에 이유 명시: 무한 스택은 메모리 누수 리스크)

#### 3.1.3 DAG 순환 참조 방지

- `canvas.utils.ts`에 `wouldCreateCycle(nodes, edges, newEdge): boolean`을 구현한다. 알고리즘: 새 엣지를 임시로 추가한 그래프에서 `source`부터 DFS를 수행해 `target`으로 되돌아오는 경로가 있는지 검사(O(V+E)).
- `onConnect` 핸들러에서 연결 시도 시 이 함수로 사전 검증하고, 순환이 발생하면 연결을 막고 `ui` 토스트로 사용자에게 알린다.

---

### 3.2 Phase 2 — 동적 스키마 폼 엔진

#### 3.2.1 스키마 → 폼 매핑

- 노드를 클릭하면 `Drawer`(`ui/drawer`)가 열리고 해당 노드 타입에 대응하는 Zod 스키마(`types/form.schema.ts`)를 `SchemaForm`에 전달한다.
- `SchemaForm.tsx`는 스키마를 순회하며 필드 타입에 따라 `fields/` 하위 컴포넌트를 동적으로 선택하는 **필드 레지스트리 패턴**을 사용한다:

```ts
// form/schema-form.types.ts
type FieldType = "text" | "number" | "select" | "array" | "conditional";

const FIELD_REGISTRY: Record<FieldType, React.ComponentType<FieldProps>> = {
  text: TextField,
  number: NumberField,
  select: SelectField,
  array: ArrayField,
  conditional: ConditionalField,
};
```

- 깊은 중첩 구조(예: `config.retry.policy.maxAttempts`)는 `react-hook-form`의 dot-path 문자열(`name="config.retry.policy.maxAttempts"`)과 `Controller`를 사용해 처리한다. 배열 필드는 `ArrayField` 내부에서 `useFieldArray({ name })`를 호출하고, 배열 아이템 자체가 다시 `SchemaForm`을 재귀 호출할 수 있도록 설계한다(재귀적 스키마 지원).

#### 3.2.2 조건부 필드 노출

- Zod 스키마에 `discriminatedUnion` 또는 커스텀 메타(`.describe()` 대신 별도 `uiSchema` 객체)로 조건을 표현한다. 예:

```ts
// types/form.schema.ts
export const llmNodeConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1),
  // provider === "anthropic" 일 때만 노출
  extendedThinking: z.boolean().optional(),
});

// uiSchema (렌더링 조건 별도 관리, 스키마와 분리해 검증 로직 오염 방지)
export const llmNodeUiSchema = {
  extendedThinking: {
    visibleWhen: (values: { provider: string }) => values.provider === "anthropic",
  },
};
```

- `ConditionalField`는 `useWatch({ control, name: dependsOn })`로 의존 필드만 구독하여, 다른 필드 변경 시 불필요한 재평가가 일어나지 않게 한다.

#### 3.2.3 리렌더링 방지 전략

- 각 `fields/*Field.tsx`는 `React.memo`로 감싸고, `Controller`의 `render` prop 내부 로직을 최소화한다.
- `useFormContext` 대신 필요한 필드 컴포넌트에는 `control`을 명시적으로 props로 전달해, 폼 전체 컨텍스트 구독으로 인한 광범위한 리렌더를 피한다.
- `SchemaForm`은 스키마 파싱 결과(필드 목록)를 `useMemo(() => parseSchema(schema), [schema])`로 캐싱한다.

---

### 3.3 Phase 3 — 실시간 HIL 로그 뷰어

#### 3.3.1 `useSSE` 훅

```ts
// hooks/useSSE.ts (설계 개요)
interface UseSSEOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  onError?: (err: Event) => void;
  enabled?: boolean;
}

function useSSE<T>({ url, onMessage, onError, enabled = true }: UseSSEOptions<T>) {
  // EventSource 생성/해제, url 또는 enabled 변경 시 재연결
  // 언마운트 시 close() 보장 (cleanup)
  // onMessage/onError는 ref로 캡처해 재연결 없이 최신 콜백 사용
}
```

- 연결 끊김 시 지수 백오프(exponential backoff) 재연결 전략을 포함한다 (최대 재시도 횟수 명시).
- 수신된 각 로그 청크는 `useLogStore`의 batched append 액션으로 전달한다 — 매 이벤트마다 개별 `setState`를 호출하지 않고, `requestAnimationFrame` 또는 짧은 debounce(예: 16ms) 윈도우로 모아서 배치 커밋해 리렌더 횟수를 줄인다.

#### 3.3.2 가상화 로그 뷰어

- `LogViewer.tsx`는 `@tanstack/react-virtual`의 `useVirtualizer`를 사용해 `useLogStore`의 `logs` 배열을 가상 스크롤링한다.
- 로그 항목 높이가 가변(긴 텍스트/짧은 텍스트)이므로 `estimateSize` + 동적 `measureElement`를 사용한다.
- 새 로그 도착 시 사용자가 스크롤을 맨 아래에 두고 있었다면 자동 스크롤(auto-follow), 위로 스크롤해 과거 로그를 보고 있다면 자동 스크롤을 중단하는 "스크롤 앵커링" 로직을 구현한다.
- `LogRow.tsx`는 `React.memo`로 감싸고 `logs` 배열은 불변 업데이트(새 배열 생성)로만 갱신해 참조 동등성을 보장한다.

#### 3.3.3 HIL 승인/거절 인터랙션

- HIL 개입이 필요한 로그 항목은 `type: "hil_request"`로 스트리밍되며, `HILApprovalBar.tsx`가 해당 로그 행 내부에 인라인으로 렌더링된다.
- 승인/거절 클릭 시 `POST /api/workflows/{id}/hil/{requestId}` 형태의 API 호출(`utils/api.ts`)을 수행하고, 낙관적 업데이트(optimistic update)로 즉시 해당 로그 항목의 상태를 `resolved`로 변경한 뒤 실패 시 롤백한다.

---

## 4. 팀 거버넌스 규칙 (엄수)

1. **`cn()` 유틸리티만 사용**

```ts
// utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- 모든 컴포넌트의 `className` 병합은 `cn()`을 통해서만 수행한다.
- `style={{}}` 인라인 스타일 사용 절대 금지. 동적 값(예: 프로그레스 바 너비)이 필요한 경우도 Tailwind 임의값 클래스(`w-[${value}%]`) 대신 CSS 변수 + Tailwind 유틸(`style` 대신 `[--progress:${value}%] w-(--progress)` 패턴 또는 CSS Modules)로 처리하고, 불가피하게 동적 스타일이 필요한 극소수 케이스(예: SVG viewBox 계산값)만 예외로 허용하며 이 경우 코드 리뷰에서 명시적으로 승인받는다.

2. **UI 컴포넌트 Props 타이핑**
   - 네이티브 HTML 엘리먼트를 확장하는 컴포넌트는 `React.ComponentPropsWithoutRef<"button">` 등을 기반으로 `Omit`/`Pick`을 활용해 충돌 필드를 명시적으로 재정의한다.

```ts
// ui/button/button.types.ts
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "color"> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}
```

3. **Git Hooks (Husky + lint-staged)**
   - `.husky/pre-commit`에서 `lint-staged` 실행.
   - `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,md,json}": ["prettier --write"]
  }
}
```

- 린트/포맷 실패 시 커밋 자체를 차단(Husky 훅이 non-zero exit 반환).

4. **Storybook 필수화**
   - `components/ui/**/*.tsx` 신규 추가 시 동일 디렉토리에 `*.stories.tsx` 동반 필수.
   - CI 단계(또는 pre-push 훅)에서 `ui/` 하위에 story 파일이 없는 컴포넌트를 탐지하는 스크립트(`scripts/check-stories.ts`)를 두고 실패 시 빌드를 막는다.

---

## 5. Step-by-Step Task Breakdown

> `Task N`으로 지시 시 아래 항목을 순서대로 수행한다. 각 태스크는 이전 태스크의 결과물에 의존한다.

1. Next.js(App Router, TS strict) 프로젝트 생성 및 기본 의존성 설치 (`@xyflow/react`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-virtual`, `clsx`, `tailwind-merge`, TailwindCSS)
2. ESLint(strict + `eslint-plugin-react-hooks`) / Prettier 설정 파일 작성
3. Husky 초기화 + `lint-staged` 설정 + `.husky/pre-commit` 훅 연결 및 동작 검증
4. Storybook 10 설치 및 Next.js/Tailwind 연동 설정
5. `utils/cn.ts` 작성 및 단위 테스트 작성
6. 디자인 시스템 기초 컴포넌트(`Button`, `Input`) 구현 + 각각 `.stories.tsx` 작성
7. `Badge`, `ProgressBar` 컴포넌트 구현 (노드 상태 표시용) + Storybook 작성
8. `Drawer`, `Modal` 컴포넌트 구현 + Storybook 작성
9. `types/node.schema.ts` 작성 (Zod 노드 데이터 스키마 + `NodeStatus`)
10. `store/useCanvasStore.ts` 골격 구현 (nodes/edges 상태 + ReactFlow 표준 핸들러)
11. `BaseNode.tsx` + `LLMNode`/`DBQueryNode`/`ConditionNode` 구현 (Badge/ProgressBar 조합, `React.memo` 적용)
12. `WorkflowCanvas.tsx` 구현 (ReactFlow 마운트, `nodeTypes` 모듈 스코프 고정, 기본 캔버스 인터랙션)
13. `canvas.utils.ts`의 `wouldCreateCycle` DAG 순환 검사 알고리즘 구현 + 단위 테스트
14. `hooks/useUndoRedo.ts` 커맨드 기반 히스토리 스택 구현 및 `useCanvasStore`에 연동 (상한 200)
15. `types/form.schema.ts` 작성 (노드별 설정 Zod 스키마 + `uiSchema` 조건부 노출 정의)
16. `form/fields/*` (`TextField`, `SelectField`, `ArrayField`, `ConditionalField`) 구현 (`React.memo` 적용)
17. `SchemaForm.tsx` 구현 (필드 레지스트리 패턴, `useFieldArray`/`Controller` 연동, Drawer와 노드 클릭 연결)
18. `hooks/useSSE.ts` 구현 (재연결 백오프 포함) + `store/useLogStore.ts` 배치 append 로직 구현
19. `LogViewer.tsx` + `LogRow.tsx` 구현 (`useVirtualizer` 연동, 스크롤 앵커링 로직)
20. `HILApprovalBar.tsx` 구현 및 승인/거절 API 연동(낙관적 업데이트) + 전체 플로우(캔버스 → 폼 → 로그) 통합 테스트

---

## 6. 완료 기준 (Definition of Done, Phase 공통)

- 신규 UI 컴포넌트는 Storybook 스토리 없이 머지 불가.
- `useCanvasStore`, `useLogStore` 변경 액션에는 최소 1개의 유닛 테스트 동반.
- 인라인 스타일(`style={{}}`) 및 `className` 문자열 직접 결합(`+`, 템플릿 리터럴) 코드 리뷰에서 리젝.
- 300+ 노드 / 초당 200+ 로그 라인 시뮬레이션에서 메인 스레드 프레임 드랍 없이 동작 확인(React DevTools Profiler 기준).
