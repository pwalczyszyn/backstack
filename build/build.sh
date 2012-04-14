#!/bin/bash

/usr/local/bin/node r.js -o build.js out=../backstack.js
/usr/local/bin/node r.js -o build.js out=../backstack-min.js optimize=uglify
