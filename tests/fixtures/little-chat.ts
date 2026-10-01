/**
 * Little chat: a four-screen test board with branches, an intentional one-way login and authored
 * Back actions. It is a test fixture only; the app ships without sample boards. Its sketches are
 * drawn in code below. Tests create it through the API with `createLittleChat` (tests/e2e) or the
 * store (tests/store.test.ts).
 */
import {
  defaultColorLabels,
  emptyProject,
  type Asset,
  type Project,
  type Transition,
} from '../../shared/model';
import type { Store } from '../../server/store';
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

// Original code-authored sketch fixtures, deliberately rough enough to feel like paper wireframes.
const header = (title: string, w = 760, h = 550) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><pattern id="paper" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#d7e0dd" stroke-opacity=".38" stroke-width=".6"/></pattern><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" xChannelSelector="R" yChannelSelector="G"/></filter></defs><rect width="100%" height="100%" fill="#fdfbf4"/><rect width="100%" height="100%" fill="url(#paper)"/><g fill="none" stroke="#59615d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#rough)"><path d="M22 42L738 39 736 ${h - 22} 24 ${h - 20}z"/><path d="M23 72L736 70"/><circle cx="40" cy="56" r="4"/><circle cx="57" cy="56" r="4"/><circle cx="74" cy="56" r="4"/></g><g fill="#4e5753" font-family="Chalkboard, Comic Sans MS, cursive" font-size="21"><text x="310" y="61" font-size="17">${title}</text>`;
const end = '</g></svg>';
const line = (x: number, y: number, w: number) =>
  `<path d="M${x} ${y}q${w / 2} -2 ${w} 0" stroke="#9ba09a" stroke-width="2" fill="none"/>`;
const rect = (x: number, y: number, w: number, h: number, fill = 'none', stroke = '#6d746d') =>
  `<path d="M${x} ${y + 2}L${x + w} ${y} ${x + w - 1} ${y + h} ${x + 1} ${y + h - 1}z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
export const demoArt: Record<string, string> = {
  '01-welcome.svg':
    header('little chat') +
    `<text x="285" y="145" font-size="35">hello again.</text><text x="240" y="183" fill="#919587" font-size="18">a little place to keep in touch</text>` +
    rect(220, 230, 320, 49) +
    `<text x="239" y="261">your email</text>` +
    rect(220, 300, 320, 49) +
    `<text x="239" y="331">password · · · · ·</text>` +
    rect(220, 385, 320, 57, '#e0e6d8') +
    `<text x="322" y="421">let me in →</text><text x="266" y="486" font-size="18">new here? make an account</text>` +
    end,
  '02-inbox.svg':
    header('little chat / inbox') +
    `<path d="M260 73L259 528" stroke="#82877c" stroke-width="2"/><text x="43" y="116" font-size="27">your people</text>` +
    rect(39, 139, 201, 35) +
    `<text x="52" y="164" font-size="17">⌕ find a friend</text>` +
    rect(35, 193, 214, 76, '#e5e9dc', '#a0aa94') +
    [221, 307, 393]
      .map(
        (y, i) =>
          `<circle cx="67" cy="${y + 8}" r="19" fill="none" stroke="#788373" stroke-width="2"/><path d="M56 ${y + 12}q11 -12 22 0" fill="none" stroke="#788373"/><text x="99" y="${y + 3}" font-size="21">${['Alex Rivera', 'Sam Chen', 'Jamie Lee'][i]}</text><text x="100" y="${y + 27}" fill="#979b8e" font-size="15">${['see you tomorrow :)', 'sent you a sketch', 'last seen 2h ago'][i]}</text>`,
      )
      .join('') +
    `<path d="M43 461L235 458" stroke="#969c91"/><text x="52" y="498" font-size="18">⚙ your settings</text><path d="M432 245q-35 0 -35 35v37q0 27 35 27h77l30 23v-25q21-7 21-26v-39q0-30-37-31z" fill="none" stroke="#9bA590" stroke-width="3"/><text x="412" y="304" font-size="36">· · ·</text><text x="352" y="402" font-size="24">pick a person, say hello.</text><text x="455" y="470" font-size="19" fill="#9e725d" transform="rotate(-4 455 470)">← recent chats here</text>` +
    end,
  '03-conversation.svg':
    header('little chat / conversation') +
    `<text x="48" y="113" font-size="26">←</text><circle cx="109" cy="109" r="18" fill="none" stroke="#75806d"/><text x="144" y="107" font-size="25">Alex Rivera</text><text x="145" y="132" font-size="15" fill="#8d9983">● around right now</text><path d="M26 154L734 152" stroke="#8f9788"/>` +
    rect(55, 194, 370, 72, '#eef0e7', '#bcc3b0') +
    `<text x="77" y="224">hey! how's the new project?</text><text x="78" y="250" font-size="14" fill="#8b9680">10:42</text>` +
    rect(290, 290, 410, 83, '#e0e8d8', '#99ab8b') +
    `<text x="310" y="322">still a few sketches on a board...</text><text x="311" y="350">but I think we're onto something.</text>` +
    rect(56, 405, 250, 43, '#eef0e7', '#bcc3b0') +
    `<text x="77" y="434">can't wait to see it!</text>` +
    rect(42, 470, 595, 42) +
    `<text x="59" y="498" fill="#a0a497">say something nice...</text>` +
    rect(652, 470, sixty(), 42, '#e0e8d8') +
    `<text x="670" y="498">↑</text>` +
    end,
  '04-blocked.svg':
    header('little chat / unavailable', 760, 430) +
    `<text x="47" y="116" font-size="26">←</text><circle cx="379" cy="159" r="31" fill="none" stroke="#b3937e" stroke-width="3"/><path d="M358 181L400 137" stroke="#b3937e" stroke-width="3"/><text x="217" y="232" font-size="30">this chat is unavailable</text><text x="225" y="269" font-size="19" fill="#9a9285">you can't message this person.</text>` +
    rect(237, 313, 290, 54, '#efe5d6', '#baaa91') +
    `<text x="281" y="348">back to your people</text>` +
    end,
};
function sixty() {
  return 60;
}

/** Builds the board through a store, the way the API does: a blank board, its sketches, its graph. */
export async function createLittleChatIn(store: Store, name = 'Little chat') {
  const blank = await store.create(name);
  const assets: Asset[] = [];
  for (const [file, svg] of Object.entries(demoArt))
    assets.push(await store.importImage(Buffer.from(svg), file));
  return store.save({ ...demoProject(assets, blank.id), name, revision: blank.revision });
}
