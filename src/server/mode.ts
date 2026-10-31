export function assertDemoMode() {
  if ((process.env.APP_MODE ?? 'demo') !== 'demo') {
    throw new Error('Live mode is not implemented. No transaction was submitted.');
  }
}
