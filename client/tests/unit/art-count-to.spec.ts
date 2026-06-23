import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ArtCountTo from '@/components/core/text-effect/art-count-to/index.vue';

describe('ArtCountTo', () => {
  it('reset 后动画结束展示目标值', async () => {
    vi.useFakeTimers();
    const wrapper = mount(ArtCountTo, {
      props: {
        target: 0,
        autoStart: false,
        disabled: true,
        decimals: 0,
        duration: 100
      }
    });

    await flushPromises();
    const vm = wrapper.vm as unknown as { reset: (n?: number) => void };
    vm.reset(4242);
    await flushPromises();
    await vi.advanceTimersByTimeAsync(150);
    await flushPromises();

    expect(wrapper.text()).toContain('4242');
    vi.useRealTimers();
  });
});
