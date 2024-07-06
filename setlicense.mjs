/*!
=========================================================
* © 2024 Ronan LE MEILLAT for SCTG Development
=========================================================
* RUN WITH
* npx gulp -f setlicense.mjs licenses
*/
import fs from 'fs'
import gulp from 'gulp'
import gap from 'gulp-append-prepend'
import gulpif from 'gulp-if'

function checkCopyright(file) {
  const content = fs.readFileSync(file.path, 'utf8')
  return !content.includes('Ronan LE MEILLAT for SCTG Development')
}

const copyrightText = `// Copyright (c) 2024 Ronan LE MEILLAT for SCTG Development
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
// along with Turgeand-messaging. If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.`

const copyrightBash = `#!/bin/bash
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
# along with Turgeand-messaging. If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.`

gulp.task('licenses', async function () {
  // this is to add Copyright in the production mode for the minified js
  gulp
    .src(['**/*.ts','**/*.mts'], { base: './' })
    .pipe(gulpif(checkCopyright, gap.prependText(copyrightText)))
    .pipe(gulp.dest('./', { overwrite: true }))

  gulp
    .src(['**/*.sh'], { base: './' })
    .pipe(gulpif(checkCopyright, gap.prependText(copyrightBash)))
    .pipe(gulp.dest('./', { overwrite: true }))
  return
})
