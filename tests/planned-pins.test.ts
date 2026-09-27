import { describe, expect, it } from 'vitest';
import { flowDocument } from '../shared/flow-document';
import { analyze } from '../shared/graph';
import {
  addProvisionalPin,
  emptyProject,
  newIdea,
  placeIdea,
  placePin,
  setDrawing,
  type Project,
} from '../shared/model';

const asset = {
  id: 'a',
  name: 'home.png',
  file: `${'a'.repeat(64)}.webp`,
  width: 100,
  height: 80,
  importedAt: 'now',
};
/** Two planned frames and an idea on the first that leads to the second. */
function planned(): Project {
  const p = emptyProject('Strings', 'strings');
  p.assets = [asset];
  p.screens = [
    { id: 'home', assetId: null, title: 'Home', purpose: 'Start', entry: true, role: 'screen' },
    { id: 'chats', assetId: null, title: 'Chats', purpose: 'Talk', entry: false, role: 'screen' },
  ];
  p.layout = { home: { x: 0, y: 0, width: 360 }, chats: { x: 450, y: 0, width: 360 } };
  p.ideas = [
    newIdea(
      { title: 'Open your conversations', detail: 'One list', screenId: 'home', leadsTo: 'chats' },
      'Agent',
      'idea-1',
    ),
  ];
  return p;
}

describe('strings on planned frames', () => {
  it('places an idea on a frame without a drawing as a provisional pin with its yarn', () => {
    const p = placeIdea(planned(), 'idea-1', null, { pin: 'pin-1', transition: 'yarn-1' });
    const pin = p.pins.find((v) => v.id === 'pin-1')!;
    expect(pin.provisional).toBe(true);
    expect(pin).toMatchObject({
      screenId: 'home',
      x: 0.86,
      y: 0.12,
      title: 'Open your conversations',
    });
    expect(p.transitions).toHaveLength(1);
    expect(p.transitions[0]).toMatchObject({ pinId: 'pin-1', target: 'chats', navigation: 'push' });
    expect(p.ideas[0].pinId).toBe('pin-1');
    // The next pin takes the next slot.
    const more = addProvisionalPin(p, 'home', 'pin-2');
    expect(more.pins.find((v) => v.id === 'pin-2')).toMatchObject({
      x: 0.86,
      y: 0.28,
      provisional: true,
    });
  });
  it('asks the user to place the pin once the drawing arrives, and stops once it is placed', () => {
    const p = placeIdea(planned(), 'idea-1', null, { pin: 'pin-1', transition: 'yarn-1' });
    const rules = (q: Project) => analyze(q).map((i) => i.rule);
    expect(rules(p)).toContain('needs-drawing');
    expect(rules(p)).not.toContain('pin-not-placed');
    const drawn = setDrawing(p, 'home', 'web', 'a');
    expect(rules(drawn)).toContain('pin-not-placed');
    expect(rules(drawn)).not.toContain('needs-drawing:home');
    const placed = placePin(drawn, 'pin-1', { x: 0.3, y: 0.4 });
    expect(placed.pins[0]).toMatchObject({ x: 0.3, y: 0.4 });
    expect(placed.pins[0].provisional).toBeUndefined();
    expect(rules(placed)).not.toContain('pin-not-placed');
    // The yarn survived the whole way.
    expect(placed.transitions).toHaveLength(1);
  });
  it('says so in the flow document', () => {
    const p = placeIdea(planned(), 'idea-1', null, { pin: 'pin-1', transition: 'yarn-1' });
    const doc = flowDocument(p);
    expect(doc).toContain('Its pins below are provisional');
    expect(doc).toContain('(provisional: not yet placed on the drawing)');
  });
  it('still places on a drawing exactly where the user clicked', () => {
    const p = setDrawing(planned(), 'home', 'web', 'a');
    const placed = placeIdea(
      p,
      'idea-1',
      { x: 0.5, y: 0.5 },
      { pin: 'pin-1', transition: 'yarn-1' },
    );
    expect(placed.pins[0]).toMatchObject({ x: 0.5, y: 0.5 });
    expect(placed.pins[0].provisional).toBeUndefined();
  });
});
