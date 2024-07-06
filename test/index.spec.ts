// Copyright (c) 2024 Ronan LE MEILLAT for SCTG Development
//
// Turgeand-messaging is free software: you can redistribute it and/or modify
// it under the terms of the Affero General Public License version 3 as
// published by the Free Software Foundation.
//
// Turgeand-messaging is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// Affero General Public License for more details.
//
// You should have received a copy of the Affero General Public License
// along with Turgeand-messaging. If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { TwilioWebhookParams } from '../src/index'

const BCRYPTED_PASSWORD = "$2y$12$CYdzVKa7KSaJOwkRtsf2aOYePet4NxQBEtrSQUFFNmArL9upEYO2y"; // correspond to "test"
async function get(): Promise<string[]> {
  return (await env.TWILIO_KV.get("list", "json")) ?? [];
}

// Define a mock URL that represents our worker's endpoint
const WORKER_URL = 'http://sms.example.com'
const TWILIO_URL = '/twilio/incoming'
const TWILIO_GET = '/twilio/read'

async function initAdmin() {
  await env.TWILIO_KV.put("USER:admin", BCRYPTED_PASSWORD);
}

async function goodRequest(messageSid: string): Promise<Response> {
  const formData = new FormData()
  formData.append('MessageSid', messageSid);
  formData.append('From', '+14017122661')
  formData.append('To', '+15558675310')
  formData.append('Body', 'Test message')

  const request = new Request(`${WORKER_URL}${TWILIO_URL}`, {
    method: 'POST',
    body: formData,
  })

  const response = await SELF.fetch(`${WORKER_URL}${TWILIO_URL}`, {
    method: 'POST',
    body: formData,
  })
  return response
}

describe('Twilio SMS Webhook Worker', () => {
  beforeAll(() => initAdmin());

  beforeEach(() => {
    vi.resetAllMocks();
  })

  it('should return 405 for non-POST requests', async () => {
    const request = new Request(`${WORKER_URL}${TWILIO_URL}`, { method: 'GET' })
    const response = await SELF.fetch(request)

    expect(response.status).toBe(405)
    expect(await response.text()).toBe('Method Not Allowed')
  })

  it('should return 400 if MessageSid is missing', async () => {
    const formData = new FormData()
    formData.append('From', '+14017122661')
    formData.append('To', '+15558675310')

    const request = new Request(`${WORKER_URL}${TWILIO_URL}`, {
      method: 'POST',
      body: formData,
    })

    const response = await SELF.fetch(request)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Missing MessageSid')
  })

  it('should store SMS data in KV and return 200', async () => {
    const messageSid = `SM${Math.random().toString(36).slice(2)}`
    const response = await goodRequest(messageSid)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Message correctly delivered')
    const storedData = await env.TWILIO_KV.get<Partial<TwilioWebhookParams>>(`INCOMING:+15558675310:${messageSid}`, 'json')
    expect(storedData?.MessageSid).toBe(messageSid);
    expect(storedData?.From).toBe('+14017122661');
    expect(storedData?.To).toBe('+15558675310');
    expect(storedData?.Body).toBe('Test message');
  })

  it('should return 200 if login is correct', async () => {
    const authorization = `admin:test`
    const encoded = btoa(authorization)
    const response = await SELF.fetch(`${WORKER_URL}${TWILIO_GET}`, { headers: { Authorization: `Basic ${encoded}` } })
    expect(response.status).toBe(200)
  })

  it('should return 401 if login is incorrect', async () => {
    const authorization = `admin:wrong`
    const encoded = btoa(authorization)
    const response = await SELF.fetch(`${WORKER_URL}${TWILIO_GET}`, { headers: { Authorization: `Basic ${encoded}` } })
    expect(response.status).toBe(401)
  })

  it('should return a list of SMS data', async () => {
    await goodRequest('AAAAASM1')
    await goodRequest('SM2')
    await goodRequest('SM3')
    const authorization = `admin:test`
    const encoded = btoa(authorization)
    const storedData = await env.TWILIO_KV.list<Partial<TwilioWebhookParams>>({ prefix: `INCOMING:+15558675310:` })
    expect(storedData?.keys.length).toBeGreaterThan(2)
    const phoneNumber = encodeURIComponent('+15558675310');
    const response = await SELF.fetch(`${WORKER_URL}${TWILIO_GET}?to=${phoneNumber}`, { headers: { Authorization: `Basic ${encoded}` } });
    const returnedData = await response.json() as Partial<TwilioWebhookParams>[];
    expect(response.status).toBe(200)
    expect(returnedData.length).toBe(storedData.keys.length)
    expect(returnedData[0].MessageSid).toBe('AAAAASM1')
    expect(returnedData[0].From).toBe('+14017122661')
    expect(returnedData[0].To).toBe('+15558675310')
    expect(returnedData[0].Body).toBe('Test message')
    expect(returnedData[1].From).toBe('+14017122661')
    expect(returnedData[1].To).toBe('+15558675310')
    expect(returnedData[1].Body).toBe('Test message')
    expect(returnedData[2].From).toBe('+14017122661')
    expect(returnedData[2].To).toBe('+15558675310')
    expect(returnedData[2].Body).toBe('Test message')
  })

})