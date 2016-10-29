rm -rf dist
cp -r src dist
find dist/ \( -name '*.js' -o -name '*.jsx' \) -type f -exec cp {} {}.flow \;
babel src/ -d dist/ "$@" --source-maps
