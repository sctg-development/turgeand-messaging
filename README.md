# Twilio SMS Cloudflare Worker

This Cloudflare Worker is designed to handle incoming SMS messages from Twilio webhooks and store them in Cloudflare KV (Key-Value) storage. It also provides functionality to retrieve stored messages for a given destination number.

## Features

- Receives and stores incoming SMS data from Twilio webhooks
- Retrieves stored SMS messages for a specific recipient
- Basic authentication for accessing stored messages

## Setup

1. Deploy this worker to your Cloudflare account.
2. Set up a KV namespace called `TWILIO_KV` in your Cloudflare account.
3. Configure your Twilio account to send webhook requests to your worker's URL for incoming SMS messages.

## Usage

### Storing Incoming SMS

When Twilio receives an SMS, it will send a POST request to your worker's `/twilio/incoming` endpoint. The worker will store the message data in the KV store with a key in the format: `INCOMING:{recipient_number}:{MessageSid}`.

Simulate Twilio webhook request with cURL:

```bash
curl -i -X POST "${WORKER_URL}${TWILIO_URL}" \
  -F "MessageSid=$MESSAGE_SID" \
  -F "From=+14017122661" \
  -F "To=+15558675310" \
  -F "Body=Test message"
```

### Retrieving Stored Messages

To retrieve stored messages for a specific recipient:

1. Send a GET request to `/twilio/read?to={recipient_number}`
2. Include an `Authorization` header with Basic Auth credentials

Example:

```http
GET /twilio/read?to=+1234567890
Authorization: Basic base64(username:password)
```

The worker will return a JSON array of stored messages for the specified recipient.

## Authentication

The worker uses basic authentication to protect access to stored messages. To set up authentication:

1. Generate a bcrypt hash of the desired password
2. Store the hash in the KV store with the key `USER:{username}`

Sample code to generate a bcrypt hash with a 12 cost factor using `htpasswd`:

```bash
password="your_password"
bcrypted=$(htpasswd -nbB -C 12 user $password | awk -F: '{print $2}')
echo $bcrypted
```

## Error Handling

- 400 Bad Request: Returned if the MessageSid is missing from the Twilio webhook
- 401 Unauthorized: Returned if authentication fails when retrieving messages
- 405 Method Not Allowed: Returned for unsupported HTTP methods

## Dependencies

- `@cloudflare/workers-types`: TypeScript definitions for Cloudflare Workers
- `bcrypt-ts`: TypeScript implementation of bcrypt for password hashing

## Development

To modify or extend this worker:

1. Clone the repository
2. Install dependencies with `npm install`
3. Make your changes to `index.ts`
4. Test your changes locally using Wrangler
5. Deploy the updated worker to Cloudflare

### Sample wrangler.toml

Our wrangler.toml is not included in the repository. Here is a sample configuration, just edit your kv namespace id and name to match your own configuration:

```toml
#:schema node_modules/wrangler/config-schema.json
name = "turgeand-messaging"
main = "src/index.ts"
compatibility_date = "2024-07-01"
compatibility_flags = ["nodejs_compat"]
kv_namespaces = [
  { binding = "TWILIO_KV", id = "085b7cbf251c15d1c2e1e5c063ac86b5" }
]
```

## Security Considerations

- Ensure that your Cloudflare Worker URL is properly secured and only accessible by Twilio
- Regularly rotate your authentication credentials
- Monitor your worker's logs for any suspicious activity

## License

This project is licensed under the Affero GPL v3 License - see the [LICENSE](LICENSE.md) file for details.

