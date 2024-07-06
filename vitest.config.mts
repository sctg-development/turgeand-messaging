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
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		silent: false,
		poolOptions: {
			workers: {
				main: "./src/index.ts",
				wrangler: { configPath: './wrangler.toml' },
				isolatedStorage: false,
				singleWorker: false
			},
		},
	},
});
