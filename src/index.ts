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
import { KVNamespace } from '@cloudflare/workers-types'
import { compareSync } from "bcrypt-ts";

interface Env {
	TWILIO_KV: KVNamespace
}

/**
 * Interface for the Twilio webhook parameters.
 */
export interface TwilioWebhookParams {
	MessageSid: string
	SmsSid: string
	SmsMessageSid: string
	AccountSid: string
	MessagingServiceSid: string
	From: string
	To: string
	Body: string
	NumMedia: string
	NumSegments: string
}

const paramsInit: Partial<TwilioWebhookParams> = Object.keys({
	MessageSid: '',
	SmsSid: '',
	SmsMessageSid: '',
	AccountSid: '',
	MessagingServiceSid: '',
	From: '',
	To: '',
	Body: '',
	NumMedia: '',
	NumSegments: '',
}).reduce((acc, key) => {
	acc[key as keyof TwilioWebhookParams] = '';
	return acc;
}, {} as Partial<TwilioWebhookParams>);


const APITOKEN = "";

/**
 * Stores SMS data in a key-value store.
 * Twilio MessageSid will be prefixed with 'INCOMING:' to create the key.
 * 
 * @param {Request} request - The incoming request object.
 * @param {Env} env - The environment object.
 * @returns {Promise<Response>} A promise that resolves to a response indicating the status of the operation.
 */
async function storeSMSInKV(request: Request, env: Env): Promise<Response> {
	const formData = await request.formData()
	const params: Partial<TwilioWebhookParams> = { ...paramsInit };

	for (const [key, value] of formData.entries()) {
		if (key in params) {
			params[key as keyof TwilioWebhookParams] = value.toString()
		}
	}

	const messageSid = params.MessageSid;
	if (!messageSid) {
		return new Response('Missing MessageSid', { status: 400 })
	}

	try {
		const messageID = `INCOMING:${params.To}:${messageSid}`
		await env.TWILIO_KV.put(messageID, JSON.stringify(params))
		return new Response(`Message correctly delivered`, { status: 200 })
	} catch (error) {
		console.error('Error storing SMS data:', error)
		return new Response('Internal Server Error', { status: 500 })
	}
}

/** Check if the given string matches the stored bcrypt hash 
 * 
 * @param {string} password - The password to check.
 * @param {string} hash - The stored bcrypt hash.
 * @returns {boolean} A boolean indicating if the password matches the hash.
 */
function checkHash(password: string, hash: string): boolean {
	return compareSync(password, hash);
}

/** Check if the authorization header is valid
 * First decode the base64 string, next split the string with ':' to get the user and password
 * Retrieve the value corresponding to the key `USER:${user}` in the KV store
 * If the value exists, check with the `checkHash` function if the password is correct
 * 
 * @param {Env} env - The environment object.
 * @param {string} authorization - The authorization header value.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the authorization is correct.
 */
async function checkAuthorization(env: Env, authorization: string): Promise<boolean> {
	// Check if the authorization header is valid
	if (!authorization.startsWith('Basic ')) {
		return false;
	}
	// Remove the 'Basic ' prefix
	const authorizationb64 = authorization.replace('Basic ', '');
	const decoded = atob(authorizationb64);
	const [user, password] = decoded.split(':');
	console.log(`USER:${user} PASSWORD:${password}`);
	const storedHash = await env.TWILIO_KV.get(`USER:${user}`);
	if (storedHash) {
		return checkHash(password, storedHash);
	}
	return false;
}

/**
 * Retrieves messages from the Twilio webhook storage for a specific recipient.
 *
 * @param {Env} env - The environment object containing the Twilio KV store.
 * @param {string} to - The recipient's phone number.
 * @returns {Promise<Partial<TwilioWebhookParams>[]>} A promise that resolves to an array of partial Twilio webhook parameters.
 */
async function getMessages(env: Env, to: string): Promise<Partial<TwilioWebhookParams>[]> {
	const messages: Partial<TwilioWebhookParams>[] = [];
	const prefix = `INCOMING:${to}:`;
	const stored = await env.TWILIO_KV.list({ prefix: prefix });

	// console.log(stored);
	for (const key of stored.keys) {
		const message = await env.TWILIO_KV.get<Partial<TwilioWebhookParams>>(key.name, 'json');
		if (message) {
			messages.push(message);
		}
	}
	return messages;
}

export default {
	/**
	 * Fetch event handler for the Twilio SMS webhook worker.
	 *
	 * @param {Request} request - The incoming request object.
	 * @param {Env} env - The environment object containing the Twilio KV store.
	 * @returns {Promise<Response>} A promise that resolves to a response object.
	 */
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (request.method === 'POST' && url.pathname === '/twilio/incoming') {
			return storeSMSInKV(request, env);
		}
		if (request.method === 'GET') {
			if (url.pathname === '/twilio/read') {
				const authorization = request.headers.get('Authorization');
				if (authorization) {
					const isValid = await checkAuthorization(env, authorization);
					if (isValid) {
						const to = url.searchParams.get('to');
						if (to) {
							// console.log(to);
							const messages = await getMessages(env, to);
							return new Response(JSON.stringify(messages), { status: 200, headers: { 'Content-Type': 'application/json' }});
						}
						return new Response('Authorized', { status: 200 });
					}
					return new Response('Unauthorized', { status: 401 });
				}
			}
			return new Response('Method Not Allowed', { status: 405 })
		}
		return new Response('Method Not Allowed', { status: 405 })
	},
}