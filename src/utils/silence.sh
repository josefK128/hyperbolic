#!/usr/bin/sh
# or $/usr/bin/bash silence.sh
# make backup first! It operates in-place!!!!
# removes lines containing 'log(' such as console.log and Log.log
# NOTE: does not remove multi-line string-interpolated lines
# NOTE: recursive
find . -type f -name '*.js' -exec sed --in-place '/log(/d' {} \;
