export function shouldRunOnboarding(input: {
  onboardingCompletedAt: string | null;
  onboardingSkippedAt: string | null;
  clientCount: number;
}) {
  return !input.onboardingCompletedAt && !input.onboardingSkippedAt && input.clientCount === 0;
}
