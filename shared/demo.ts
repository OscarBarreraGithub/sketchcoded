import {
  defaultColorLabels,
  emptyProject,
  type Asset,
  type Project,
  type Transition,
} from './model';
export function demoProject(assets: Asset[], id?: string): Project {
  const p = emptyProject('Little chat', id);
  p.assets = assets;
  const image = (prefix: string) => assets.find((a) => a.name.startsWith(prefix))!.id;
  p.screens = [
    {
      id: 'welcome',
      assetId: image('01'),
      title: 'A warm welcome',
      purpose:
        'Sign in to your account. Successful authentication replaces the signed-out context.',
      entry: true,
      role: 'auth',
    },
    {
      id: 'inbox',
      assetId: image('02'),
      title: 'Your people',
      purpose: 'Recent conversations, with a name, avatar, last message, and presence.',
      entry: false,
      role: 'screen',
    },
    {
      id: 'conversation',
      assetId: image('03'),
      title: 'A little conversation',
      purpose: 'A reusable conversation screen for the selected person. Load by conversationId.',
      entry: false,
      role: 'screen',
    },
    {
      id: 'blocked',
      assetId: image('04'),
      title: 'When a chat is blocked',
      purpose:
        'Explain that this person cannot be messaged without disclosing private account details.',
      entry: false,
      role: 'screen',
    },
  ];
  p.layout = {
    welcome: { x: 30, y: 130, width: 250 },
    inbox: { x: 385, y: 85, width: 345 },
    conversation: { x: 885, y: 20, width: 330 },
    blocked: { x: 875, y: 475, width: 290 },
  };
  p.pins = [
    {
      id: 'login',
      screenId: 'welcome',
      x: 0.5,
      y: 0.753,
      title: 'Let me in',
      description:
        'Submit the credentials. When sign-in succeeds, show recent conversations. Invalid credentials stay here with an inline error.',
    },
    {
      id: 'open-chat',
      screenId: 'inbox',
      x: 0.185,
      y: 0.421,
      title: 'Open a recent chat',
      description:
        'This is a panel of recent chats. Clicking a row opens the conversation for that person, unless the relationship is blocked.',
    },
    {
      id: 'chat-back',
      screenId: 'conversation',
      x: 0.077,
      y: 0.196,
      title: 'Back to your people',
      description: 'Return to the conversation list.',
    },
    {
      id: 'blocked-back',
      screenId: 'blocked',
      x: 0.497,
      y: 0.791,
      title: 'Back to your people',
      description: 'Leave the unavailable conversation and return to the list.',
    },
  ];
  const edge = (
    id: string,
    pinId: string,
    target: string | null,
    summary: string,
    extra: Partial<Transition> = {},
  ): Transition => ({
    id,
    pinId,
    target,
    summary,
    condition: '',
    logic: '',
    context: '',
    fallback: false,
    navigation: 'push',
    color: 'red',
    ...extra,
  });
  p.transitions = [
    edge('signed-in', 'login', 'inbox', 'Signed in', {
      navigation: 'reset',
      condition: 'Credentials are valid and a session has been established.',
      logic:
        'Clear the signed-out history. Invalid credentials remain on the welcome screen with an inline error.',
    }),
    edge('chat-allowed', 'open-chat', 'conversation', 'You can message them', {
      condition: 'Neither participant has blocked the other and the conversation is available.',
      logic:
        'Load messages for the selected conversation. Show loading and retry states within this screen.',
      context: 'conversationId, selectedUserId',
    }),
    edge('chat-blocked', 'open-chat', 'blocked', 'This person is blocked', {
      condition: 'Either participant has blocked the other, or messaging is unavailable.',
      logic: 'Show a neutral unavailable message; do not expose who blocked whom.',
      context: 'selectedUserId',
      fallback: true,
      color: 'gold',
    }),
    edge('chat-return', 'chat-back', null, 'Back to your people', {
      navigation: 'back',
      color: 'olive',
    }),
    edge('blocked-return', 'blocked-back', null, 'Back to your people', {
      navigation: 'back',
      color: 'olive',
    }),
  ];
  p.colorLabels = { ...defaultColorLabels };
  delete p.colorLabels.violet;
  delete p.colorLabels.teal;
  return p;
}
