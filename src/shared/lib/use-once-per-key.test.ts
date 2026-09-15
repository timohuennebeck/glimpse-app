import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { useOncePerKey } from '@/shared/lib/use-once-per-key';

/** Renders the hook with a key we can change between renders. */
function harness(run: () => void) {
  function Probe({ value }: { value: string | null }) {
    useOncePerKey(value, run);
    return null;
  }
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(createElement(Probe, { value: null }));
  });
  return {
    setKey(value: string | null) {
      act(() => tree.update(createElement(Probe, { value })));
    },
  };
}

describe('useOncePerKey', () => {
  it('does not run while the key is null', () => {
    const run = jest.fn();
    harness(run);
    expect(run).not.toHaveBeenCalled();
  });

  it('runs once when a key arrives', () => {
    const run = jest.fn();
    const probe = harness(run);
    probe.setKey('a');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('does not run again for the same key, however often it re-renders', () => {
    const run = jest.fn();
    const probe = harness(run);
    probe.setKey('a');
    probe.setKey('a');
    probe.setKey('a');
    expect(run).toHaveBeenCalledTimes(1);
  });

  // The bug this hook exists for: a failed mutation rolls its optimistic patch
  // back, the condition that fired it becomes true again, and the effect
  // re-fires — forever. Returning to a key we already attempted must be inert.
  it('stays inert when a rollback restores a key it already attempted', () => {
    const run = jest.fn();
    const probe = harness(run);
    probe.setKey('a'); // condition true  -> fire
    probe.setKey(null); // optimistic patch clears it
    probe.setKey('a'); // failure rolls the patch back
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('runs again for genuinely new work', () => {
    const run = jest.fn();
    const probe = harness(run);
    probe.setKey('a');
    probe.setKey('b');
    expect(run).toHaveBeenCalledTimes(2);
  });
});
