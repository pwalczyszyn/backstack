#!/bin/bash

/usr/local/bin/node r.js -o build.js out=../backstack-0.9.0.js
/usr/local/bin/node r.js -o build.js out=../backstack-min-0.9.0.js optimize=uglify
