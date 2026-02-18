type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === "TypeError" ||
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout")
  );
}

export async function runWithRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = Math.max(0, options.retries ?? 2);
  const baseDelayMs = Math.max(120, options.baseDelayMs ?? 280);
  let attempt = 0;

  for (;;) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableNetworkError(error) || attempt >= retries) {
        throw error;
      }
      const waitTime = baseDelayMs * (attempt + 1);
      attempt += 1;
      await delay(waitTime);
    }
  }
}
