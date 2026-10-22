// Entry point: translates HTTP to the application layer and back
import { app } from '@azure/functions';
import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getDeviceModelRepo } from '../config/appServices';
import { listDeviceModels } from '../app/list-device-models';

export async function listDevicesHttp(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const deviceModels = await listDeviceModels({ repo: getDeviceModelRepo() });
    return { status: 200, jsonBody: deviceModels };
  } catch (error) {
    // Logs the real cause for admins and send the caller a safe, consistent error
    context.error('GET /devices failed', error);
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