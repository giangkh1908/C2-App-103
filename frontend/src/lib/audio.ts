// Shared AudioContext singleton — tránh rò rỉ bộ nhớ khi tạo mới mỗi lần phát âm thanh
let sharedCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === "suspended") sharedCtx.resume();
  return sharedCtx;
}
