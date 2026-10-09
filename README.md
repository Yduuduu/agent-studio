# Agent Studio — Visual Workflow Builder

AI 에이전트 파이프라인을 노드 캔버스에서 설계하고, 실행 로그를 실시간으로 보며, 사람의 승인(Human-in-the-Loop)이 필요한 단계에서 실행을 멈추고 결정을 받는 워크플로우 빌더입니다.

제품보다는 다음 세 가지 프론트엔드 역량을 코드로 보여 주는 레퍼런스 프로젝트입니다. 자세한 설계는 [docs/tech_spec.md](docs/tech_spec.md)에 있습니다.

1. **렌더링 최적화**: 노드 수백 개와 초당 수백 줄의 로그 스트림에서도 60fps 유지
2. **상태 관리**: 캔버스, 폼, 스트리밍 상태가 서로 격리되면서도 동기화되는 구조
3. **컴포넌트 거버넌스**: 재사용 가능한 디자인 시스템과 자동화된 품질 게이트

## 주요 기능

- **워크플로우 캔버스**: LLM, DB Query, Condition 노드를 React Flow로 배치하고 연결합니다. 연결하면 순환이 생기는 엣지는 DFS로 사전에 막고 토스트로 알립니다. 노드 추가·삭제·이동과 엣지 연결·삭제는 커맨드 패턴 기반 히스토리(최대 200개)에 기록됩니다.
- **스키마 기반 설정 폼**: 노드를 클릭하면 Drawer가 열리고, Zod 스키마에서 폼이 자동으로 만들어집니다. 중첩 객체, 배열, 조건부 필드(예: provider가 Anthropic일 때만 Extended thinking 노출)를 지원합니다.
- **실시간 로그 뷰어**: SSE로 실행 이벤트를 받아 가상 스크롤 목록에 표시합니다. 맨 아래에 있으면 새 로그를 자동으로 따라가고, 위로 스크롤하면 멈춥니다.
- **HIL 승인**: 승인이 필요한 단계에서 실행이 멈추고, 로그 행 안에서 바로 승인하거나 거절할 수 있습니다. 결정은 화면에 먼저 반영되고, 서버 요청이 실패하면 되돌립니다.

## 시작하기

Node.js 22.18 이상(23.x는 23.6 이상)이 필요합니다. `check-stories` 스크립트가 Node의 TypeScript 실행 기능을 사용하며, 22.17 이하에서는 `.mts` 파일을 실행하지 못합니다.

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)을 열면 3개 노드로 된 데모 워크플로우가 나옵니다.

- **Run**: mock 실행을 시작합니다. 노드 상태가 바뀌고 로그가 쌓이다가, Condition 노드에서 승인을 기다립니다.
- **Stress run**: 초당 약 250줄로 로그를 보냅니다.
- **대규모 워크플로우**: `http://localhost:3000/?nodes=300`처럼 접속하면 지정한 수만큼 노드가 있는 DAG를 불러옵니다(최대 2000).

실행은 백엔드 없이 내장 mock API가 시뮬레이션합니다.

| 엔드포인트                                                       | 설명                                                                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /api/workflows/:id/stream?nodes=a,b&rate=40&lines=30&hil=b` | 실행 이벤트(`node_status`, `log`, `hil_request`)를 SSE로 보내고, 끝나면 `end` 이벤트를 보냅니다 |
| `POST /api/workflows/:id/hil/:requestId`                         | `{ "decision": "approved" \| "rejected" }`로 멈춘 실행을 재개하거나 중단합니다                  |

## 스크립트

| 명령                          | 설명                                       |
| ----------------------------- | ------------------------------------------ |
| `npm run dev`                 | 개발 서버                                  |
| `npm run build` / `npm start` | 프로덕션 빌드와 실행                       |
| `npm test`                    | 유닛·통합 테스트 (Vitest, jsdom)           |
| `npm run test:watch`          | 테스트 watch 모드                          |
| `npm run lint`                | ESLint                                     |
| `npm run format`              | Prettier                                   |
| `npm run storybook`           | Storybook (http://localhost:6006)          |
| `npm run check-stories`       | 스토리가 없는 `ui/` 컴포넌트가 있으면 실패 |

## 기술 스택

Next.js 16 (App Router), React 19, TypeScript (strict), React Flow (`@xyflow/react`), Zustand, React Hook Form + Zod, TanStack Virtual, Tailwind CSS 4, Storybook 10, Vitest + Testing Library

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # 빌더 메인 페이지
│   └── api/workflows/[id]/       # mock 실행 스트림, HIL 결정 API
├── components/
│   ├── ui/                       # 디자인 시스템 (컴포넌트 + 스토리 + 타입)
│   ├── canvas/                   # React Flow 캔버스, 커스텀 노드·엣지, 순환 검사
│   ├── form/                     # SchemaForm과 필드 컴포넌트
│   ├── node-settings/            # 노드 설정 Drawer
│   ├── log-viewer/               # 가상 스크롤 로그 뷰어, HIL 승인 바
│   └── run/                      # 실행 컨트롤
├── hooks/                        # useSSE, useUndoRedo, useWorkflowRun 등
├── store/                        # 캔버스, 로그, 토스트 Zustand 스토어
├── server/                       # mock 실행기, HIL 대기 레지스트리
├── types/                        # Zod 스키마 (노드, 폼, 스트림 이벤트)
└── utils/                        # cn, API 클라이언트
```

## 설계 포인트

- **리렌더링 최소화**: 커스텀 노드·엣지·폼 필드·로그 행은 모두 `React.memo`로 감쌉니다. 폼 필드는 `control`을 props로 받아 자기 값이 바뀔 때만 다시 렌더링되고, 조건부 필드는 `useWatch`로 기준 필드 하나만 구독합니다.
- **로그 배치 커밋**: 스트림으로 들어온 로그는 스토어 밖 버퍼에 모았다가 애니메이션 프레임당 한 번만 커밋합니다. 최대 1만 줄까지 유지합니다.
- **SSE 재연결**: 연결이 끊기면 대기 시간을 두 배씩 늘리며 재연결하고(최대 재시도 횟수 제한), 연결되면 대기 시간을 초기화합니다. 콜백은 `useEffectEvent`로 읽어서 바뀌어도 재연결하지 않습니다.
- **스키마와 표시 정보 분리**: 검증 규칙(Zod 스키마)과 화면 표시 정보(`uiSchema`)를 따로 정의해 검증 로직에 UI 조건이 섞이지 않게 했습니다.

## 성능

production 빌드를 headless Chromium에서 측정한 결과입니다(rAF 프레임 간격과 long task 기준).

| 시나리오                | 300 노드 / 427 엣지  | 1000 노드 / 1477 엣지 |
| ----------------------- | -------------------- | --------------------- |
| 팬, 줌, 노드 드래그     | 60fps, long task 0건 | 59.5~60fps            |
| Stress run (초당 250줄) | 60fps                | 59.3fps               |
| 스트리밍 중 팬          | 60fps                | 60fps                 |

## 팀 규칙

- `className` 병합은 `cn()`으로만 합니다. `style={{}}` 인라인 스타일은 금지이며, 동적 값은 CSS 변수와 Tailwind 유틸로 처리합니다.
- `src/components/ui/`의 컴포넌트에는 같은 폴더에 `*.stories.tsx`가 있어야 합니다.
- 커밋 시 lint-staged(ESLint, Prettier)가 실행되고, push 시 `check-stories`와 테스트가 실행됩니다. 실패하면 커밋이나 push가 막힙니다.
- 스토어의 상태 변경 액션에는 유닛 테스트를 최소 1개 붙입니다.

## 알려진 한계

- 실행 취소/다시 실행은 스토어에 구현돼 있지만, 아직 단축키나 버튼이 연결되지 않아 화면에서 쓸 수 없습니다.
- 실행과 HIL 대기는 서버 메모리의 mock이라, 서버를 재시작하면 대기 중인 요청이 사라집니다.
