// Entry point to translate HTTP to the application layer and back
// Each request writes one structured log line for easy log analysis
import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceModelRepo } from '../config/appServices';
import { listDeviceModels } from '../app/list-device-models';

// Flattens an error to one line (message + top of stack)
const describeError = (error: unknown) =>
  error instanceof Error
    ? {
        errorName: error.name,
        errorMessage: error.message,
        stack: (error.stack ?? '')
          .split('\n')
          .slice(0, 4)
          .map((line) => line.trim())
          .join(' | '),
      }
    : { errorName: 'NonError', errorMessage: String(error), stack: '' };

export async function listDevicesHttp(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const startedAt = Date.now();
  try {
    const deviceModels = await listDeviceModels({ repo: getDeviceModelRepo() });
    const durationMs = Date.now() - startedAt;

    if (deviceModels.length === 0) {
      // AKA "not seeded" for deployed env
      context.warn(
        JSON.stringify({ event: 'devices.list.empty', count: 0, durationMs }),
      );
    } else {
      context.info(
        JSON.stringify({
          event: 'devices.list.ok',
          count: deviceModels.length,
          durationMs,
        }),
      );
    }
    return { status: 200, jsonBody: deviceModels };
  } catch (error) {
    // Full detail goes to the log while the caller only gets a safe & consistent error
    context.error(
      JSON.stringify({
        event: 'devices.list.failed',
        durationMs: Date.now() - startedAt,
        ...describeError(error),
      }),
    );
    return {
      status: 500,
      jsonBody: {
        error: { code: 'internal_error', message: 'Could not list devices.' },
      },
    };
  }
}

app.http('list-devices-http', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'devices',
  handler: listDevicesHttp,
});