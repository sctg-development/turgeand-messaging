#!/bin/bash
# Copyright (c) 2024 Ronan LE MEILLAT for SCTG Development
#
# Turgeand-messaging is free software: you can redistribute it and/or modify
# it under the terms of the Affero General Public License version 3 as
# published by the Free Software Foundation.
#
# Turgeand-messaging is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# Affero General Public License for more details.
#
# You should have received a copy of the Affero General Public License
# along with Turgeand-messaging. If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.

# Set the base URL of your worker
WORKER_URL="http://localhost:8787"
TWILIO_URL='/twilio/incoming'
TWILIO_READ_URL='/twilio/read'
# Generate a random string to use as a MessageSid   
MESSAGE_SID=SM$(LC_ALL=C tr -dc 'A-Z0-9' </dev/urandom | head -c 32)
# Test 1: Non-POST request (should return 405)
echo "Test 1: Non-POST request"
curl -i -X GET "${WORKER_URL}${TWILIO_URL}"
echo -e "\n"

# Test 2: POST request without MessageSid (should return 400)
echo "Test 2: POST request without MessageSid"
curl -i -X POST "${WORKER_URL}${TWILIO_URL}" \
  -F "From=+14017122661" \
  -F "To=+15558675310"
echo -e "\n"

# Test 3: Valid POST request (should return 200)
echo "Test 3: Valid POST request"
curl -i -X POST "${WORKER_URL}${TWILIO_URL}" \
  -F "MessageSid=$MESSAGE_SID" \
  -F "From=+14017122661" \
  -F "To=+15558675310" \
  -F "Body=Test message"
echo -e "\n"

# Test 4: POST request with all Twilio parameters
echo "Test 4: POST request with all Twilio parameters"
MESSAGE_SID=SM$(LC_ALL=C tr -dc 'A-Z0-9' </dev/urandom | head -c 32)
curl -i -X POST "${WORKER_URL}${TWILIO_URL}" \
  -F "MessageSid=$MESSAGE_SID" \
  -F "SmsSid=$MESSAGE_SID" \
  -F "SmsMessageSid=$MESSAGE_SID" \
  -F "AccountSid=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  -F "MessagingServiceSid=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  -F "From=+14017122661" \
  -F "To=+15558675310" \
  -F "Body=Ahoy! We can't wait to see what you build." \
  -F "NumMedia=0" \
  -F "NumSegments=1"
echo -e "\n"
