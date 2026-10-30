export function wireCustomerStoriesScrollbar(root: HTMLElement): () => void {
  const slider = root.querySelector<HTMLElement>('.swiper-slider-comparison-slider');
  const bar = root.querySelector<HTMLElement>('#scrollbar-comparison-slider .swiper-scrollbar');
  if (!slider || !bar) return () => undefined;

  const thumb = document.createElement('div');
  thumb.className = 'swiper-scrollbar-drag';
  bar.replaceChildren(thumb);
  bar.style.cssText = 'position:relative;height:8px;border-radius:999px;background:#d9d9d9;cursor:pointer;touch-action:none;user-select:none;';
  thumb.style.cssText = 'position:absolute;left:0;top:0;height:100%;border-radius:inherit;background:#1b1b1b;cursor:grab;';
  bar.tabIndex = 0;
  bar.setAttribute('role', 'scrollbar');
  bar.setAttribute('aria-label', 'Customer stories');
  bar.setAttribute('aria-orientation', 'horizontal');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  if (slider.id) bar.setAttribute('aria-controls', slider.id);

  const update = () => {
    const max = Math.max(0, slider.scrollWidth - slider.clientWidth);
    const width = bar.clientWidth;
    const thumbWidth = max ? Math.min(width, Math.max(36, width * slider.clientWidth / slider.scrollWidth)) : width;
    const progress = max ? Math.max(0, Math.min(1, slider.scrollLeft / max)) : 0;
    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${progress * (width - thumbWidth)}px)`;
    bar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  };

  let pointer: number | null = null;
  let offset = 0;
  let previousSnap = '';
  let previousBehavior = '';
  const move = (x: number) => {
    const travel = bar.clientWidth - thumb.offsetWidth;
    const position = Math.max(0, Math.min(travel, x - bar.getBoundingClientRect().left - offset));
    slider.scrollLeft = travel > 0 ? position / travel * (slider.scrollWidth - slider.clientWidth) : 0;
    update();
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || pointer !== null) return;
    event.preventDefault();
    update();
    pointer = event.pointerId;
    offset = event.target === thumb ? event.clientX - thumb.getBoundingClientRect().left : thumb.offsetWidth / 2;
    previousSnap = slider.style.scrollSnapType;
    previousBehavior = slider.style.scrollBehavior;
    slider.style.scrollSnapType = 'none';
    slider.style.scrollBehavior = 'auto';
    bar.setPointerCapture(pointer);
    thumb.style.cursor = 'grabbing';
    move(event.clientX);
  };
  const drag = (event: PointerEvent) => {
    if (event.pointerId === pointer) move(event.clientX);
  };
  const restore = () => {
    if (pointer === null) return;
    const capturedPointer = pointer;
    pointer = null;
    if (bar.hasPointerCapture(capturedPointer)) bar.releasePointerCapture(capturedPointer);
    slider.style.scrollSnapType = previousSnap;
    slider.style.scrollBehavior = previousBehavior;
    thumb.style.cursor = 'grab';
  };
  const end = (event: PointerEvent) => {
    if (event.pointerId === pointer) restore();
  };
  const keydown = (event: KeyboardEvent) => {
    const max = Math.max(0, slider.scrollWidth - slider.clientWidth);
    const step = Math.max(280, slider.clientWidth * 0.8);
    const targets: Record<string, number> = {
      ArrowLeft: slider.scrollLeft - step, ArrowRight: slider.scrollLeft + step,
      Home: 0, End: max,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    slider.scrollTo({ left: Math.max(0, Math.min(max, targets[event.key])), behavior: 'smooth' });
  };

  slider.addEventListener('scroll', update, { passive: true });
  bar.addEventListener('pointerdown', down);
  bar.addEventListener('pointermove', drag);
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  bar.addEventListener('lostpointercapture', end);
  bar.addEventListener('keydown', keydown);
  const observer = new ResizeObserver(update);
  observer.observe(slider);
  observer.observe(bar);
  const wrapper = slider.querySelector<HTMLElement>('.swiper-wrapper');
  if (wrapper) observer.observe(wrapper);
  update();

  return () => {
    restore();
    observer.disconnect();
    slider.removeEventListener('scroll', update);
    bar.removeEventListener('pointerdown', down);
    bar.removeEventListener('pointermove', drag);
    bar.removeEventListener('pointerup', end);
    bar.removeEventListener('pointercancel', end);
    bar.removeEventListener('lostpointercapture', end);
    bar.removeEventListener('keydown', keydown);
    thumb.remove();
  };
}
