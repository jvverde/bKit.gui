grep -P '\s+--q-color-' "$1" | perl -lape 's/.+?#[{]\$(.+)[}];/$1/'
