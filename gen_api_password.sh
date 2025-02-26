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
password=$1
if [ -z "$password" ]; then
  echo "Usage: $0 <password>"
  exit 1
fi
bcrypted=$(htpasswd -nbB -C 12 user $password | awk -F: '{print $2}')
echo "/** This file was generated by gen_api_password.sh " > src/api_password.ts
echo "    Store key='USER:admin' value='$bcrypted' in your Cloudflare KV */" >> src/api_password.ts
echo "" >> src/api_password.ts
echo "/** The BCRYPTED_PASSWORD is used to authenticate the API */" >> src/api_password.ts
echo "export const BCRYPTED_PASSWORD:string='$bcrypted'" >> src/api_password.ts